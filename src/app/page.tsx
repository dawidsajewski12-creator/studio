'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNavigation from '@/components/sentinel-monitor/sidebar-navigation';
import LiveDemo from '@/components/journal/live-demo';
import MethodologyAndResearch from '@/components/journal/methodology-research';
import ContactCard from '@/components/journal/contact-card';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'live-demo';

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

  return (
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
  );
}
