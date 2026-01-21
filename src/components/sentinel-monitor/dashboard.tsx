"use client";

import type { Project, IndexDataPoint, KpiData, Station } from '@/lib/types';
import KpiCard from '@/components/sentinel-monitor/kpi-card';
import { Card, CardHeader } from '@/components/ui/card';
import { Satellite, Leaf, Building2, Droplets, Waves } from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { getBoundingBox } from '@/lib/data'; // Assuming you move getBoundingBox here or to utils

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
  indexData: IndexDataPoint[];
  kpiData: KpiData[];
};

const projectIcons: Record<string, React.ReactNode> = {
  'snow-watch': <Satellite className="size-6 text-primary" />,
  'vineyard-vitality': <Leaf className="size-6 text-primary" />,
  'urban-greenery': <Building2 className="size-6 text-primary" />,
  'river-drought': <Droplets className="size-6 text-primary" />,
  'lake-quality': <Waves className="size-6 text-primary" />,
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

export default function Dashboard({ project, indexData, kpiData }: DashboardProps) {
  const [selectedStation, setSelectedStation] = useState<Station['id'] | 'all'>('all');

  const filteredIndexData = useMemo(() => {
    if (selectedStation === 'all') {
      return indexData;
    }
    return indexData.filter(d => d.stationId === selectedStation);
  }, [indexData, selectedStation]);
  
  const mapCenter = useMemo(() => getMapCenter(project.stations), [project.stations]);
  const stationIcon = projectIcons[project.id] || <Satellite className="size-6 text-primary" />;

  // Augment stations with their bounding boxes for the map
  const stationsWithBbox = useMemo(() => {
    return project.stations.map(station => ({
      ...station,
      bbox: getBoundingBox(station, 0.5)
    }));
  }, [project.stations]);


  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      <Card className="xl:col-span-3 w-full h-[400px] xl:h-auto min-h-[400px] p-0 overflow-hidden shadow-lg">
        <MonitorMap
          stations={stationsWithBbox}
          center={mapCenter}
          selectedStationId={selectedStation}
          onMarkerClick={(stationId) => setSelectedStation(prev => prev === stationId ? 'all' : stationId)}
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
              onClick={() => setSelectedStation(prev => prev === kpi.stationId ? 'all' : kpi.stationId)}
              isSelected={selectedStation === kpi.stationId}
            />
          ))}
        </div>
        <Card className="flex-grow">
          <IndexChart data={filteredIndexData} selectedStationId={selectedStation} project={project} />
        </Card>
      </div>
    </div>
  );
}
