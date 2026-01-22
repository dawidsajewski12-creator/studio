import type { Project, IndexDataPoint, Station } from './types';
import { subDays, format, eachDayOfInterval, parseISO, isSameDay, differenceInDays, addDays, isBefore } from 'date-fns';
import { promises as fs } from 'fs';
import path from 'path';
import { getGridCellsForStation } from './gis-utils';
import { PROJECTS } from './projects';


// --- Copernicus API Configuration ---
const CLIENT_ID = process.env.COPERNICUS_CLIENT_ID || 'sh-216e2f62-9d93-4534-9840-e2fba090196f';
const CLIENT_SECRET = process.env.COPERNICUS_CLIENT_SECRET || 'puq9Q6mEsKWRb8AFrZPEBesBE0Dq8uwE';
const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

const TRUE_COLOR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B03", "B02", "SCL"], units: "DN" }],
    output: { bands: 4, sampleType: "UINT8" }
  };
}

function evaluatePixel(sample) {
  if ([3, 8, 9, 10, 11].includes(sample.SCL) || sample.SCL === 1) { 
    return [0, 0, 0, 0];
  }
  
  const gain = 2.5;
  const r = Math.max(0, Math.min(255, 255 * (gain * sample.B04 / 3000)));
  const g = Math.max(0, Math.min(255, 255 * (gain * sample.B03 / 3000)));
  const b = Math.max(0, Math.min(255, 255 * (gain * sample.B02 / 3000)));

  return [r, g, b, 255];
}
`;

// --- Caching Configuration ---
const CACHE_FILE = path.join(process.cwd(), 'data_cache.json');
type CacheData = {
    [id: string]: { date: string; value: number | null; ndmiValue?: number | null }[];
};


// --- Evalscripts for different indices ---
const EVALSCRIPTS: Record<string, string> = {
  NDSI: `
//VERSION=3
function setup(){return{input:[{bands:["B03","B11","SCL"],units:"DN"}],output:[{id:"index",bands:1,sampleType:"FLOAT32"},{id:"dataMask",bands:1,sampleType:"UINT8"}]}}
function evaluatePixel(e){let t=(e.B03-e.B11)/(e.B03+e.B11);return{index:[t],dataMask:[[3,8,9,10].includes(e.SCL)||0==e.B03&&0==e.B11?0:1]}}`,
  NDCI: `
//VERSION=3
function setup(){return{input:[{bands:["B04","B05","SCL"],units:"DN"}],output:[{id:"index",bands:1,sampleType:"FLOAT32"},{id:"dataMask",bands:1,sampleType:"UINT8"}]}}
function evaluatePixel(e){if([2,4,5,6,7].includes(e.SCL)){let t=(e.B05-e.B04)/(e.B05+e.B04);return{index:[t],dataMask:[1]}}return{index:[0],dataMask:[0]}}`,
  "NDVI/NDMI": `
//VERSION=3
function setup(){return{input:[{bands:["B04","B08","B11","SCL"],units:"DN"}],output:[{id:"INDICES",bands:2,sampleType:"FLOAT32"}]}}
function evaluatePixel(e){if(![4,5].includes(e.SCL))return{INDICES:[NaN,NaN]};let t=(e.B08-e.B04)/(e.B08+e.B04),a=(e.B08-e.B11)/(e.B08+e.B11);return{INDICES:[t,a]}}`,
};

// --- API Helper Functions ---
let tokenCache: { access_token: string; expires_at: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Copernicus client ID or secret not configured.");
  }

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get Copernicus auth token: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // 60s buffer
  };
  return tokenCache.access_token;
}

async function fetchWeatherHistory(station: Station, startDate: string, endDate: string): Promise<Map<string, number>> {
  const { lat, lng } = station.location;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) {
      console.error(`Failed to fetch weather data for station ${station.id}: ${response.statusText}`);
      return new Map();
    }
    const data = await response.json();
    const weatherMap = new Map<string, number>();
    data.daily.time.forEach((time: string, index: number) => {
      weatherMap.set(time, data.daily.temperature_2m_mean[index]);
    });
    return weatherMap;
  } catch (error) {
    console.error(`Error fetching weather data for station ${station.id}:`, error);
    return new Map();
  }
}

export async function getProjectData(project: Project): Promise<IndexDataPoint[]> {
  try {
    const token = await getToken();
    const today = new Date();
    const yearAgo = subDays(today, 365);
    const evalscript = EVALSCRIPTS[project.index.name];

    if (!evalscript) {
        throw new Error(`No evalscript found for index: ${project.index.name}`);
    }
    
    let cache: CacheData = {};
    try {
        const cacheFileContent = await fs.readFile(CACHE_FILE, 'utf-8');
        cache = JSON.parse(cacheFileContent);
    } catch (error) {
        console.log("Cache file not found or invalid. A new one will be created.");
    }
    let isCacheUpdated = false;

    const representativeStation = project.stations[0];
    const weatherDataMap = representativeStation 
        ? await fetchWeatherHistory(representativeStation, format(yearAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'))
        : new Map<string, number>();


    const stationPromises = project.stations.map(async (station) => {
        let fetchTasks = getGridCellsForStation(station, project);
        
        const allTaskDataPromises = fetchTasks.map(async (task) => {
            const taskCache = cache[task.cellId] || [];
            let sparseDataFromCache: { date: Date; value: number | null; ndmiValue?: number | null }[] = [];
            let fetchFromDate = yearAgo;
            let needsApiCall = true;

            if (taskCache.length > 0) {
                const sortedTaskCache = taskCache.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
                const lastRecordedDate = parseISO(sortedTaskCache[sortedTaskCache.length - 1].date);
                const daysDiff = differenceInDays(today, lastRecordedDate);
                
                sparseDataFromCache = sortedTaskCache.map(d => ({ date: parseISO(d.date), value: d.value, ndmiValue: d.ndmiValue }));

                if (daysDiff < 7) {
                    needsApiCall = false;
                } else {
                    fetchFromDate = addDays(lastRecordedDate, 1);
                }
            }
            
            let finalSparseData = sparseDataFromCache;

            if (needsApiCall && isBefore(fetchFromDate, today)) {
                const satelliteRequestBody = {
                   input: {
                       bounds: { bbox: task.bbox },
                       data: [{ dataFilter: { timeRange: { from: fetchFromDate.toISOString(), to: today.toISOString() }}, type: "sentinel-2-l2a" }]
                   },
                   aggregation: {
                       evalscript,
                       timeRange: { from: fetchFromDate.toISOString(), to: today.toISOString() },
                       aggregationInterval: { of: "P1D" },
                       width: 1,
                       height: 1,
                   },
               };

                const satelliteResponse = await fetch(STATS_URL, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(satelliteRequestBody),
                });

                if (!satelliteResponse.ok) {
                    console.error(`Failed to fetch satellite data for station ${station.id}: ${satelliteResponse.statusText}`, await satelliteResponse.text());
                } else {
                    const apiResponse = await satelliteResponse.json();
                    const newSparseDataFromApi = apiResponse.data
                        .map((item: any) => {
                            if (project.index.name === 'NDVI/NDMI') {
                                const statsNdvi = item.outputs.INDICES.bands.B0.stats;
                                const statsNdmi = item.outputs.INDICES.bands.B1.stats;
                                const ndvi = (statsNdvi.sampleCount > 0 && statsNdvi.mean !== null && !isNaN(statsNdvi.mean)) ? Math.max(-1, Math.min(1, statsNdvi.mean)) : null;
                                const ndmi = (statsNdmi.sampleCount > 0 && statsNdmi.mean !== null && !isNaN(statsNdmi.mean)) ? Math.max(-1, Math.min(1, statsNdmi.mean)) : null;
                                return { date: parseISO(item.interval.from), value: ndvi, ndmiValue: ndmi };
                            } else {
                                const stats = item.outputs.index.bands.B0.stats;
                                const value = (stats && stats.sampleCount > 0 && stats.mean !== null && !isNaN(stats.mean)) ? Math.max(-1, Math.min(stats.mean, 1)) : null;
                                return { date: parseISO(item.interval.from), value };
                            }
                        });

                    if (newSparseDataFromApi.length > 0) {
                        isCacheUpdated = true;
                        const combinedData = [...finalSparseData, ...newSparseDataFromApi];
                        const dataMap = new Map<string, { date: Date; value: number | null; ndmiValue?: number | null }>();
                        combinedData.forEach(d => dataMap.set(format(d.date, 'yyyy-MM-dd'), d));
                        finalSparseData = Array.from(dataMap.values()).sort((a,b) => a.date.getTime() - b.date.getTime());
                        cache[task.cellId] = finalSparseData.map(d => ({ date: d.date.toISOString(), value: d.value, ndmiValue: d.ndmiValue }));
                    }
                }
            }

            const sparseData = finalSparseData.filter(d => isSameDay(d.date, yearAgo) || isBefore(yearAgo, d.date));
            if (sparseData.length === 0) return [];
            
            const allDays = eachDayOfInterval({ start: yearAgo, end: today });
            const dailySeries: IndexDataPoint[] = [];
            const sparseDataMap = new Map(sparseData.map(d => [format(d.date, 'yyyy-MM-dd'), { value: d.value, ndmiValue: d.ndmiValue }]));

            for (const day of allDays) {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dataPoint = sparseDataMap.get(dateStr);

                dailySeries.push({
                    date: day.toISOString(),
                    stationId: station.id,
                    cellId: task.cellId,
                    indexValue: dataPoint?.value ?? null,
                    ndmiValue: dataPoint?.ndmiValue ?? null,
                    isInterpolated: !dataPoint,
                    temperature: weatherDataMap.get(dateStr) ?? null,
                });
            }

            // Interpolation step for primary index
            for (let i = 0; i < dailySeries.length; i++) {
                if (dailySeries[i].indexValue === null) {
                    let prevIndex = i - 1;
                    while (prevIndex >= 0 && dailySeries[prevIndex].indexValue === null) prevIndex--;
                    
                    let nextIndex = i + 1;
                    while (nextIndex < dailySeries.length && dailySeries[nextIndex].indexValue === null) nextIndex++;
                    
                    if (prevIndex >= 0 && nextIndex < dailySeries.length) {
                        const prevPoint = dailySeries[prevIndex];
                        const nextPoint = dailySeries[nextIndex];
                        if (prevPoint.indexValue !== null && nextPoint.indexValue !== null) {
                             const fraction = (parseISO(dailySeries[i].date).getTime() - parseISO(prevPoint.date).getTime()) / (parseISO(nextPoint.date).getTime() - parseISO(prevPoint.date).getTime());
                            dailySeries[i].indexValue = prevPoint.indexValue + fraction * (nextPoint.indexValue - prevPoint.indexValue);
                        }
                    }
                }
            }
             // Interpolation step for secondary index (NDMI)
            if (project.index.name === 'NDVI/NDMI') {
                for (let i = 0; i < dailySeries.length; i++) {
                    if (dailySeries[i].ndmiValue === null) {
                        let prevIndex = i - 1;
                        while (prevIndex >= 0 && dailySeries[prevIndex].ndmiValue === null) prevIndex--;
                        
                        let nextIndex = i + 1;
                        while (nextIndex < dailySeries.length && dailySeries[nextIndex].ndmiValue === null) nextIndex++;
                        
                        if (prevIndex >= 0 && nextIndex < dailySeries.length) {
                             const prevPoint = dailySeries[prevIndex];
                            const nextPoint = dailySeries[nextIndex];
                            if (prevPoint.ndmiValue !== null && nextPoint.ndmiValue !== null) {
                                 const fraction = (parseISO(dailySeries[i].date).getTime() - parseISO(prevPoint.date).getTime()) / (parseISO(nextPoint.date).getTime() - parseISO(prevPoint.date).getTime());
                                dailySeries[i].ndmiValue = prevPoint.ndmiValue + fraction * (nextPoint.ndmiValue - prevPoint.ndmiValue);
                            }
                        }
                    }
                }
            }
            return dailySeries;
        });

        const allTaskData = await Promise.all(allTaskDataPromises);
        return allTaskData.flat();
    });

    const results = await Promise.all(stationPromises);
    
    if (isCacheUpdated) {
        try {
            await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
            console.log("Cache file updated.");
        } catch (error) {
            console.error("Failed to write to cache file:", error);
        }
    }
    
    return results.flat();

  } catch (error) {
    console.error("An error occurred in the main data pipeline:", error);
    return [];
  }
}

export async function getLatestVisual(station: Station): Promise<string | null> {
    try {
        const token = await getToken();
        const today = new Date();
        const sixtyDaysAgo = subDays(today, 60);

        const project = PROJECTS.find(p => p.stations.some(s => s.id === station.id));
        if (!project) return null;
        
        const bufferKm = 0.5;
        const { lat, lng } = station.location;
        const buffer = bufferKm / 111.32;
        const bbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

        const requestBody = {
            input: {
                bounds: { bbox },
                data: [{
                    type: "sentinel-2-l2a",
                    dataFilter: {
                        timeRange: {
                            from: sixtyDaysAgo.toISOString(),
                            to: today.toISOString()
                        },
                        maxCloudCoverage: 40, 
                    }
                }]
            },
            output: {
                width: 512,
                height: 512,
                responses: [{
                    identifier: "default",
                    format: {
                        type: "image/png"
                    }
                }]
            },
            evalscript: TRUE_COLOR_EVALSCRIPT
        };
        
        const response = await fetch(PROCESS_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'image/png'
            },
            cache: 'no-store',
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBodyText = await response.text();
            if (errorBodyText.includes("No data found")) {
                console.warn(`No cloud-free visual found for ${station.id} in the last 60 days.`);
            } else {
                console.error(`Failed to fetch latest visual for station ${station.id}: ${response.statusText}`, errorBodyText);
            }
            return null;
        }

        const imageBlob = await response.blob();
        
        if (imageBlob.type !== 'image/png') {
            const errorBodyText = await imageBlob.text();
            if (errorBodyText.includes("No data found")) {
                console.warn(`No cloud-free visual found for ${station.id} (after checking blob).`);
            } else {
                 console.error(`API returned an unexpected content type: ${imageBlob.type}`, errorBodyText);
            }
            return null;
        }
        
        const imageBuffer = await imageBlob.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        return `data:image/png;base64,${base64Image}`;

    } catch (error) {
        console.error(`Error fetching latest visual for station ${station.id}:`, error);
        return null;
    }
}
