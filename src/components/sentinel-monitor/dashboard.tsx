"use client";

import type { Project, IndexDataPoint, KpiData, Station } from '@/lib/types';
import KpiCard from '@/components/sentinel-monitor/kpi-card';
import { Card, CardHeader } from '@/components/ui/card';
import { Satellite, Leaf, Building2, Droplets, Waves } from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { getGridCells } from '@/lib/gis-utils';

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
  rawIndexData: IndexDataPoint[];
  chartIndexData: IndexDataPoint[];
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

export default function Dashboard({ project, rawIndexData, chartIndexData, kpiData }: DashboardProps) {
  const [selectedStation, setSelectedStation] = useState<Station['id'] | 'all'>('all');

  const filteredChartData = useMemo(() => {
    if (selectedStation === 'all') {
      return chartIndexData;
    }
    return chartIndexData.filter(d => d.stationId === selectedStation);
  }, [chartIndexData, selectedStation]);
  
  const mapCenter = useMemo(() => getMapCenter(project.stations), [project.stations]);
  const stationIcon = projectIcons[project.id] || <Satellite className="size-6 text-primary" />;
  const initialZoom = useMemo(() => project.id === 'lake-quality' ? 8 : 9, [project.id]);

  // Augment stations with BBox and latest Index value for the map
  const featuresForMap = useMemo(() => {
    return project.stations.flatMap(station => {
      if (project.analysisType === 'grid') {
        const gridCells = getGridCells(station, 3, 1);
        return gridCells.map(cell => {
          const cellData = rawIndexData.filter(d => d.cellId === cell.cellId && d.indexValue !== null && !d.isInterpolated);
          const latestReading = cellData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          return {
            id: cell.cellId,
            stationId: station.id,
            name: `${station.name} Cell`,
            bbox: cell.bbox,
            latestIndexValue: latestReading?.indexValue ?? null,
            location: station.location,
          }
        });
      } else { // 'point'
        const kpi = kpiData.find(k => k.stationId === station.id);
        const bufferKm = 0.5;
        // The getBoundingBox function expects a Station object. Let's provide a compatible one.
        const pointStation = {
          id: station.id,
          name: station.name,
          location: station.location
        };
        return [{
          id: station.id,
          stationId: station.id,
          name: station.name,
          bbox: getBoundingBox(pointStation, bufferKm),
          latestIndexValue: kpi?.latestIndexValue ?? null,
          location: station.location,
        }];
      }
    });
  }, [project, rawIndexData, kpiData]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      <Card className="xl:col-span-3 w-full h-[400px] xl:h-auto min-h-[400px] p-0 overflow-hidden shadow-lg">
        <MonitorMap
          project={project}
          features={featuresForMap}
          center={mapCenter}
          zoom={initialZoom}
          selectedStationId={selectedStation}
          onFeatureClick={(stationId) => setSelectedStation(prev => prev === stationId ? 'all' : stationId)}
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
          <IndexChart data={filteredChartData} selectedStationId={selectedStation} project={project} />
        </Card>
      </div>
    </div>
  );
}
