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
            location: { lat: 45.965, lng: 8.634 },
            bbox: [8.48, 45.8, 8.8, 46.15],
            gridShape: [6, 10]
        },
        { 
            id: 'sniardwy', 
            name: 'Jezioro Śniardwy (PL)', 
            location: { lat: 53.760, lng: 21.730 },
            bbox: [21.55, 53.7, 21.85, 53.8],
            gridShape: [8, 5]
        },
        {
            id: 'mar-menor',
            name: 'Mar Menor (ES) [Hotspot]',
            location: { lat: 37.730, lng: -0.780 },
            bbox: [-0.9, 37.65, -0.7, 37.85],
            gridShape: [5, 4]
        },
        {
            id: 'balaton',
            name: 'Jezioro Balaton (HU)',
            location: { lat: 46.900, lng: 17.800 },
            bbox: [17.6, 46.8, 18.0, 47.0],
            gridShape: [8, 5]
        }
    ],
    dataConfig: {
        base: 0.0,
        seasonalAmplitude: 0.15,
        noise: 0.05
    }
  },
];
