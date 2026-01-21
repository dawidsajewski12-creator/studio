import type { Project, IndexDataPoint } from './types';
import { subDays, eachDayOfInterval, getDayOfYear } from 'date-fns';

// This function simulates fetching data from the Copernicus API for a given project.
export async function getProjectData(project: Project): Promise<IndexDataPoint[]> {
  const data: IndexDataPoint[] = [];
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);
  const dateInterval = eachDayOfInterval({ start: ninetyDaysAgo, end: today });

  for (const date of dateInterval) {
    for (const station of project.stations) {
      // Simulate cloudy days (20% chance) - this mimics using the SCL band for dataMask.
      if (Math.random() < 0.2) {
        data.push({
          date: date.toISOString(),
          stationId: station.id,
          indexValue: -1, // -1 indicates cloud cover or no data
        });
        continue;
      }

      // Simulate seasonal variation with a sine wave
      const dayOfYear = getDayOfYear(date);
      // Peaks in winter for snow, summer for vegetation, etc.
      // The phase shift (e.g., -30 for snow, -180 for vegetation) adjusts the peak season.
      const phaseShift = project.id.includes('snow') ? 30 : 180;
      const seasonalFactor = Math.cos(((dayOfYear - phaseShift) / 365) * 2 * Math.PI) * project.dataConfig.seasonalAmplitude;

      // Add random daily fluctuation
      const dailyNoise = (Math.random() - 0.5) * project.dataConfig.noise;

      let indexValue = project.dataConfig.base + seasonalFactor + dailyNoise;

      // Clamp index value between 0 and 1 for non-cloudy days
      indexValue = Math.max(0, Math.min(indexValue, 1));
      
      data.push({
        date: date.toISOString(),
        stationId: station.id,
        indexValue,
      });
    }
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));

  return data;
}
