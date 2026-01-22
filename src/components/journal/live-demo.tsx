import { getProjectData } from '@/lib/data';
import { PROJECTS } from '@/lib/projects';
import type { IndexDataPoint, KpiData, Project, Station } from '@/lib/types';
import Dashboard from '@/components/sentinel-monitor/dashboard';
import TechnicalNote from '@/components/journal/technical-note';
import { notFound } from 'next/navigation';
import { format, parseISO } from 'date-fns';

// Helper function to find the latest valid reading from a data series
const getLatestReading = (data: IndexDataPoint[]) => {
  return data
    .filter(d => !d.isInterpolated && d.indexValue !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

// Helper to aggregate raw grid data into a single series for charts and KPIs
const aggregateGridData = (data: IndexDataPoint[], stationId: string): IndexDataPoint[] => {
    const dailyAggregates: { [date: string]: { sum: number; count: number; tempSum: number; tempCount: number, anyReal: boolean } } = {};

    // Filter for the specific station and aggregate cell data
    data.filter(p => p.stationId === stationId).forEach(point => {
        const dateStr = format(parseISO(point.date), 'yyyy-MM-dd');
        if (!dailyAggregates[dateStr]) {
            dailyAggregates[dateStr] = { sum: 0, count: 0, tempSum: 0, tempCount: 0, anyReal: false };
        }
        if (point.indexValue !== null) {
            dailyAggregates[dateStr].sum += point.indexValue;
            dailyAggregates[dateStr].count++;
            if (!point.isInterpolated) {
              dailyAggregates[dateStr].anyReal = true;
            }
        }
        if (point.temperature !== null) {
            dailyAggregates[dateStr].tempSum += point.temperature;
            dailyAggregates[dateStr].tempCount++;
        }
    });

    // Create the aggregated time series
    return Object.entries(dailyAggregates).map(([date, values]) => {
        const avgIndex = values.count > 0 ? values.sum / values.count : null;
        const avgTemp = values.tempCount > 0 ? values.tempSum / values.tempCount : null;
        return {
            date: parseISO(date).toISOString(),
            stationId: stationId,
            indexValue: avgIndex,
            isInterpolated: !values.anyReal, // A day is "real" if at least one cell was real
            temperature: avgTemp,
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default async function LiveDemo({ projectId }: { projectId: string }) {
  const project = PROJECTS.find(p => p.id === projectId);

  if (!project) {
    notFound();
  }

  // Fetch the raw satellite and weather data for all points/cells
  const rawIndexData = await getProjectData(project);
  
  // KPI data and Chart data are derived differently depending on the project type
  const kpiData: KpiData[] = [];
  const chartData: { [stationId: string]: IndexDataPoint[] } = {};

  project.stations.forEach(station => {
    let stationDataForKpiAndChart: IndexDataPoint[];

    if (project.analysisType === 'grid') {
      stationDataForKpiAndChart = aggregateGridData(rawIndexData, station.id);
    } else {
      stationDataForKpiAndChart = rawIndexData.filter(d => d.stationId === station.id);
    }
    
    chartData[station.id] = stationDataForKpiAndChart;

    const latestReading = getLatestReading(stationDataForKpiAndChart);
    kpiData.push({
      stationId: station.id,
      name: station.name,
      latestIndexValue: latestReading?.indexValue ?? null,
      latestDate: latestReading?.date ?? null,
    });
  });

  // Flatten chart data for passing to the component
  const flatChartData = Object.values(chartData).flat();

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-screen-2xl">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </header>
        <Dashboard 
          project={project}
          rawIndexData={rawIndexData}
          chartIndexData={flatChartData}
          kpiData={kpiData}
        />
        <TechnicalNote project={project} />
      </div>
    </div>
  );
}
