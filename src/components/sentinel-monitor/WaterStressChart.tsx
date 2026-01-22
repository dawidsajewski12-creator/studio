'use client';

import { useMemo } from 'react';
import type { IndexDataPoint } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

type WaterStressChartProps = {
  data: IndexDataPoint[];
};

const chartConfig = {
  waterStress: {
    label: 'Water Stress',
  },
};

export default function WaterStressChart({ data }: WaterStressChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: format(parseISO(point.date), 'yyyy-MM-dd'),
      waterStress: point.waterStress,
    }));
  }, [data]);

  return (
    <>
      <CardHeader>
        <CardTitle>Water Stress Risk</CardTitle>
        <CardDescription>
            Calculated based on the divergence between NDVI and NDMI. Higher values indicate greater water stress.
        </CardDescription>
      </CardHeader>
      <div className="h-[300px] md:h-[400px] px-2">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
            </defs>
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
              unit="%"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: '0.75rem' }}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="line" labelFormatter={(label) => format(parseISO(label), 'PPP')}/>}
            />
            <Area
              type="monotone"
              dataKey="waterStress"
              stroke="hsl(var(--destructive) / 0.8)"
              fill="url(#stressGradient)"
              strokeWidth={2}
              name="Stress Level"
              connectNulls={true}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}
