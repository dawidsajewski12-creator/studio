"use client";

import type { Project, IndexDataPoint, KpiData, Station } from '@/lib/types';
import KpiCard from '@/components/sentinel-monitor/kpi-card';
import { Card } from '@/components/ui/card';
import { Satellite, Leaf, Waves } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const MonitorMap = dynamic(() => import('@/components/sentinel-monitor/monitor-map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-muted"><p className="text-muted-foreground">Loading map...</p></div>
});

const ChartLoader = () => (
    <div className='p-4 h-[450px]'>
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/2 mb-6" />
        <Skeleton className="h-full w-full" />
    </div>
);

const EnvironmentalDriversChart = dynamic(() => import('@/components/sentinel-monitor/EnvironmentalDriversChart'), { ssr: false, loading: ChartLoader });
const BloomProbabilityChart = dynamic(() => import('@/components/sentinel-monitor/BloomProbabilityChart'), { ssr: false, loading: ChartLoader });
const WaterStressChart = dynamic(() => import('@/components/sentinel-monitor/WaterStressChart'), { ssr: false, loading: ChartLoader });


type FeatureForMap = Station & { 
  latestIndexValue: number | null; 
  latestNdmiValue?: number | null;
  bloomProbability?: number | null;
  waterStress?: number | null;
  latestRadarValue?: number | null;
};

type DashboardProps = {
  project: Project;
  chartData: { raw: IndexDataPoint[], aggregated: IndexDataPoint[] };
  kpiData: KpiData[];
  mapFeatures: FeatureForMap[];
};

const projectIcons: Record<string, React.ReactNode> = {
  'snow-watch': <Satellite className="size-6 text-primary" />,
  'tuscany-vineyard': <Leaf className="size-6 text-primary" />,
  'bordeaux-vineyard': <Leaf className="size-6 text-primary" />,
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

export default function Dashboard({ project, chartData, kpiData, mapFeatures }: DashboardProps) {
  const [selectedStation, setSelectedStation] = useState<Station['id'] | 'all'>('all');

  useEffect(() => {
    setSelectedStation('all');
  }, [project.id]);

  const mapCenter = useMemo(() => getMapCenter(project.stations), [project.stations]);
  const stationIcon = projectIcons[project.id] || <Satellite className="size-6 text-primary" />;
  const initialZoom = useMemo(() => project.id.includes('lake') ? 10 : project.id.includes('vineyard') ? 12 : 9, [project.id]);
  const isLakeProject = project.id.includes('lake');
  const isVineyardProject = project.id.includes('vineyard');

  const handleFeatureClick = (stationId: string) => {
      setSelectedStation(prev => prev === stationId ? 'all' : stationId);
  };

  const handleKpiClick = (stationId: string) => {
    if (stationId === 'lake-average') {
      setSelectedStation('all');
    } else {
      setSelectedStation(prev => prev === stationId ? 'all' : stationId);
    }
  };
  
  const singleStationData = useMemo(() => {
    if (!isVineyardProject) return [];
    const targetStationId = selectedStation === 'all' ? project.stations[0].id : selectedStation;
    return chartData.raw.filter(d => d.stationId === targetStationId);
  }, [chartData.raw, selectedStation, isVineyardProject, project.stations]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      <Card className="xl:col-span-3 w-full h-[400px] xl:h-auto min-h-[400px] p-0 overflow-hidden shadow-lg">
        <MonitorMap
          key={project.id}
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
              ndmiValue={kpi.latestNdmiValue !== undefined ? (kpi.latestNdmiValue !== null ? kpi.latestNdmiValue.toFixed(3) : 'N/A') : undefined}
              radarValue={kpi.latestRadarValue !== undefined ? (kpi.latestRadarValue !== null ? kpi.latestRadarValue.toFixed(2) : 'N/A') : undefined}
              date={kpi.latestDate}
              icon={stationIcon}
              onClick={() => handleKpiClick(kpi.stationId)}
              isSelected={selectedStation === kpi.stationId}
              coverage={kpi.spatialCoverage}
              riskValue={kpi.riskValue}
              riskLabel={kpi.riskLabel}
            />
          ))}
        </div>
        {isLakeProject ? (
          <div className="grid grid-cols-1 gap-6">
            <Card>
                <EnvironmentalDriversChart data={chartData.raw} aggregatedData={chartData.aggregated} selectedStationId={selectedStation} project={project} />
            </Card>
            <Card>
                <BloomProbabilityChart data={chartData.aggregated} />
            </Card>
          </div>
        ) : isVineyardProject ? (
            <div className="grid grid-cols-1 gap-6">
                <Card className="flex-grow">
                    <EnvironmentalDriversChart data={chartData.raw} selectedStationId={selectedStation} project={project} />
                </Card>
                <Card>
                    <WaterStressChart data={singleStationData} />
                </Card>
            </div>
        ) : (
          <Card className="flex-grow">
              <EnvironmentalDriversChart data={chartData.raw} selectedStationId={selectedStation} project={project} />
          </Card>
        )}
      </div>
    </div>
  );
}
