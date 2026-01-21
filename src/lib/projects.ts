import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'snow-watch',
    name: 'Snow Watch',
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
    id: 'vineyard-vitality',
    name: 'Vineyard Vitality',
    description: 'Assessing grapevine health and vigor. (FR/IT)',
    index: { name: 'NDVI', unit: '' },
    stations: [
        { id: 'barolo', name: 'Barolo', location: { lat: 44.61, lng: 7.94 } },
        { id: 'burgundy', name: 'Burgundy', location: { lat: 47.0, lng: 4.8 } },
        { id: 'bordeaux', name: 'Bordeaux', location: { lat: 44.83, lng: -0.57 } },
    ],
    dataConfig: {
        base: 0.4,
        seasonalAmplitude: 0.3,
        noise: 0.15
    }
  },
  {
    id: 'urban-greenery',
    name: 'Urban Greenery',
    description: 'Mapping green spaces in urban environments. (PL/FR)',
    index: { name: 'NDBI', unit: '' },
    stations: [
        { id: 'warsaw', name: 'Warsaw', location: { lat: 52.23, lng: 21.01 } },
        { id: 'paris', name: 'Paris', location: { lat: 48.85, lng: 2.35 } },
        { id: 'krakow', name: 'Krakow', location: { lat: 50.06, lng: 19.94 } },
    ],
     dataConfig: {
        base: 0.1,
        seasonalAmplitude: 0.1,
        noise: 0.05
    }
  },
  {
    id: 'river-drought',
    name: 'River Drought',
    description: 'Monitoring water levels in major rivers. (IT/PL)',
    index: { name: 'NDWI', unit: '' },
    stations: [
        { id: 'po', name: 'Po River', location: { lat: 45.0, lng: 9.0 } },
        { id: 'vistula', name: 'Vistula River', location: { lat: 54.3, lng: 18.9 } },
        { id: 'tiber', name: 'Tiber River', location: { lat: 41.9, lng: 12.5 } },
    ],
    dataConfig: {
        base: 0.2,
        seasonalAmplitude: 0.25,
        noise: 0.1
    }
  },
  {
    id: 'lake-quality',
    name: 'Lake Quality',
    description: 'Assessing water quality in large lakes. (PL/CH)',
    index: { name: 'NDCI', unit: '' },
    stations: [
        { id: 'geneva', name: 'Lake Geneva', location: { lat: 46.45, lng: 6.5 } },
        { id: 'sniardwy', name: 'Śniardwy Lake', location: { lat: 53.75, lng: 21.72 } },
        { id: 'mamry', name: 'Mamry Lake', location: { lat: 54.1, lng: 21.8 } },
    ],
    dataConfig: {
        base: 0.15,
        seasonalAmplitude: 0.1,
        noise: 0.08
    }
  },
];
