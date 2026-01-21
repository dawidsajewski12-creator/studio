import type { Project, IndexDataPoint, Station } from './types';
import { subDays, format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';

// --- Copernicus API Configuration ---
const CLIENT_ID = 'sh-216e2f62-9d93-4534-9840-e2fba090196f';
const CLIENT_SECRET = 'puq9Q6mEsKWRb8AFrZPEBesBE0Dq8uwE';
const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';

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

function getBoundingBox(station: Station, bufferKm = 0.5) {
    const { lat, lng } = station.location;
    const buffer = bufferKm / 111.32; // Approx conversion of km to degrees
    return [lng - buffer, lat - buffer, lng + buffer, lat + buffer];
}

// This function fetches data from the Copernicus API for a given project.
export async function getProjectData(project: Project): Promise<IndexDataPoint[]> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Copernicus credentials are not set. Please provide them in your environment variables. Falling back to empty data.");
    return [];
  }

  try {
    const token = await getToken();
    const today = new Date();
    const yearAgo = subDays(today, 365);
    const evalscript = EVALSCRIPTS[project.index.name];

    if (!evalscript) {
        throw new Error(`No evalscript found for index: ${project.index.name}`);
    }

    const stationPromises = project.stations.map(async (station) => {
        const requestBody = {
            input: {
                bounds: { bbox: getBoundingBox(station) },
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

        const response = await fetch(STATS_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            console.error(`Failed to fetch data for station ${station.id}: ${response.statusText}`, await response.text());
            return [];
        }
        
        const apiResponse = await response.json();
        
        const sparseData: { date: Date; value: number }[] = apiResponse.data
            .map((item: any) => {
                const stats = item.outputs.index.bands.B0.stats;
                // Ensure there is valid data to process
                if (stats && stats.sampleCount > 0 && stats.mean !== null && stats.mean !== -Infinity && stats.mean !== Infinity) {
                    return {
                        date: parseISO(item.interval.from),
                        // Clamp values to the valid range for most indices
                        value: Math.max(-1, Math.min(stats.mean, 1)),
                    };
                }
                return null;
            })
            .filter((item: any): item is { date: Date; value: number } => item !== null)
            .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

        if (sparseData.length === 0) {
            return [];
        }

        const allDays = eachDayOfInterval({ start: yearAgo, end: today });
        const dailySeries: (IndexDataPoint & { indexValue: number | null })[] = [];
        let sparseIndex = 0;

        // Create a full daily series, marking real data points
        for (const day of allDays) {
            let pointToAdd: (IndexDataPoint & { indexValue: number | null });
            if (sparseIndex < sparseData.length && isSameDay(day, sparseData[sparseIndex].date)) {
                pointToAdd = {
                    date: day.toISOString(),
                    stationId: station.id,
                    indexValue: sparseData[sparseIndex].value,
                    isInterpolated: false,
                };
                sparseIndex++;
            } else {
                pointToAdd = {
                    date: day.toISOString(),
                    stationId: station.id,
                    indexValue: null,
                    isInterpolated: true,
                };
            }
            dailySeries.push(pointToAdd);
        }

        // Linear interpolation
        for (let i = 0; i < dailySeries.length; i++) {
            if (dailySeries[i].indexValue === null) {
                let prevIndex = i - 1;
                while (prevIndex >= 0 && dailySeries[prevIndex].indexValue === null) {
                    prevIndex--;
                }

                let nextIndex = i + 1;
                while (nextIndex < dailySeries.length && dailySeries[nextIndex].indexValue === null) {
                    nextIndex++;
                }
                
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
                } else if (prevIndex >= 0) { // Extrapolate start
                    dailySeries[i].indexValue = dailySeries[prevIndex].indexValue;
                } else if (nextIndex < dailySeries.length) { // Extrapolate end
                    dailySeries[i].indexValue = dailySeries[nextIndex].indexValue;
                } else { // No data at all
                    dailySeries[i].indexValue = 0;
                }
            }
        }
        return dailySeries as IndexDataPoint[];
    });

    const results = await Promise.all(stationPromises);
    return results.flat();

  } catch (error) {
    console.error("An error occurred while fetching Copernicus data:", error);
    return [];
  }
}
