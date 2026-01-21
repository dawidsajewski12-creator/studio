import type { Station, NdsiDataPoint } from './types';
import { subDays, eachDayOfInterval, getDayOfYear } from 'date-fns';

export const STATIONS: Station[] = [
  { id: 'valley', name: 'Valley (Zermatt)', location: { lat: 46.02, lng: 7.748 } },
  { id: 'glacier', name: 'Glacier (Theodul)', location: { lat: 45.95, lng: 7.71 } },
  { id: 'summit', name: 'Summit (Matterhorn)', location: { lat: 45.976, lng: 7.658 } },
];

const stationBaseNdsi = {
  valley: 0.1, // Less snow overall
  glacier: 0.3, // More snow
  summit: 0.4, // Most snow
};

// This function simulates fetching data from an API.
export async function getNdsiData(): Promise<NdsiDataPoint[]> {
  const data: NdsiDataPoint[] = [];
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);
  const dateInterval = eachDayOfInterval({ start: ninetyDaysAgo, end: today });

  for (const date of dateInterval) {
    for (const station of STATIONS) {
      // Simulate cloudy days (20% chance)
      if (Math.random() < 0.2) {
        data.push({
          date: date.toISOString(),
          stationId: station.id,
          ndsi: -1, // -1 indicates cloud cover as per the evalscript
        });
        continue;
      }

      // Simulate seasonal variation with a sine wave
      const dayOfYear = getDayOfYear(date);
      // Peaks in winter (around day 350 to day 60), trough in summer (around day 210)
      const seasonalFactor = Math.cos(((dayOfYear - 30) / 365) * 2 * Math.PI) * 0.3; // Varies by +/- 0.3

      // Add random daily fluctuation
      const dailyNoise = (Math.random() - 0.5) * 0.1; // Varies by +/- 0.05

      let ndsi = stationBaseNdsi[station.id] + seasonalFactor + dailyNoise;

      // Clamp NDSI value between 0 and 1 for non-cloudy days
      ndsi = Math.max(0, Math.min(ndsi, 1));
      
      data.push({
        date: date.toISOString(),
        stationId: station.id,
        ndsi,
      });
    }
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  return data;
}
