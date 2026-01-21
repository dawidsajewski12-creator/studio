import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import MethodologyAndResearch from '@/components/journal/methodology-research';
import ContactCard from '@/components/journal/contact-card';
import { Suspense } from 'react';
import VisualProof from '@/components/sentinel-monitor/visual-proof';
import { Skeleton } from '@/components/ui/skeleton';

// This is a Server Component, so it can be async and read searchParams from props
export default function Home({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams?.view || 'live-demo';

  const renderContent = () => {
    switch (view) {
      case 'research':
        return <MethodologyAndResearch />;
      case 'contact':
        return <ContactCard />;
      case 'live-demo':
      default:
        return (
          <Suspense fallback={<div className="w-full max-w-screen-2xl p-8 text-center">Loading live data...</div>}>
            <LiveDemo />
          </Suspense>
        );
    }
  };

  const visualProof = (
      <div className="p-2 mt-4">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <VisualProof />
          </Suspense>
      </div>
  );

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarNavigation activeView={view} visualProof={view === 'live-demo' ? visualProof : null} />
        </Sidebar>
        <SidebarInset>
          <main>
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
