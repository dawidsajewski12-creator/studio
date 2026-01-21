import { getNdsiData, STATIONS } from '@/lib/data';
import type { NdsiDataPoint, Station, KpiData } from '@/lib/types';
import Dashboard from '@/components/alpine-snow-watch/dashboard';

// Helper function to find the latest valid reading
const getLatestReading = (data: NdsiDataPoint[], stationId: Station['id']) => {
  return data
    .filter(d => d.stationId === stationId && d.ndsi !== -1)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export default async function Home() {
  const ndsiData = await getNdsiData();
  
  const kpiData: KpiData[] = STATIONS.map(station => {
    const latestReading = getLatestReading(ndsiData, station.id);
    return {
      stationId: station.id,
      name: station.name,
      latestNdsi: latestReading?.ndsi ?? null,
      latestDate: latestReading?.date ?? null,
    };
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8 bg-background">
      <div className="w-full max-w-screen-2xl">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">Alpine Snow Watch</h1>
          <p className="text-muted-foreground mt-1">Near real-time snow cover monitoring in the Zermatt region.</p>
        </header>
        <Dashboard 
          stations={STATIONS}
          ndsiData={ndsiData}
          kpiData={kpiData}
        />
      </div>
    </main>
  );
}
