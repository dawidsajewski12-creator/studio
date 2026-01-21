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
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Dot } from 'recharts';
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

// Custom dot renderer
const renderDot = (stationId: string) => (props: any) => {
  const { cx, cy, payload, stroke, index } = props;
  // Only render a dot if the data point is not interpolated
  if (payload && !payload[`${stationId}_isInterpolated`]) {
    return <Dot key={index} cx={cx} cy={cy} r={3} stroke={stroke} strokeWidth={1} fill={"hsl(var(--background))"} />;
  }
  return null;
};


export default function IndexChart({ data, selectedStationId, project }: IndexChartProps) {
  const { chartData, chartConfig, visibleStations, cloudFreeDaysCount } = useMemo(() => {
    const relevantData = selectedStationId === 'all'
        ? data
        : data.filter(d => d.stationId === selectedStationId);

    const groupedByDate = relevantData.reduce((acc, curr) => {
      const dateStr = format(parseISO(curr.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr };
      }
      acc[dateStr][curr.stationId] = curr.indexValue;
      // Pass the interpolation flag to the chart data
      acc[dateStr][`${curr.stationId}_isInterpolated`] = curr.isInterpolated;
      return acc;
    }, {} as Record<string, { date: string } & Partial<Record<Station['id'], number | boolean>>>);

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
    
    // Calculate the number of non-interpolated (i.e., real) data points
    const observationCount = data.filter(p => {
      if (selectedStationId === 'all') {
        return !p.isInterpolated;
      }
      return p.stationId === selectedStationId && !p.isInterpolated;
    }).length;


    return { chartData: sortedChartData, chartConfig: config, visibleStations: stationsToShow, cloudFreeDaysCount: observationCount };
  }, [data, project, selectedStationId]);
  
  const selectedStationName = selectedStationId === 'all' 
    ? 'All stations' 
    : project.stations.find(s => s.id === selectedStationId)?.name;

  return (
    <>
      <CardHeader>
        <CardTitle>{project.index.name} Trend (Last 365 Days)</CardTitle>
        <CardDescription>
          {`Normalized Difference ${project.index.name.replace('ND', '')} Index for ${selectedStationName}.`}
          <br />
          Suma dni bezchmurnych w roku (obserwacje): {cloudFreeDaysCount}
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
              tickFormatter={(value) => format(parseISO(value), 'MMM')}
              style={{ fontSize: '0.75rem' }}
              interval="preserveStartEnd"
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
                // Use the custom dot renderer
                dot={renderDot(stationId)}
                activeDot={{ r: 4 }}
                name={chartConfig[stationId].label}
                connectNulls={true} // This is crucial for drawing lines over null (interpolated) points
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </div>
    </>
  );
}
