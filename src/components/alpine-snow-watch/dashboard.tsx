"use client";

import type { Station, NdsiDataPoint, KpiData } from '@/lib/types';
import NdsiChart from '@/components/alpine-snow-watch/ndsi-chart';
import KpiCard from '@/components/alpine-snow-watch/kpi-card';
import { Card } from '@/components/ui/card';
import { Snowflake, Mountain, Trees } from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const SnowMap = dynamic(() => import('@/components/alpine-snow-watch/snow-map'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-muted"><p className="text-muted-foreground">Loading map...</p></div>
});

type DashboardProps = {
  stations: Station[];
  ndsiData: NdsiDataPoint[];
  kpiData: KpiData[];
};

const stationIcons = {
  valley: <Trees className="size-6 text-primary" />,
  glacier: <Snowflake className="size-6 text-primary" />,
  summit: <Mountain className="size-6 text-primary" />,
};

const mapCenter = {
  lat: 45.98,
  lng: 7.71,
};

export default function Dashboard({ stations, ndsiData, kpiData }: DashboardProps) {
  const [selectedStation, setSelectedStation] = useState<Station['id'] | 'all'>('all');

  const filteredNdsiData = useMemo(() => {
    if (selectedStation === 'all') {
      return ndsiData;
    }
    return ndsiData.filter(d => d.stationId === selectedStation);
  }, [ndsiData, selectedStation]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">
      <Card className="xl:col-span-3 w-full h-[400px] xl:h-auto min-h-[400px] p-0 overflow-hidden shadow-lg">
        <SnowMap
          stations={stations}
          center={mapCenter}
          selectedStationId={selectedStation}
          onMarkerClick={(stationId) => setSelectedStation(prev => prev === stationId ? 'all' : stationId)}
        />
      </Card>
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpiData.map((kpi) => (
            <KpiCard
              key={kpi.stationId}
              title={kpi.name}
              value={kpi.latestNdsi !== null ? kpi.latestNdsi.toFixed(3) : 'N/A'}
              date={kpi.latestDate}
              icon={stationIcons[kpi.stationId]}
              onClick={() => setSelectedStation(prev => prev === kpi.stationId ? 'all' : kpi.stationId)}
              isSelected={selectedStation === kpi.stationId}
            />
          ))}
        </div>
        <Card className="flex-grow">
          <NdsiChart data={filteredNdsiData} selectedStationId={selectedStation} />
        </Card>
      </div>
    </div>
  );
}
