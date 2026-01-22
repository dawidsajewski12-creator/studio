"use client";

import type { Project, IndexDataPoint, KpiData, Station } from '@/lib/types';
import KpiCard from '@/components/sentinel-monitor/kpi-card';
import { Card, CardHeader } from '@/components/ui/card';
import { Satellite, Leaf, Droplets, Waves } from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MonitorMap = dynamic(() => import('@/components/sentinel-monitor/monitor-map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-muted"><p className="text-muted-foreground">Loading map...</p></div>
});

const IndexChart = dynamic(() => import('@/components/sentinel-monitor/index-chart'), {
    ssr: false,
    loading: () => (
        <>
            <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <div className="h-[300px] md:h-[400px] w-full px-2 pb-4">
                 <Skeleton className="h-full w-full" />
            </div>
        </>
    ),
});

type DashboardProps = {
  project: Project;
  chartData: { raw: IndexDataPoint[], aggregated: IndexDataPoint[] };
  kpiData: KpiData[];
};

const projectIcons: Record<string, React.ReactNode> = {
  'snow-watch': <Satellite className="size-6 text-primary" />,
  'vineyard-vitality': <Leaf className="size-6 text-primary" />,
  'urban-greenery': <Droplets className="size-6 text-primary" />,
  'maggiore-lake': <Waves className="size-6 text-primary" />,
  'sniardwy-lake': <Waves className="size-6 text-primary" />,
};

const getMapCenter = (stations: Station[]) => {
    if (stations.length === 0) return { lat: 0, lng: 0 };
    const totalLat = stations.reduce((acc, s) => acc + s.location.lat, 0);
    const totalLng = stations.reduce((acc, s) => acc + s.location.lng, 0);
    return {
        lat: totalLat / stations.length,
        lng: totalLng / stations.length,
    };
};

export default function Dashboard({ project, chartData, kpiData }: DashboardProps) {
  const [selectedStation, setSelectedStation] = useState<Station['id'] | 'all'>('all');

  const mapCenter = useMemo(() => getMapCenter(project.stations), [project.stations]);
  const stationIcon = projectIcons[project.id] || <Satellite className="size-6 text-primary" />;
  const initialZoom = useMemo(() => project.id.includes('lake') ? 10 : 9, [project.id]);

  const mapFeatures = useMemo(() => {
    return project.stations.map(station => {
      const pointData = chartData.raw.filter(d => d.stationId === station.id && d.indexValue !== null && !d.isInterpolated);
      const latestReading = pointData.length > 0 ? pointData[pointData.length - 1] : null;
      return {
        ...station,
        latestIndexValue: latestReading?.indexValue ?? null,
      }
    })
  }, [project.stations, chartData.raw]);

  const handleFeatureClick = (stationId: string) => {
    // For lake projects, clicking a point on the map selects it for the chart
    if (project.id.includes('lake')) {
      setSelectedStation(prev => prev === stationId ? 'all' : stationId);
    } else { // For snow project, it toggles between all and one station
      setSelectedStation(prev => prev === stationId ? 'all' : stationId);
    }
  };

  const handleKpiClick = (stationId: string) => {
    // If it's a lake KPI (average), clicking it resets the view to 'all'
    if (stationId === 'lake-average') {
      setSelectedStation('all');
    } else { // For snow KPIs, it toggles
      setSelectedStation(prev => prev === stationId ? 'all' : stationId);
    }
  };


  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      <Card className="xl:col-span-3 w-full h-[400px] xl:h-auto min-h-[400px] p-0 overflow-hidden shadow-lg">
        <MonitorMap
          project={project}
          features={mapFeatures}
          center={mapCenter}
          zoom={initialZoom}
          selectedStationId={selectedStation}
          onFeatureClick={handleFeatureClick}
        />
      </Card>
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(kpiData.length, 3)} gap-6`}>
          {kpiData.map((kpi) => (
            <KpiCard
              key={kpi.stationId}
              title={kpi.name}
              value={kpi.latestIndexValue !== null ? kpi.latestIndexValue.toFixed(3) : 'N/A'}
              date={kpi.latestDate}
              icon={stationIcon}
              onClick={() => handleKpiClick(kpi.stationId)}
              isSelected={selectedStation === kpi.stationId}
              coverage={kpi.spatialCoverage}
            />
          ))}
        </div>
        <Card className="flex-grow">
          <IndexChart 
            data={chartData.raw} 
            aggregatedData={chartData.aggregated}
            selectedStationId={selectedStation} 
            project={project} 
            />
        </Card>
      </div>
    </div>
  );
}
