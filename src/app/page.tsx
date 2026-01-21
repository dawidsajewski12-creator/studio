'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import MethodologyAndResearch from '@/components/journal/methodology-research';
import ContactCard from '@/components/journal/contact-card';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

function RenderView() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'live-demo';

  return useMemo(() => {
    switch (view) {
      case 'research':
        return <MethodologyAndResearch />;
      case 'contact':
        return <ContactCard />;
      case 'live-demo':
      default:
        return <LiveDemo />;
    }
  }, [view]);
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-8">Loading...</div>}>
      <SidebarProvider>
        <Sidebar>
          <SidebarNavigation />
        </Sidebar>
        <SidebarInset>
          <main>
            <RenderView />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Suspense>
  );
}
