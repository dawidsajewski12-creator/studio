
import type { Project, IndexDataPoint, Station } from './types';
import { subDays, format, eachDayOfInterval, parseISO, isSameDay, differenceInDays, addDays, isBefore } from 'date-fns';
import { promises as fs } from 'fs';
import path from 'path';
import { getBoundingBox } from './gis-utils';
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
    input: ["B04", "B03", "B02", "SCL"],
    output: {
      bands: 3,
      sampleType: "UINT8"
    }
  };
}

function evaluatePixel(sample) {
  // Mask clouds and shadows
  if ([3, 8, 9, 10].includes(sample.SCL)) {
    // Return a transparent pixel for clouds/shadows
    return [0,0,0,0];
  }
  // Simple RGB with contrast enhancement
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}
`;

// --- Caching Configuration ---
const CACHE_FILE = path.join(process.cwd(), 'data_cache.json');
type CacheData = {
    [stationId: string]: { date: string; value: number | null }[];
};


// --- Evalscripts for different indices ---
const EVALSCRIPTS: Record<string, string> = {
  NDSI: `
    //VERSION=3
    function setup() {
      return {
        input: [{ bands: ["B03", "B11", "SCL"], units: "DN" }],
        output: [ { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1, sampleType: "UINT8" }]
      };
    }
    function evaluatePixel(sample) {
      let ndsi = (sample.B03 - sample.B11) / (sample.B03 + sample.B11);
      const isCloud = [3, 8, 9, 10].includes(sample.SCL);
      const isNoData = [0, 1, 2, 7].includes(sample.SCL);
      return { index: [ndsi], dataMask: [isCloud || isNoData ? 0 : 1] };
    }`,
  NDVI: `
    //VERSION=3
    function setup() {
      return {
        input: [{ bands: ["B04", "B08", "SCL"], units: "DN" }],
        output: [ { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1, sampleType: "UINT8" }]
      };
    }
    function evaluatePixel(sample) {
      let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
      const isCloud = [3, 8, 9, 10].includes(sample.SCL);
      const isNoData = [0, 1, 2, 7].includes(sample.SCL);
      return { index: [ndvi], dataMask: [isCloud || isNoData ? 0 : 1] };
    }`,
  NDBI: `
    //VERSION=3
    function setup() {
      return {
        input: [{ bands: ["B08", "B11", "SCL"], units: "DN" }],
        output: [ { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1, sampleType: "UINT8" }]
      };
    }
    function evaluatePixel(sample) {
      let ndbi = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
      const isCloud = [3, 8, 9, 10].includes(sample.SCL);
      const isNoData = [0, 1, 2, 7].includes(sample.SCL);
      return { index: [ndbi], dataMask: [isCloud || isNoData ? 0 : 1] };
    }`,
  NDWI: `
    //VERSION=3
    function setup() {
      return {
        input: [{ bands: ["B03", "B08", "SCL"], units: "DN" }],
        output: [ { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1, sampleType: "UINT8" }]
      };
    }
    function evaluatePixel(sample) {
      let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
      const isCloud = [3, 8, 9, 10].includes(sample.SCL);
      const isNoData = [0, 1, 2, 7].includes(sample.SCL);
      return { index: [ndwi], dataMask: [isCloud || isNoData ? 0 : 1] };
    }`,
  NDCI: `
    //VERSION=3
    function setup() {
      return {
        input: [{ bands: ["B04", "B05", "SCL"], units: "DN" }],
        output: [ { id: "index", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1, sampleType: "UINT8" }]
      };
    }
    function evaluatePixel(sample) {
      let ndci = (sample.B05 - sample.B04) / (sample.B05 + sample.B04);
      // Allow Water(6), Vegetation(4), and Not Vegetated(5) to capture thick algal blooms.
      // Exclude clouds, shadows, snow etc.
      const isValid = [4, 5, 6].includes(sample.SCL);
      return { index: [ndci], dataMask: [isValid ? 1 : 0] };
    }`,
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
    const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache weather data for a day
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

// This function fetches and processes data from the Copernicus and Open-Meteo APIs.
export async function getProjectData(project: Project): Promise<IndexDataPoint[]> {
  try {
    const token = await getToken();
    const today = new Date();
    const yearAgo = subDays(today, 365);
    const evalscript = EVALSCRIPTS[project.index.name];

    if (!evalscript) {
        throw new Error(`No evalscript found for index: ${project.index.name}`);
    }
    
    // --- Caching Logic ---
    let cache: CacheData = {};
    try {
        const cacheFileContent = await fs.readFile(CACHE_FILE, 'utf-8');
        cache = JSON.parse(cacheFileContent);
    } catch (error) {
        console.log("Cache file not found or invalid. A new one will be created.");
    }
    let isCacheUpdated = false;

    const stationPromises = project.stations.map(async (station) => {
        const stationCache = cache[station.id] || [];
        let sparseDataFromCache: { date: Date; value: number | null }[] = [];
        let fetchFromDate = yearAgo;
        let needsApiCall = true;

        if (stationCache.length > 0) {
            const sortedStationCache = stationCache.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
            const lastRecordedDate = parseISO(sortedStationCache[sortedStationCache.length - 1].date);
            const daysDiff = differenceInDays(today, lastRecordedDate);
            
            sparseDataFromCache = sortedStationCache.map(d => ({ date: parseISO(d.date), value: d.value }));

            if (daysDiff < 7) {
                console.log(`[${station.id}] Using fresh cache (< 7 days old).`);
                needsApiCall = false;
            } else {
                console.log(`[${station.id}] Stale cache (>= 7 days old). Will fetch new data from ${format(addDays(lastRecordedDate, 1), 'yyyy-MM-dd')}.`);
                fetchFromDate = addDays(lastRecordedDate, 1);
            }
        } else {
             console.log(`[${station.id}] No cache found. Will fetch full history.`);
             fetchFromDate = yearAgo;
        }

        let finalSparseData = sparseDataFromCache;

        if (needsApiCall && isBefore(fetchFromDate, today)) {
             const bufferKm = project.id === 'lake-quality' ? 2.5 : 0.5;
             const satelliteRequestBody = {
                input: {
                    bounds: { bbox: getBoundingBox(station, bufferKm) },
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
                const newSparseDataFromApi: { date: Date; value: number | null }[] = apiResponse.data
                    .map((item: any) => {
                        const stats = item.outputs.index.bands.B0.stats;
                        if (stats && stats.sampleCount > 0 && stats.mean !== null && stats.mean !== -Infinity && stats.mean !== Infinity) {
                            return { date: parseISO(item.interval.from), value: Math.max(-1, Math.min(stats.mean, 1)) };
                        }
                        // Return a record with null value if there was no valid data (e.g. all masked out)
                        return { date: parseISO(item.interval.from), value: null };
                    });

                if (newSparseDataFromApi.length > 0) {
                    isCacheUpdated = true;
                    const combinedData = [...finalSparseData, ...newSparseDataFromApi];
                    const dataMap = new Map<string, { date: Date; value: number | null }>();
                    combinedData.forEach(d => dataMap.set(format(d.date, 'yyyy-MM-dd'), d));
                    finalSparseData = Array.from(dataMap.values()).sort((a,b) => a.date.getTime() - b.date.getTime());
                    cache[station.id] = finalSparseData.map(d => ({ date: d.date.toISOString(), value: d.value }));
                }
            }
        }
        const sparseData = finalSparseData.filter(d => isSameDay(d.date, yearAgo) || isBefore(yearAgo, d.date));
        
        const weatherStartDate = project.id === 'lake-quality' ? subDays(today, 365) : yearAgo;
        const weatherDataMap = await fetchWeatherHistory(station, format(weatherStartDate, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
        
        if (sparseData.length === 0) return [];

        const allDays = eachDayOfInterval({ start: yearAgo, end: today });
        const dailySeries: IndexDataPoint[] = [];
        
        const sparseDataMap = new Map(sparseData.map(d => [format(d.date, 'yyyy-MM-dd'), d.value]));

        for (const day of allDays) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasRealValue = sparseDataMap.has(dateStr);
            const indexValue = sparseDataMap.get(dateStr) ?? null;

            dailySeries.push({
                date: day.toISOString(),
                stationId: station.id,
                indexValue: indexValue,
                isInterpolated: !hasRealValue,
                temperature: weatherDataMap.get(dateStr) ?? null,
            });
        }

        // Interpolation step
        for (let i = 0; i < dailySeries.length; i++) {
            if (dailySeries[i].indexValue === null) {
                let prevIndex = i - 1;
                while (prevIndex >= 0 && dailySeries[prevIndex].indexValue === null) prevIndex--;
                
                let nextIndex = i + 1;
                while (nextIndex < dailySeries.length && dailySeries[nextIndex].indexValue === null) nextIndex++;
                
                if (prevIndex >= 0 && nextIndex < dailySeries.length) {
                    const prevPoint = dailySeries[prevIndex];
                    const nextPoint = dailySeries[nextIndex];
                    const prevValue = prevPoint.indexValue!;
                    const nextValue = nextPoint.indexValue!;
                    const prevTime = parseISO(prevPoint.date).getTime();
                    const nextTime = parseISO(nextPoint.date).getTime();
                    const currentTime = parseISO(dailySeries[i].date).getTime();
                    
                    const fraction = (currentTime - prevTime) / (nextTime - prevTime);
                    dailySeries[i].indexValue = prevValue + fraction * (nextValue - prevValue);
                } else if (prevIndex >= 0) { // Extrapolate backward
                    dailySeries[i].indexValue = dailySeries[prevIndex].indexValue;
                } else if (nextIndex < dailySeries.length) { // Extrapolate forward
                    dailySeries[i].indexValue = dailySeries[nextIndex].indexValue;
                }
            }
        }
        return dailySeries;
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
        const bufferKm = project.id === 'lake-quality' ? 2.5 : 0.5;

        const requestBody = {
            input: {
                bounds: {
                    bbox: getBoundingBox(station, bufferKm)
                },
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
            body: JSON.stringify(requestBody),
            cache: 'no-store',
        });

        if (!response.ok || !response.body) {
            console.error(`Failed to fetch latest visual for station ${station.id}: ${response.statusText}`);
            return null;
        }

        const imageBlob = await response.blob();
        if (imageBlob.type !== 'image/png') {
            const errorText = await imageBlob.text();
            if (errorText.includes("No data found")) {
                console.warn(`No cloud-free visual found for ${station.id} in the last 60 days.`);
            } else {
                console.error(`API returned an error instead of an image: ${errorText}`);
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
