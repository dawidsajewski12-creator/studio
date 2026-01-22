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
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Dot, ReferenceLine } from 'recharts';
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
const tempColor = 'hsl(var(--destructive))';


// Custom dot renderer for satellite observations
const renderDot = (stationId: string) => (props: any) => {
  const { cx, cy, payload, stroke, index } = props;
  if (payload && !payload.isInterpolated && payload.stationId === stationId) {
    return <Dot key={`dot-${index}`} cx={cx} cy={cy} r={3} stroke={stroke} strokeWidth={1} fill={"hsl(var(--background))"} />;
  }
  return null;
};

export default function IndexChart({ data, selectedStationId, project }: IndexChartProps) {
  const isWaterProject = project.id === 'lake-quality';

  const { chartData, chartConfig, visibleStations, cloudFreeDaysCount } = useMemo(() => {
    const relevantData = selectedStationId === 'all'
      ? data
      : data.filter(d => d.stationId === selectedStationId);

    const groupedByDate = relevantData.reduce((acc, curr) => {
      const dateStr = format(parseISO(curr.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr };
      }
      
      // For grid projects, data is pre-averaged. For point projects, we just assign.
      acc[dateStr][curr.stationId] = curr.indexValue;
      acc[dateStr].isInterpolated = curr.isInterpolated;
      acc[dateStr].stationId = curr.stationId; // Used by dot renderer
      
      if (selectedStationId === 'all' && project.analysisType === 'point') {
        if (!acc[dateStr].tempCount) {
          acc[dateStr].temperature = 0;
          acc[dateStr].tempCount = 0;
        }
        if (curr.temperature !== null) {
          acc[dateStr].temperature += curr.temperature;
          acc[dateStr].tempCount++;
        }
      } else {
        acc[dateStr].temperature = curr.temperature;
      }

      return acc;
    }, {} as any);
    
    if (selectedStationId === 'all' && project.analysisType === 'point') {
        Object.values(groupedByDate).forEach((day: any) => {
            if (day.tempCount > 0) {
                day.temperature = day.temperature / day.tempCount;
            } else {
                day.temperature = null;
            }
        });
    }

    const sortedChartData = Object.values(groupedByDate).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const config: any = {};
    if (!isWaterProject) {
        config.temperature = { label: 'Temperature', color: tempColor };
    }
    project.stations.forEach((station, index) => {
      config[station.id] = {
        label: station.name,
        color: stationColors[index % stationColors.length],
      };
    });

    const stationsToShow = (selectedStationId === 'all' 
        ? project.stations.map(s => s.id)
        : [selectedStationId]) as Station['id'][];
    
    const observationCount = data.filter(p => !p.isInterpolated && p.indexValue !== null).length;

    return { chartData: sortedChartData, chartConfig: config, visibleStations: stationsToShow, cloudFreeDaysCount: observationCount };
  }, [data, project, selectedStationId, isWaterProject]);
  
  const selectedStationName = selectedStationId === 'all' 
    ? 'All stations' 
    : project.stations.find(s => s.id === selectedStationId)?.name;

  const chartTitle = isWaterProject
    ? `${project.index.name} Trend (Last 365 Days)`
    : `${project.index.name} & Temp Trend (Last 365 Days)`;

  const chartDescription = isWaterProject
    ? `${project.index.name} for ${selectedStationName}.`
    : `${project.index.name} and Mean Temperature for ${selectedStationName}.`;

  return (
    <>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>
          {chartDescription}
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
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={isWaterProject ? [-0.2, 0.4] : [project.index.name === 'NDBI' ? -0.5 : 0, 1]}
              style={{ fontSize: '0.75rem' }}
            />
            {!isWaterProject && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[-20, 30]}
                tickFormatter={(value) => `${value}°C`}
                style={{ fontSize: '0.75rem' }}
              />
            )}
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="line" labelFormatter={(label, payload) => {
                return payload?.[0]?.payload?.date ? format(parseISO(payload[0].payload.date), 'PPP') : label;
              }} />}
            />
            {visibleStations.map(stationId => (
              <Line
                key={stationId}
                type="monotone"
                dataKey={stationId}
                stroke={chartConfig[stationId]?.color}
                strokeWidth={2}
                dot={project.analysisType === 'point' ? renderDot(stationId) : false}
                activeDot={{ r: 4 }}
                name={chartConfig[stationId]?.label}
                connectNulls={true}
                yAxisId="left"
              />
            ))}
             {!isWaterProject && (
                <Line
                    key="temperature"
                    type="monotone"
                    dataKey="temperature"
                    stroke={tempColor}
                    strokeWidth={1.5}
                    dot={false}
                    name="Avg. Temp"
                    connectNulls={true}
                    yAxisId="right"
                    strokeOpacity={0.8}
                />
             )}
            {isWaterProject ? (
              <ReferenceLine y={0.1} yAxisId="left" label={{ value: 'Algal Bloom Risk', position: 'insideTopRight', fill: 'hsl(var(--accent))', fontSize: 12 }} stroke="hsl(var(--accent))" strokeDasharray="4 4" />
            ) : (
              <ReferenceLine y={0} yAxisId="right" stroke={tempColor} strokeDasharray="3 3" strokeOpacity={0.5} />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </div>
    </>
  );
}
