"use client";

import { useMemo } from 'react';
import type { IndexDataPoint, Project, Station } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

type IndexChartProps = {
  data: IndexDataPoint[];
  selectedStationId: Station['id'] | 'all';
  project: Project;
};

const stationColors: string[] = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function IndexChart({ data, selectedStationId, project }: IndexChartProps) {
  const { chartData, chartConfig, visibleStations } = useMemo(() => {
    const filteredData = data.filter((d) => d.indexValue !== -1);
    
    const groupedByDate = filteredData.reduce((acc, curr) => {
      const dateStr = format(parseISO(curr.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr };
      }
      acc[dateStr][curr.stationId] = curr.indexValue;
      return acc;
    }, {} as Record<string, { date: string } & Partial<Record<Station['id'], number>>>);

    const sortedChartData = Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const config: any = {};
    project.stations.forEach((station, index) => {
        config[station.id] = {
            label: station.name,
            color: stationColors[index % stationColors.length],
        };
    });

    const stationsToShow = (selectedStationId === 'all' 
        ? project.stations.map(s => s.id)
        : [selectedStationId]) as Station['id'][];

    return { chartData: sortedChartData, chartConfig: config, visibleStations: stationsToShow };
  }, [data, project, selectedStationId]);
  
  const selectedStationName = selectedStationId === 'all' 
    ? 'All stations' 
    : project.stations.find(s => s.id === selectedStationId)?.name;

  return (
    <>
      <CardHeader>
        <CardTitle>{project.index.name} Trend (Last 90 Days)</CardTitle>
        <CardDescription>
          {`Normalized Difference ${project.index.name.replace('ND', '')} Index. ${selectedStationName}.`}
        </CardDescription>
      </CardHeader>
      <div className="h-[300px] md:h-[400px] px-2">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 1]}
              style={{ fontSize: '0.75rem' }}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="line" labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return format(parseISO(payload[0].payload.date), 'PPP');
                }
                return label;
              }} />}
            />
            {visibleStations.map(stationId => (
              <Line
                key={stationId}
                type="monotone"
                dataKey={stationId}
                stroke={chartConfig[stationId].color}
                strokeWidth={2}
                dot={false}
                name={chartConfig[stationId].label}
                connectNulls={false}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </div>
    </>
  );
}
