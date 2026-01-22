"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type KpiCardProps = {
  title: string;
  value: string | number;
  date: string | null;
  icon: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
};

export default function KpiCard({ title, value, date, icon, onClick, isSelected }: KpiCardProps) {
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
        <div className="text-2xl font-bold text-primary">{value}</div>
        <p className="text-xs text-muted-foreground">
          {date ? `📅 Dane z dnia: ${format(parseISO(date), 'yyyy-MM-dd')}` : 'Brak aktualnych danych'}
        </p>
      </CardContent>
    </Card>
  );
}
