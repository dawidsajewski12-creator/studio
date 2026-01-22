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
        { id: 'lugano', name: 'Jezioro Lugano (CH/IT) [Hotspot]', location: { lat: 45.967, lng: 8.950 } },
        { id: 'maggiore', name: 'Jezioro Maggiore (IT/CH)', location: { lat: 45.913, lng: 8.552 } },
        { id: 'vistula-lagoon', name: 'Zalew Wiślany (PL) [Central]', location: { lat: 54.395, lng: 19.550 } },
        { id: 'balaton', name: 'Jezioro Balaton (HU) [Reference]', location: { lat: 46.865, lng: 17.725 } },
    ],
    dataConfig: {
        base: 0.0,
        seasonalAmplitude: 0.15,
        noise: 0.05
    }
  },
];
