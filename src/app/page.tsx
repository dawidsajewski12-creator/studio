'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import MethodologyAndResearch from '@/components/journal/methodology-research';
import ContactCard from '@/components/journal/contact-card';
import { Suspense } from 'react';

// This is now a Server Component, so it can be async and read searchParams from props
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
        // LiveDemo is an async Server Component, so its usage must be wrapped in Suspense.
        return (
          <Suspense fallback={<div className="w-full max-w-screen-2xl p-8 text-center">Loading live data...</div>}>
            <LiveDemo />
          </Suspense>
        );
    }
  };

  return (
    // This outer Suspense can catch client component suspension, like useSearchParams in SidebarNavigation
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-8">Loading...</div>}>
      <SidebarProvider>
        <Sidebar>
          <SidebarNavigation />
        </Sidebar>
        <SidebarInset>
          <main>
            {renderContent()}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  );
}
