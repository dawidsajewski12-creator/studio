import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import ResearchJournal from '@/components/journal/research-journal';
import ContactCard from '@/components/journal/contact-card';
import { Suspense } from 'react';

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view || 'live-demo';

  const renderView = () => {
    switch (view) {
      case 'research':
        return <ResearchJournal />;
      case 'contact':
        return <ContactCard />;
      case 'live-demo':
      default:
        return <LiveDemo />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNavigation activeView={view} />
      </Sidebar>
      <SidebarInset>
        <main>
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-8">Loading...</div>}>
            {renderView()}
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
