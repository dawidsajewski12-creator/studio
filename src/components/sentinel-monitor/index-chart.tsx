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
  aggregatedData?: IndexDataPoint[];
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
const avgColor = 'hsl(var(--chart-3))';
const selectedPointColor = 'hsl(var(--chart-1))';


// Custom dot renderer for satellite observations
const renderDot = (props: any) => {
  const { cx, cy, payload, stroke } = props;
  if (payload && !payload.isInterpolated) {
    return <Dot cx={cx} cy={cy} r={3} stroke={stroke} strokeWidth={1} fill={"hsl(var(--background))"} />;
  }
  return null;
};

export default function IndexChart({ data, aggregatedData, selectedStationId, project }: IndexChartProps) {
  const isLakeProject = project.id.includes('lake');

  const { chartData, chartConfig, visibleLines } = useMemo(() => {
    let finalChartData: any[] = [];
    const config: any = {};
    const lines: { dataKey: string, color: string, name: string, yAxis: 'left' | 'right' }[] = [];

    if (isLakeProject && aggregatedData) {
        // --- LAKE PROJECT LOGIC ---
        const selectedPointData = selectedStationId !== 'all' 
            ? data.filter(d => d.stationId === selectedStationId)
            : [];
        
        const selectedPointMap = new Map(selectedPointData.map(d => [format(parseISO(d.date), 'yyyy-MM-dd'), d]));

        finalChartData = aggregatedData.map(aggPoint => {
            const dateStr = format(parseISO(aggPoint.date), 'yyyy-MM-dd');
            const pointData = selectedPointMap.get(dateStr);
            return {
                date: dateStr,
                average: aggPoint.indexValue,
                isAverageInterpolated: aggPoint.isInterpolated,
                selectedPoint: pointData?.indexValue ?? null,
                isPointInterpolated: pointData?.isInterpolated ?? true,
                temperature: aggPoint.temperature
            }
        });

        config.average = { label: 'Lake Average', color: avgColor };
        lines.push({ dataKey: 'average', color: avgColor, name: 'Lake Average', yAxis: 'left' });

        if (selectedStationId !== 'all') {
            const stationName = project.stations.find(s => s.id === selectedStationId)?.name || 'Selected Point';
            config.selectedPoint = { label: stationName, color: selectedPointColor };
            lines.push({ dataKey: 'selectedPoint', color: selectedPointColor, name: stationName, yAxis: 'left' });
        }
    } else {
        // --- SNOW PROJECT LOGIC ---
        const groupedByDate = data.reduce((acc, curr) => {
            const dateStr = format(parseISO(curr.date), 'yyyy-MM-dd');
            if (!acc[dateStr]) acc[dateStr] = { date: dateStr };
            acc[dateStr][curr.stationId] = curr.indexValue;
            acc[dateStr][`${curr.stationId}_interpolated`] = curr.isInterpolated;
            acc[dateStr].temperature = curr.temperature; // Temp is the same for all stations in snow watch
            return acc;
        }, {} as any);
        
        finalChartData = Object.values(groupedByDate).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        project.stations.forEach((station, index) => {
            config[station.id] = { label: station.name, color: stationColors[index % stationColors.length] };
        });
        config.temperature = { label: 'Temperature', color: tempColor };
        
        const stationsToShow = selectedStationId === 'all' ? project.stations.map(s => s.id) : [selectedStationId];
        stationsToShow.forEach(id => lines.push({ dataKey: id, color: config[id].color, name: config[id].label, yAxis: 'left' }));
        lines.push({ dataKey: 'temperature', color: tempColor, name: 'Temperature', yAxis: 'right' });
    }

    return { chartData: finalChartData, chartConfig: config, visibleLines: lines };
  }, [data, aggregatedData, selectedStationId, project, isLakeProject]);
  
  const selectedStationName = selectedStationId === 'all' 
    ? 'All Stations' 
    : project.stations.find(s => s.id === selectedStationId)?.name || 'Average';

  const chartTitle = isLakeProject
    ? `NDCI Trend for ${project.name}`
    : `NDSI & Temp Trend (Last 365 Days)`;

  const chartDescription = isLakeProject
    ? `Lake-wide average vs. individual sensor data for ${selectedStationName}.`
    : `Snow index and mean temperature for ${selectedStationName}.`;

  return (
    <>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>{chartDescription}</CardDescription>
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
              domain={isLakeProject ? [-0.2, 0.4] : [project.index.name === 'NDBI' ? -0.5 : 0, 1]}
              style={{ fontSize: '0.75rem' }}
            />
            {!isLakeProject && (
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
            {visibleLines.map(line => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={line.dataKey === 'average' ? 2.5 : 2}
                strokeOpacity={line.dataKey === 'temperature' ? 0.8 : 1}
                dot={line.dataKey === 'selectedPoint' ? renderDot : false}
                activeDot={{ r: 4 }}
                name={line.name}
                connectNulls={true}
                yAxisId={line.yAxis}
              />
            ))}
            {isLakeProject ? (
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
