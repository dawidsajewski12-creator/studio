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
  { color: 'blue', label: 'Clean Water (< -0.1)' },
  { color: 'cyan', label: 'Turbid Water (-0.1 to 0.1)' },
  { color: 'lime', label: 'Low Algae (0.1 to 0.3)' },
  { color: 'red', label: 'Bloom Risk (> 0.3)' },
  { color: 'rgba(128, 128, 128, 0.4)', label: 'No Data / Land' }
];

export default function MapLegend({ projectId }: MapLegendProps) {
  const isWaterProject = projectId.includes('lake');
  const legendItems = isWaterProject ? waterLegendItems : snowLegendItems;
  const title = isWaterProject ? 'NDCI - Algal Bloom Index' : 'NDSI (Snow Index)';

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
