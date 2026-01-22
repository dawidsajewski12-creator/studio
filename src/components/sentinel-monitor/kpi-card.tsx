"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type KpiCardProps = {
  title: string;
  value: string | number;
  ndmiValue?: string | number | null;
  date: string | null;
  icon: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
  coverage?: number | null;
};

export default function KpiCard({ title, value, ndmiValue, date, icon, onClick, isSelected, coverage }: KpiCardProps) {
    const coverageText = coverage !== null && coverage !== undefined
    ? `Pokrycie: ${coverage.toFixed(0)}%`
    : null;
    
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:bg-card/80 hover:shadow-accent/20 hover:shadow-md",
        isSelected ? "ring-2 ring-accent" : "ring-0"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {ndmiValue !== undefined ? (
            <>
                <div className="text-xl font-bold text-primary">{`NDVI: ${value}`}</div>
                <div className="text-xl font-bold text-muted-foreground">{`NDMI: ${ndmiValue}`}</div>
            </>
        ) : (
            <div className="text-2xl font-bold text-primary">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {date ? `📅 Dane z dnia: ${format(parseISO(date), 'yyyy-MM-dd')}` : 'Brak aktualnych danych'}
        </p>
         {coverageText && (
          <p className="text-xs text-muted-foreground mt-1">
            {coverageText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
