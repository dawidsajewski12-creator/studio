export type Station = {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  bbox?: [number, number, number, number];
  gridShape?: [number, number]; // e.g., [width, height] in cells
};

export type IndexDataPoint = {
  date: string; // ISO string
  stationId: Station['id'];
  cellId?: string; // Add this for grid cells
  indexValue: number | null; // Allow null before interpolation
  isInterpolated: boolean;
  temperature: number | null;
};

export type KpiData = {
  stationId: Station['id'];
  name:string;
  latestIndexValue: number | null;
  latestDate: string | null;
  spatialCoverage?: number | null;
};

export type Project = {
    id: string;
    name: string;
    description: string;
    analysisType: 'point' | 'grid';
    index: {
        name: string;
        unit: string;
    };
    stations: Station[];
    dataConfig: {
        base: number;
        seasonalAmplitude: number;
        noise: number;
    }
}
