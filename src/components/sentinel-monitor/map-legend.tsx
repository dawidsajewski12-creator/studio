
const legendItems = [
  { color: '#4169E1', label: 'Deep Snow (> 0.5)' },
  { color: '#00FFFF', label: 'Patchy Snow (0.2-0.5)' },
  { color: '#8B4513', label: 'No Snow (< 0.2)' },
  { color: 'rgba(255, 0, 0, 0.5)', label: 'No Data' }
];

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-lg w-48 text-card-foreground z-10 border border-border">
      <h4 className="font-semibold text-sm mb-2 text-foreground">NDSI (Snow Index)</h4>
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
