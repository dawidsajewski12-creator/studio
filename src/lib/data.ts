import type { Project, IndexDataPoint, Station } from './types';
import { subDays, format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';

// --- Copernicus API Configuration ---
const CLIENT_ID = 'sh-216e2f62-9d93-4534-9840-e2fba090196f';
const CLIENT_SECRET = 'puq9Q6mEsKWRb8AFrZPEBesBE0Dq8uwE';
const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

const TRUE_COLOR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: {
      bands: 3,
      sampleType: "UINT8"
    }
  };
}
function evaluatePixel(sample) {
  // Simple RGB with contrast enhancement
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}
`;


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
      const isCloud = [3, 8, 9, 10].includes(sample.SCL);
      const isNoData = [0, 1, 2, 7].includes(sample.SCL);
      return { index: [ndci], dataMask: [isCloud || isNoData ? 0 : 1] };
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
    next: { revalidate: 3600 } // Cache the token fetch itself for an hour
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

export function getBoundingBox(station: Station, bufferKm = 0.5): [number, number, number, number] {
    const { lat, lng } = station.location;
    const buffer = bufferKm / 111.32; // Approx conversion of km to degrees
    return [lng - buffer, lat - buffer, lng + buffer, lat + buffer];
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

    const stationPromises = project.stations.map(async (station) => {
        // --- 1. Fetch Satellite Data ---
        const satelliteRequestBody = {
            input: {
                bounds: { bbox: getBoundingBox(station, 0.5) },
                data: [{ dataFilter: { timeRange: { from: yearAgo.toISOString(), to: today.toISOString() }}, type: "sentinel-2-l2a" }]
            },
            aggregation: {
                evalscript,
                timeRange: { from: yearAgo.toISOString(), to: today.toISOString() },
                aggregationInterval: { of: "P10D" },
                width: 256,
                height: 256,
            },
        };

        const satelliteResponse = await fetch(STATS_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(satelliteRequestBody),
            // Default Next.js caching will apply here
        });

        if (!satelliteResponse.ok) {
            console.error(`Failed to fetch satellite data for station ${station.id}: ${satelliteResponse.statusText}`, await satelliteResponse.text());
            return [];
        }
        
        const apiResponse = await satelliteResponse.json();
        const sparseData: { date: Date; value: number }[] = apiResponse.data
            .map((item: any) => {
                const stats = item.outputs.index.bands.B0.stats;
                if (stats && stats.sampleCount > 0 && stats.mean !== null && stats.mean !== -Infinity && stats.mean !== Infinity) {
                    return { date: parseISO(item.interval.from), value: Math.max(-1, Math.min(stats.mean, 1)) };
                }
                return null;
            })
            .filter((item: any): item is { date: Date; value: number } => item !== null)
            .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

        // --- 2. Fetch Weather Data ---
        const weatherDataMap = await fetchWeatherHistory(station, format(yearAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));

        // --- 3. Fuse and Interpolate Data ---
        if (sparseData.length === 0) return [];

        const allDays = eachDayOfInterval({ start: yearAgo, end: today });
        const dailySeries: IndexDataPoint[] = [];
        let sparseIndex = 0;

        // Create a full daily series, marking real data points and adding weather
        for (const day of allDays) {
            const dateStr = format(day, 'yyyy-MM-dd');
            let pointToAdd: IndexDataPoint;
            if (sparseIndex < sparseData.length && isSameDay(day, sparseData[sparseIndex].date)) {
                pointToAdd = {
                    date: day.toISOString(),
                    stationId: station.id,
                    indexValue: sparseData[sparseIndex].value,
                    isInterpolated: false,
                    temperature: weatherDataMap.get(dateStr) ?? null,
                };
                sparseIndex++;
            } else {
                pointToAdd = {
                    date: day.toISOString(),
                    stationId: station.id,
                    indexValue: null,
                    isInterpolated: true,
                    temperature: weatherDataMap.get(dateStr) ?? null,
                };
            }
            dailySeries.push(pointToAdd);
        }

        // Linear interpolation for indexValue
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
                } else if (prevIndex >= 0) {
                    dailySeries[i].indexValue = dailySeries[prevIndex].indexValue;
                } else if (nextIndex < dailySeries.length) {
                    dailySeries[i].indexValue = dailySeries[nextIndex].indexValue;
                }
            }
        }
        return dailySeries;
    });

    const results = await Promise.all(stationPromises);
    return results.flat().filter(p => p.indexValue !== null) as IndexDataPoint[];

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

        const requestBody = {
            input: {
                bounds: {
                    bbox: getBoundingBox(station, 0.5)
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
             // The API might return a JSON error instead of an image
            const errorText = await imageBlob.text();
            console.error(`API returned an error instead of an image: ${errorText}`);
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
