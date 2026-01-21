
export default function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm p-3 rounded-lg shadow-lg w-48 text-card-foreground z-10 border border-border">
      <h4 className="font-bold text-xs mb-1">NDSI (Snow Cover)</h4>
      <div 
        className="w-full h-3 rounded-sm border border-border/50" 
        style={{ 
          background: 'linear-gradient(to right, hsl(30, 20%, 60%), hsl(180, 30%, 75%), hsl(195, 80%, 85%), hsl(210, 100%, 98%))' 
        }} 
      />
      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
        <span>Bare</span>
        <span>Snow</span>
      </div>
    </div>
  );
}
