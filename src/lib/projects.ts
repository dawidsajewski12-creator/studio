import type { Project } from './types';

const maggioreStations = [
  { lat: 45.965, lng: 8.634 }, { lat: 45.910, lng: 8.560 }, 
  { lat: 45.935, lng: 8.610 }, { lat: 46.010, lng: 8.680 }, { lat: 45.985, lng: 8.650 },
  { lat: 45.820, lng: 8.580 }, { lat: 45.885, lng: 8.545 }, { lat: 46.050, lng: 8.730 }
].map((loc, i) => ({
  id: `maggiore_${i}`,
  name: `Maggiore Pt. ${i + 1}`,
  location: { lat: loc.lat, lng: loc.lng }
}));

const sniardwyStations = [
  { lat: 53.755, lng: 21.725 }, { lat: 53.740, lng: 21.780 }, { lat: 53.725, lng: 21.680 },
  { lat: 53.770, lng: 21.650 }, { lat: 53.785, lng: 21.750 }, { lat: 53.710, lng: 21.730 },
  { lat: 53.735, lng: 21.840 }, { lat: 53.765, lng: 21.810 }, { lat: 53.695, lng: 21.760 },
  { lat: 53.750, lng: 21.690 }
].map((loc, i) => ({
  id: `sniardwy_${i}`,
  name: `Śniardwy Pt. ${i + 1}`,
  location: { lat: loc.lat, lng: loc.lng }
}));


export const PROJECTS: Project[] = [
  {
    id: 'snow-watch',
    name: 'Alpine Snow Watch',
    analysisType: 'point',
    description: 'Monitoring snow cover in high-altitude regions. (CH/IT)',
    index: { name: 'NDSI', unit: '' },
    stations: [
        { id: 'zermatt', name: 'Valley (Zermatt)', location: { lat: 46.0207, lng: 7.7491 } },
        { id: 'theodul', name: 'Glacier (Theodul)', location: { lat: 45.9500, lng: 7.7100 } },
        { id: 'matterhorn', name: 'Summit (Matterhorn)', location: { lat: 45.9766, lng: 7.6585 } },
    ],
    dataConfig: {
        base: 0.25,
        seasonalAmplitude: 0.35,
        noise: 0.1
    }
  },
  {
    id: 'maggiore-lake',
    name: 'Jezioro Maggiore (IT/CH)',
    analysisType: 'point',
    description: '10-point analysis of chlorophyll concentration (NDCI) in Lake Maggiore.',
    index: { name: 'NDCI', unit: '' },
    stations: maggioreStations,
    dataConfig: {
      base: 0.0,
      seasonalAmplitude: 0.15,
      noise: 0.05
    }
  },
  {
    id: 'sniardwy-lake',
    name: 'Jezioro Śniardwy (PL)',
    analysisType: 'point',
    description: '10-point analysis of chlorophyll concentration (NDCI) in Lake Śniardwy.',
    index: { name: 'NDCI', unit: '' },
    stations: sniardwyStations,
    dataConfig: {
      base: 0.0,
      seasonalAmplitude: 0.15,
      noise: 0.05
    }
  },
];
