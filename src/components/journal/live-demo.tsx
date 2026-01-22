import { getProjectData } from '@/lib/data';
import { PROJECTS } from '@/lib/projects';
import type { IndexDataPoint, KpiData, Project, Station } from '@/lib/types';
import Dashboard from '@/components/sentinel-monitor/dashboard';
import TechnicalNote from '@/components/journal/technical-note';
import { notFound } from 'next/navigation';

// Helper function to find the latest valid reading (not interpolated and has a value)
const getLatestReading = (data: IndexDataPoint[], stationId: Station['id']) => {
  return data
    .filter(d => d.stationId === stationId && !d.isInterpolated && d.indexValue !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export default async function LiveDemo({ projectId }: { projectId: string }) {
  const project = PROJECTS.find(p => p.id === projectId);

  if (!project) {
    notFound();
  }

  // Fetch the fused satellite and weather data
  const indexData = await getProjectData(project);
  
  // KPI data is derived from the fetched data
  const kpiData: KpiData[] = project.stations.map(station => {
    const latestReading = getLatestReading(indexData, station.id);
    return {
      stationId: station.id,
      name: station.name,
      latestIndexValue: latestReading?.indexValue ?? null,
      latestDate: latestReading?.date ?? null,
    };
  });

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-screen-2xl">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </header>
        <Dashboard 
          project={project}
          indexData={indexData}
          kpiData={kpiData}
        />
        <TechnicalNote project={project} />
      </div>
    </div>
  );
}
