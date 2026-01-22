import type { Project } from './types';

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
    stations: [
      { id: 'maggiore_0', name: 'Maggiore Pt. 1', location: { lat: 45.965, lng: 8.634 } },
      { id: 'maggiore_1', name: 'Maggiore Pt. 2', location: { lat: 45.910, lng: 8.560 } },
      { id: 'maggiore_2', name: 'Maggiore Pt. 3', location: { lat: 46.030, lng: 8.710 } },
      { id: 'maggiore_3', name: 'Maggiore Pt. 4', location: { lat: 45.850, lng: 8.540 } },
      { id: 'maggiore_4', name: 'Maggiore Pt. 5', location: { lat: 46.080, lng: 8.760 } },
      { id: 'maggiore_5', name: 'Maggiore Pt. 6', location: { lat: 45.935, lng: 8.610 } },
      { id: 'maggiore_6', name: 'Maggiore Pt. 7', location: { lat: 45.880, lng: 8.520 } },
      { id: 'maggiore_7', name: 'Maggiore Pt. 8', location: { lat: 46.010, lng: 8.680 } },
      { id: 'maggiore_8', name: 'Maggiore Pt. 9', location: { lat: 45.985, lng: 8.650 } },
      { id: 'maggiore_9', name: 'Maggiore Pt. 10', location: { lat: 45.820, lng: 8.580 } },
    ],
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
    stations: [
        { id: 'sniardwy_0', name: 'Śniardwy Pt. 1', location: { lat: 53.755, lng: 21.725 } },
        { id: 'sniardwy_1', name: 'Śniardwy Pt. 2', location: { lat: 53.740, lng: 21.780 } },
        { id: 'sniardwy_2', name: 'Śniardwy Pt. 3', location: { lat: 53.725, lng: 21.680 } },
        { id: 'sniardwy_3', name: 'Śniardwy Pt. 4', location: { lat: 53.770, lng: 21.650 } },
        { id: 'sniardwy_4', name: 'Śniardwy Pt. 5', location: { lat: 53.785, lng: 21.750 } },
        { id: 'sniardwy_5', name: 'Śniardwy Pt. 6', location: { lat: 53.710, lng: 21.730 } },
        { id: 'sniardwy_6', name: 'Śniardwy Pt. 7', location: { lat: 53.735, lng: 21.840 } },
        { id: 'sniardwy_7', name: 'Śniardwy Pt. 8', location: { lat: 53.765, lng: 21.810 } },
        { id: 'sniardwy_8', name: 'Śniardwy Pt. 9', location: { lat: 53.695, lng: 21.760 } },
        { id: 'sniardwy_9', name: 'Śniardwy Pt. 10', location: { lat: 53.750, lng: 21.690 } },
    ],
    dataConfig: {
      base: 0.0,
      seasonalAmplitude: 0.15,
      noise: 0.05
    }
  },
];
