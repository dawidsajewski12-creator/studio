'use client';

import { useMemo } from 'react';
import type { IndexDataPoint } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scatter, ScatterChart, XAxis, YAxis, CartesianGrid, ZAxis } from 'recharts';
import { format, parseISO, getDayOfYear } from 'date-fns';

type RiskClusterChartProps = {
  data: IndexDataPoint[];
};

const chartConfig = {
  ndci: { label: 'NDCI' },
  temperature: { label: 'Temperature' },
};

export default function RiskClusterChart({ data }: RiskClusterChartProps) {

  const chartData = useMemo(() => {
    return data.map(point => ({
      temperature: point.temperature,
      ndci: point.indexValue,
      date: point.date,
      dayOfYear: getDayOfYear(parseISO(point.date)),
    }));
  }, [data]);

  const domain = useMemo(() => {
    const temps = chartData.map(d => d.temperature!);
    const ndcis = chartData.map(d => d.ndci!);
    return {
      x: [Math.min(...temps) - 2, Math.max(...temps) + 2],
      y: [Math.min(...ndcis) - 0.05, Math.max(...ndcis) + 0.05],
    };
  }, [chartData]);


  return (
    <>
      <CardHeader>
        <CardTitle>Risk Cluster</CardTitle>
        <CardDescription>
          NDCI vs. Temperature. Points in the top-right indicate high-risk bloom conditions.
        </CardDescription>
      </CardHeader>
      <div className="h-[300px] md:h-[400px] px-2">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <ScatterChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorScale" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                    <stop offset="50%" stopColor="hsl(var(--chart-2))" />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis
              dataKey="temperature"
              type="number"
              name="Temperature"
              unit="°C"
              domain={domain.x}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              dataKey="ndci"
              type="number"
              name="NDCI"
              domain={domain.y}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '0.75rem' }}
            />
            <ZAxis dataKey="dayOfYear" range={[0, 365]} />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<ChartTooltipContent labelFormatter={(value, payload) => {
                return payload?.[0]?.payload?.date ? format(parseISO(payload[0].payload.date), 'PPP') : '';
              }} />}
            />
            <Scatter name="Daily Reading" data={chartData} fill="url(#colorScale)" />
          </ScatterChart>
        </ChartContainer>
      </div>
    </>
  );
}
