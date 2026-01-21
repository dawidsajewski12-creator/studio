import { getProjectData } from '@/lib/data';
import { PROJECTS } from '@/lib/projects';
import type { IndexDataPoint, KpiData, Project, Station } from '@/lib/types';
import Dashboard from '@/components/sentinel-monitor/dashboard';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import { notFound } from 'next/navigation';

// Helper function to find the latest valid reading
const getLatestReading = (data: IndexDataPoint[], stationId: Station['id']) => {
  return data
    .filter(d => d.stationId === stationId && d.indexValue !== -1)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export default async function Home({ searchParams }: { searchParams: { project: string } }) {
  const selectedProjectId = searchParams.project || 'snow-watch';
  const project = PROJECTS.find(p => p.id === selectedProjectId);

  if (!project) {
    notFound();
  }

  const indexData = await getProjectData(project);
  
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
    <SidebarProvider>
      <Sidebar>
        <SidebarNavigation projects={PROJECTS} activeProjectId={project.id} />
      </Sidebar>
      <SidebarInset>
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background">
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
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
