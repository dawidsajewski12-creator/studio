import type { Project } from "@/lib/types";

type MapLegendProps = {
  projectId: Project['id'];
}

const snowLegendItems = [
  { color: '#4169E1', label: 'Deep Snow (> 0.5)' },
  { color: '#00FFFF', label: 'Patchy Snow (0.2-0.5)' },
  { color: '#8B4513', label: 'No Snow (< 0.2)' },
  { color: 'rgba(128, 128, 128, 0.4)', label: 'No Data' }
];

const waterLegendItems = [
  { color: 'red', label: 'High Risk (> 60%)' },
  { color: 'orange', label: 'Warning (30-60%)' },
  { color: 'green', label: 'Safe (< 30%)' },
  { color: 'rgba(128, 128, 128, 0.4)', label: 'No Data' }
];

const vineyardLegendItems = [
  { color: 'green', label: 'Healthy (NDMI > 0.1)' },
  { color: 'orange', label: 'Stress Warning (-0.05 to 0.1)' },
  { color: 'brown', label: 'Critical / Low Vigor' },
  { color: 'rgba(128, 128, 128, 0.4)', label: 'No Data' }
];

export default function MapLegend({ projectId }: MapLegendProps) {
  const isWaterProject = projectId.includes('lake');
  const isVineyardProject = projectId.includes('vineyard');
  
  const legendItems = isWaterProject ? waterLegendItems : isVineyardProject ? vineyardLegendItems : snowLegendItems;
  const title = isWaterProject ? 'Algal Bloom Risk' : isVineyardProject ? 'Vine Health Status' : 'NDSI (Snow Index)';

  return (
    <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-lg w-52 text-card-foreground z-10 border border-border">
      <h4 className="font-semibold text-sm mb-2 text-foreground">{title}</h4>
      <div className="space-y-1">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center">
            <div className="w-4 h-4 rounded-sm mr-2 border border-border/50" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
