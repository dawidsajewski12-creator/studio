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
    id: 'lake-quality',
    name: 'Lake Quality Monitor',
    analysisType: 'grid',
    description: 'Monitoring chlorophyll concentration and algal blooms in lakes.',
    index: { name: 'NDCI', unit: '' },
    stations: [
        { 
            id: 'maggiore', 
            name: 'Jezioro Maggiore (IT/CH)', 
            location: { lat: 45.975, lng: 8.625 },
            bbox: [8.45, 45.80, 8.80, 46.15],
            gridShape: [5, 10]
        },
        { 
            id: 'sniardwy', 
            name: 'Jezioro Śniardwy (PL)', 
            location: { lat: 53.76, lng: 21.725 },
            bbox: [21.55, 53.68, 21.90, 53.84],
            gridShape: [8, 6]
        }
    ],
    dataConfig: {
        base: 0.0,
        seasonalAmplitude: 0.15,
        noise: 0.05
    }
  },
];
