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

const tuscanyStations = [
    { lat: 43.585, lng: 11.317 }, { lat: 43.488, lng: 11.377 }, { lat: 43.466, lng: 11.434 }
].map((loc, i) => ({
  id: `tuscany_${i}`,
  name: `Chianti Pt. ${i + 1}`,
  location: { lat: loc.lat, lng: loc.lng }
}));

const bordeauxStations = [
    { lat: 44.893, lng: -0.155 }, { lat: 44.929, lng: -0.205 }, { lat: 44.915, lng: -0.243 }
].map((loc, i) => ({
  id: `bordeaux_${i}`,
  name: `St-Émilion Pt. ${i + 1}`,
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
    dataConfig: { base: 0.25, seasonalAmplitude: 0.35, noise: 0.1 }
  },
  {
    id: 'maggiore-lake',
    name: 'Jezioro Maggiore (IT/CH)',
    analysisType: 'point',
    description: '8-point analysis of chlorophyll concentration (NDCI) in Lake Maggiore.',
    index: { name: 'NDCI', unit: '' },
    stations: maggioreStations,
    dataConfig: { base: 0.0, seasonalAmplitude: 0.15, noise: 0.05 }
  },
  {
    id: 'sniardwy-lake',
    name: 'Jezioro Śniardwy (PL)',
    analysisType: 'point',
    description: '10-point analysis of chlorophyll concentration (NDCI) in Lake Śniardwy.',
    index: { name: 'NDCI', unit: '' },
    stations: sniardwyStations,
    dataConfig: { base: 0.0, seasonalAmplitude: 0.15, noise: 0.05 }
  },
  {
    id: 'tuscany-vineyard',
    name: 'Tuscany (Chianti Classico)',
    analysisType: 'point',
    description: 'NDVI & NDMI analysis for vineyards in the Chianti Classico region.',
    index: { name: 'NDVI/NDMI', unit: '', names: ['NDVI', 'NDMI'] },
    stations: tuscanyStations,
    dataConfig: { base: 0.4, seasonalAmplitude: 0.3, noise: 0.05 }
  },
  {
    id: 'bordeaux-vineyard',
    name: 'Bordeaux (Saint-Émilion)',
    analysisType: 'point',
    description: 'NDVI & NDMI analysis for vineyards in the Saint-Émilion appellation.',
    index: { name: 'NDVI/NDMI', unit: '', names: ['NDVI', 'NDMI'] },
    stations: bordeauxStations,
    dataConfig: { base: 0.4, seasonalAmplitude: 0.3, noise: 0.05 }
  }
];
