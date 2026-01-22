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
  cellId?: string;
  indexValue: number | null; // NDSI or NDCI or NDVI
  ndmiValue?: number | null; // For vineyard project
  isInterpolated: boolean;
  temperature: number | null;
  spatialCoverage?: number;
  bloomProbability?: number;
};

export type KpiData = {
  stationId: Station['id'];
  name:string;
  latestIndexValue: number | null; // Primary index
  latestNdmiValue?: number | null; // Secondary index for vineyards
  latestDate: string | null;
  spatialCoverage?: number | null;
};

export type Project = {
    id: string;
    name: string;
    description: string;
    analysisType: 'point';
    index: {
        name: string; // "NDSI", "NDCI", "NDVI/NDMI"
        unit: string;
        names?: string[]; // For multi-index projects, e.g., ["NDVI", "NDMI"]
    };
    stations: Station[];
    dataConfig: {
        base: number;
        seasonalAmplitude: number;
        noise: number;
    }
}
