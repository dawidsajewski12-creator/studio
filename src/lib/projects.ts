import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'snow-watch',
    name: 'Alpine Snow Watch',
    description: 'Monitoring snow cover in high-altitude regions. (CH/IT)',
    index: { name: 'NDSI', unit: '' },
    stations: [
        { id: 'zermatt', name: 'Valley (Zermatt)', location: { lat: 46.02, lng: 7.748 } },
        { id: 'theodul', name: 'Glacier (Theodul)', location: { lat: 45.95, lng: 7.71 } },
        { id: 'matterhorn', name: 'Summit (Matterhorn)', location: { lat: 45.976, lng: 7.658 } },
    ],
    dataConfig: {
        base: 0.25,
        seasonalAmplitude: 0.35,
        noise: 0.1
    }
  },
  {
    id: 'lake-quality',
    name: 'Lake Quality Monitor',
    description: 'Monitoring chlorophyll concentration and algal blooms in lakes.',
    index: { name: 'NDCI', unit: '' },
    stations: [
        { id: 'maggiore', name: 'Jezioro Maggiore (IT/CH)', location: { lat: 45.965, lng: 8.634 } },
        { id: 'sniardwy', name: 'Jezioro Śniardwy (PL)', location: { lat: 53.760, lng: 21.730 } },
        { id: 'geneva', name: 'Jezioro Genewskie (CH/FR)', location: { lat: 46.452, lng: 6.665 } },
        { id: 'bodensee', name: 'Jezioro Bodeńskie (DE/CH/AT)', location: { lat: 47.590, lng: 9.450 } },
        { id: 'vistula-lagoon', name: 'Zalew Wiślany (PL)', location: { lat: 54.400, lng: 19.450 } },
    ],
    dataConfig: {
        base: 0.0,
        seasonalAmplitude: 0.15,
        noise: 0.05
    }
  },
];
