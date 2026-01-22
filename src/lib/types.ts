export type Station = {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type IndexDataPoint = {
  date: string; // ISO string
  stationId: Station['id'];
  cellId?: string; // Used by point analysis as well
  indexValue: number | null;
  isInterpolated: boolean;
  temperature: number | null;
  spatialCoverage?: number;
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
    analysisType: 'point'; // Grid analysis is now a special case of point analysis
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
