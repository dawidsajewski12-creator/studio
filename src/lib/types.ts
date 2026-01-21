export type Station = {
  id: 'valley' | 'glacier' | 'summit';
  name: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type NdsiDataPoint = {
  date: string; // ISO string
  stationId: Station['id'];
  ndsi: number;
};

export type KpiData = {
  stationId: Station['id'];
  name: string;
  latestNdsi: number | null;
  latestDate: string | null;
};
