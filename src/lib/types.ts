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
  indexValue: number;
};

export type KpiData = {
  stationId: Station['id'];
  name: string;
  latestIndexValue: number | null;
  latestDate: string | null;
};

export type Project = {
    id: string;
    name: string;
    description: string;
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
