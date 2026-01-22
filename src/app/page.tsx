import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import MethodologyAndResearch from '@/components/journal/methodology-research';
import ContactCard from '@/components/journal/contact-card';
import { Suspense } from 'react';
import VisualProof from '@/components/sentinel-monitor/visual-proof';
import { Skeleton } from '@/components/ui/skeleton';
import { PROJECTS } from '@/lib/projects';

// This is a Server Component, so it can be async and read searchParams from props
export default function Home({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams?.view || 'snow-watch';

  const isProjectView = PROJECTS.some(p => p.id === view);

  const renderContent = () => {
    if (isProjectView) {
        return (
          <Suspense fallback={<div className="w-full max-w-screen-2xl p-8 text-center">Loading live data...</div>}>
            <LiveDemo projectId={view} />
          </Suspense>
        );
    }

    switch (view) {
      case 'research':
        return <MethodologyAndResearch />;
      case 'contact':
        return <ContactCard />;
      default: // Fallback to the first project if view is invalid
        return (
            <Suspense fallback={<div className="w-full max-w-screen-2xl p-8 text-center">Loading live data...</div>}>
              <LiveDemo projectId={PROJECTS[0].id} />
            </Suspense>
        );
    }
  };

  const visualProof = (
      <div className="p-2 mt-4">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <VisualProof projectId={view} />
          </Suspense>
      </div>
  );

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarNavigation activeView={view} visualProof={isProjectView ? visualProof : null} />
        </Sidebar>
        <SidebarInset>
          <main>
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
