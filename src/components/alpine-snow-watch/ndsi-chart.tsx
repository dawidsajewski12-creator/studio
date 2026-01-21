"use client";

import { useMemo } from 'react';
import type { NdsiDataPoint, Station } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

type NdsiChartProps = {
  data: NdsiDataPoint[];
  selectedStationId: Station['id'] | 'all';
};

const stationColors: Record<Station['id'], string> = {
  valley: 'hsl(var(--chart-3))',
  glacier: 'hsl(var(--chart-1))',
  summit: 'hsl(var(--chart-2))',
};

export default function NdsiChart({ data, selectedStationId }: NdsiChartProps) {
  const chartData = useMemo(() => {
    const filteredData = data.filter((d) => d.ndsi !== -1);
    const groupedByDate = filteredData.reduce((acc, curr) => {
      const dateStr = format(parseISO(curr.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr };
      }
      acc[dateStr][curr.stationId] = curr.ndsi;
      return acc;
    }, {} as Record<string, { date: string } & Partial<Record<Station['id'], number>>>);

    return Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);
  
  const chartConfig = {
    valley: { label: "Valley", color: stationColors.valley },
    glacier: { label: "Glacier", color: stationColors.glacier },
    summit: { label: "Summit", color: stationColors.summit },
  };

  const visibleStations = (selectedStationId === 'all' 
    ? ['valley', 'glacier', 'summit'] 
    : [selectedStationId]) as Station['id'][];

  return (
    <>
      <CardHeader>
        <CardTitle>NDSI Trend (Last 90 Days)</CardTitle>
        <CardDescription>
          Normalized Difference Snow Index. {selectedStationId === 'all' ? 'All stations' : chartConfig[selectedStationId].label}.
        </CardDescription>
      </CardHeader>
      <div className="h-[300px] md:h-[400px] px-2">
        <ResponsiveContainer width="100%" height="100%">
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
                stroke={stationColors[stationId]}
                strokeWidth={2}
                dot={false}
                name={chartConfig[stationId].label}
                connectNulls={false}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
