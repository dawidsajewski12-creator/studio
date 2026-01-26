
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
  if ([3, 8, 9, 10, 11].includes(sample.SCL) || sample.SCL === 1 || sample.SCL === 6) { 
    return [0, 0, 0, 0];
  }
  const gain = 2.5;
  const r = Math.max(0, Math.min(255, 255 * (gain * sample.B04 / 3000)));
  const g = Math.max(0, Math.min(255, 255 * (gain * sample.B03 / 3000)));
  const b = Math.max(0, Math.min(255, 255 * (gain * sample.B02 / 3000)));
  return [r, g, b, 255];
}`;

// --- Caching Configuration ---
const OPTICAL_CACHE_FILE = path.join(process.cwd(), 'data_cache.json');
const RADAR_CACHE_FILE = path.join(process.cwd(), 'radar_cache.json');

type CacheData = {
    [id: string]: { date: string; value: number | null; ndmiValue?: number | null, radarValue?: number | null }[];
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
function evaluatePixel(e){if(![3,8,9,10,11].includes(e.SCL)&&[2,4,5,6,7].includes(e.SCL)){let t=(e.B05-e.B04)/(e.B05+e.B04);return{index:[t],dataMask:[1]}}return{index:[0],dataMask:[0]}}`,
  "NDVI/NDMI": `
//VERSION=3
function setup(){return{input:[{bands:["B04","B08","B11","SCL"],units:"DN"}],output:[{id:"INDICES",bands:2,sampleType:"FLOAT32"},{id:"dataMask",bands:1,sampleType:"UINT8"}]}}
function evaluatePixel(e){if(![4,5].includes(e.SCL))return{INDICES:[NaN,NaN],dataMask:[0]};let t=(e.B08-e.B04)/(e.B08+e.B04),a=(e.B08-e.B11)/(e.B08+e.B11);return{INDICES:[t,a],dataMask:[1]}}`,
  RADAR: `
//VERSION=3
function setup() {
  return {
    input: ["VV", "dataMask"],
    output: [
        { id: "index", bands: 1, sampleType: "FLOAT32" },
        { id: "dataMask", bands: 1, sampleType: "UINT8" }
    ]
  };
}
function evaluatePixel(sample) {
    if (sample.dataMask === 0) {
        return { index: [NaN], dataMask: [0] };
    }
    const db = 20 * Math.log10(sample.VV);
    if (!isFinite(db)) {
        return { index: [NaN], dataMask: [0] };
    }
    return { index: [db], dataMask: [1] };
}`
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

async function getAndCacheSensorData(
    task: { cellId: string, bbox: [number, number, number, number] },
    dataType: 'optical' | 'radar',
    project: Project,
    token: string,
    dateLimit: Date,
    today: Date
): Promise<{ date: string; value: number | null; ndmiValue?: number | null; cellId: string }[]> {
    const cacheFile = dataType === 'optical' ? OPTICAL_CACHE_FILE : RADAR_CACHE_FILE;
    const isVineyard = project.index.name === 'NDVI/NDMI';
    const collection = dataType === 'optical' ? "sentinel-2-l2a" : "sentinel-1-grd";
    const evalscript = dataType === 'optical' ? EVALSCRIPTS[project.index.name] : EVALSCRIPTS.RADAR;
    
    let processingOptions = {};
    if (dataType === 'radar') {
        processingOptions = { backCoeff: "GAMMA0_TERRAIN", orthorectify: true };
    }

    let cache: CacheData = {};
    try {
        const cacheFileContent = await fs.readFile(cacheFile, 'utf-8');
        cache = JSON.parse(cacheFileContent);
    } catch (error) {
        console.log(`Cache file ${cacheFile} not found or invalid. A new one will be created.`);
    }

    let isCacheUpdated = false;
    let allSensorData: { date: string; value: number | null; ndmiValue?: number | null, cellId: string }[] = [];

    const taskCache = cache[task.cellId] || [];
    let sparseDataFromCache: { date: Date; value: number | null; ndmiValue?: number | null }[] = [];
    let fetchFromDate = dateLimit;

    if (taskCache.length > 0) {
        const sortedTaskCache = taskCache.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        const lastRecordedDate = parseISO(sortedTaskCache[sortedTaskCache.length - 1].date);
        sparseDataFromCache = sortedTaskCache.map(d => ({ date: parseISO(d.date), value: d.value, ndmiValue: d.ndmiValue }));

        if (differenceInDays(today, lastRecordedDate) < 7) {
            console.log(`Data for ${task.cellId} (${dataType}) is recent. Using cache.`);
        } else {
            fetchFromDate = addDays(lastRecordedDate, 1);
            console.log(`Fetching delta for ${task.cellId} (${dataType}) from ${format(fetchFromDate, 'yyyy-MM-dd')}`);
        }
    } else {
        console.log(`Cache empty for ${task.cellId} (${dataType}). Fetching full year.`);
    }

    if (isBefore(fetchFromDate, today)) {
         const satelliteRequestBody = {
            input: {
                bounds: { bbox: task.bbox },
                data: [{ 
                    dataFilter: { timeRange: { from: fetchFromDate.toISOString(), to: today.toISOString() }}, 
                    type: collection,
                    processing: processingOptions
                }]
            },
            aggregation: {
                evalscript,
                timeRange: { from: fetchFromDate.toISOString(), to: today.toISOString() },
                aggregationInterval: { of: "P1D" },
                width: 1,
                height: 1,
            },
        };

        const response = await fetch(STATS_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(satelliteRequestBody),
        });

        if (response.ok) {
            const apiResponse = await response.json();
            const newApiData = apiResponse.data.map((item: any) => {
                let value: number | null = null;
                let ndmiValue: number | null = null;

                if (dataType === 'optical' && isVineyard) {
                    const statsNdvi = item.outputs.INDICES.bands.B0.stats;
                    const statsNdmi = item.outputs.INDICES.bands.B1.stats;
                    value = (statsNdvi.sampleCount > 0 && statsNdvi.mean !== null && !isNaN(statsNdvi.mean)) ? Math.max(-1, Math.min(1, statsNdvi.mean)) : null;
                    ndmiValue = (statsNdmi.sampleCount > 0 && statsNdmi.mean !== null && !isNaN(statsNdmi.mean)) ? Math.max(-1, Math.min(1, statsNdmi.mean)) : null;
                } else { // Optical (non-vineyard) and Radar
                    const stats = item.outputs.index?.bands?.B0?.stats;
                    value = (stats && stats.sampleCount > 0 && stats.mean !== null && !isNaN(stats.mean)) ? stats.mean : null;
                }
                return { date: item.interval.from, value, ndmiValue };
            }).filter((d: any) => d.value !== null || d.ndmiValue !== null);

            const dataMap = new Map(sparseDataFromCache.map(d => [format(d.date, 'yyyy-MM-dd'), { value: d.value, ndmiValue: d.ndmiValue }]));
            newApiData.forEach((d: any) => dataMap.set(format(parseISO(d.date), 'yyyy-MM-dd'), { value: d.value, ndmiValue: d.ndmiValue }));

            const combinedSortedData = Array.from(dataMap.entries())
                .map(([date, data]) => ({ date, value: data.value, ndmiValue: data.ndmiValue }))
                .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

            cache[task.cellId] = combinedSortedData.map(d => ({...d, date: parseISO(d.date).toISOString()}));
            isCacheUpdated = true;
        } else {
             console.error(`Failed to fetch ${dataType} data for task ${task.cellId}: ${response.statusText}`, await response.text());
        }
    }

    allSensorData.push(...(cache[task.cellId] || []).map(d => ({...d, cellId: task.cellId })));
    
    if (isCacheUpdated) {
        try {
            await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
            console.log(`Cache file ${cacheFile} updated.`);
        } catch (error) {
            console.error(`Failed to write to cache file ${cacheFile}:`, error);
        }
    }

    return allSensorData;
}


export async function getProjectData(project: Project): Promise<IndexDataPoint[]> {
  try {
    const token = await getToken();
    const today = new Date();
    const dateLimit = subDays(today, 365);

    const representativeStation = project.stations[0];
    const weatherDataMap = representativeStation 
        ? await fetchWeatherHistory(representativeStation, format(dateLimit, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'))
        : new Map<string, number>();

    const allTasks = project.stations.flatMap(station => getGridCellsForStation(station, project));
    
    let opticalData: { date: string; value: number | null; ndmiValue?: number | null; cellId: string }[] = [];
    let radarData: { date: string; value: number | null; cellId: string }[] = [];

    for (const task of allTasks) {
        opticalData.push(...await getAndCacheSensorData(task, 'optical', project, token, dateLimit, today));
        
        if (project.id.includes('vineyard')) {
            await new Promise(resolve => setTimeout(resolve, 250));
            radarData.push(...await getAndCacheSensorData(task, 'radar', project, token, dateLimit, today));
        }
    }

    const mappedRadarData = radarData.map(item => ({
        date: item.date,
        radarValue: item.value,
        cellId: item.cellId
    }));
    if (project.id.includes('vineyard')) {
      console.log(`DEBUG: Found ${opticalData.filter(p=>p.value !== null).length} valid optical points and ${mappedRadarData.length} radar points in total.`);
    }

    const allDataMap = new Map<string, Partial<IndexDataPoint>>();

    const processData = (data: any[], isRadar: boolean = false) => {
        data.forEach(d => {
            const dateStr = format(parseISO(d.date), 'yyyy-MM-dd');
            const key = `${dateStr}-${d.cellId}`;
            const existing = allDataMap.get(key) || { date: d.date, cellId: d.cellId };
            
            if (isRadar) {
                existing.radarValue = d.radarValue;
            } else {
                existing.indexValue = d.value;
                if (d.ndmiValue !== undefined) existing.ndmiValue = d.ndmiValue;
            }
            allDataMap.set(key, existing);
        });
    };

    processData(opticalData);
    processData(mappedRadarData, true);

    const allDays = eachDayOfInterval({ start: dateLimit, end: today });
    const finalData: IndexDataPoint[] = [];

    project.stations.forEach(station => {
        getGridCellsForStation(station, project).forEach(cell => {
             const sparseDataMap = new Map(
                Array.from(allDataMap.values())
                    .filter(d => d.cellId === cell.cellId)
                    .map(d => [format(parseISO(d.date!), 'yyyy-MM-dd'), d])
            );

            allDays.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dataPoint = sparseDataMap.get(dateStr);
                finalData.push({
                    date: day.toISOString(),
                    stationId: station.id,
                    cellId: cell.cellId,
                    indexValue: dataPoint?.indexValue ?? null,
                    ndmiValue: dataPoint?.ndmiValue ?? null,
                    radarValue: dataPoint?.radarValue ?? null,
                    isInterpolated: !dataPoint,
                    temperature: weatherDataMap.get(dateStr) ?? null,
                });
            });
        });
    });

    console.log(`Final processed data points: ${finalData.length}`);
    return finalData;

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
