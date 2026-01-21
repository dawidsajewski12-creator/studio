import type { Project, IndexDataPoint, Station } from './types';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

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
    const thirtyDaysAgo = subDays(today, 30);
    const evalscript = EVALSCRIPTS[project.index.name];

    if (!evalscript) {
        throw new Error(`No evalscript found for index: ${project.index.name}`);
    }

    const allStationsData: IndexDataPoint[] = [];

    const stationPromises = project.stations.map(async (station) => {
        const requestBody = {
            input: {
                bounds: { bbox: getBoundingBox(station) },
                data: [{ dataFilter: { timeRange: { from: thirtyDaysAgo.toISOString(), to: today.toISOString() }}, type: "sentinel-2-l2a" }]
            },
            aggregation: {
                evalscript,
                timeRange: { from: thirtyDaysAgo.toISOString(), to: today.toISOString() },
                aggregationInterval: { of: "P1D" },
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
            return []; // Return empty for this station on failure
        }
        
        const apiResponse = await response.json();
        const stationData: IndexDataPoint[] = [];
        const intervalDays = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
        const resultsByDate = new Map(apiResponse.data.map((item: any) => [format(parseISO(item.interval.from), 'yyyy-MM-dd'), item.outputs.index.bands.B0.stats]));

        for (const day of intervalDays) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const stats = resultsByDate.get(dateStr);

            if (stats && stats.sampleCount > 0) {
                // Clamp index value between -1 and 1 for normalized indices
                const indexValue = Math.max(-1, Math.min(stats.mean, 1));
                stationData.push({ date: day.toISOString(), stationId: station.id, indexValue });
            } else {
                // No data or all cloudy
                stationData.push({ date: day.toISOString(), stationId: station.id, indexValue: -1 });
            }
        }
        return stationData;
    });

    const results = await Promise.all(stationPromises);
    return results.flat();

  } catch (error) {
    console.error("An error occurred while fetching Copernicus data:", error);
    return []; // Return empty data on error
  }
}
