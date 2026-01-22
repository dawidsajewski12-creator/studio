"use client";

import type { Project, Station } from '@/lib/types';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { Satellite, Waves, Leaf, Droplets } from 'lucide-react';
import { useState, useMemo } from 'react';
import MapLegend from './map-legend';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// --- Base Layer Definitions ---
const baseLayers = {
  topo: {
    name: 'Mapa Topograficzna',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
  },
  satellite: {
    name: 'Satelita (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  street: {
    name: 'Mapa Drogowa',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

type FeatureForMap = Station & { latestIndexValue: number | null };

type MonitorMapProps = {
  project: Project;
  features: FeatureForMap[];
  center: { lat: number; lng: number };
  zoom: number;
  selectedStationId: string | 'all';
  onFeatureClick: (stationId: string) => void;
};

// --- Layer Control Component ---
const LayerControl = ({ activeLayerKey, onLayerChange }: { activeLayerKey: string, onLayerChange: (key: string) => void }) => (
  <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-10 border border-border text-card-foreground w-52">
    <h4 className="font-semibold text-sm mb-2 text-foreground">Base Map</h4>
    <RadioGroup defaultValue={activeLayerKey} onValueChange={onLayerChange} className="gap-3">
      {Object.entries(baseLayers).map(([key, layer]) => (
         <div key={key} className="flex items-center space-x-2">
            <RadioGroupItem value={key} id={`layer-${key}`} />
            <Label htmlFor={`layer-${key}`} className="text-sm font-normal cursor-pointer">{layer.name}</Label>
         </div>
      ))}
    </RadioGroup>
  </div>
);

const getMarkerColor = (value: number | null, projectId: string) => {
    if (value === null) return 'rgba(128, 128, 128, 0.6)';

    if (projectId.includes('lake')) { // NDCI for lakes
        if (value < -0.1) return 'blue';
        if (value <= 0.1) return 'cyan';
        if (value <= 0.2) return 'lime';
        return 'red';
    } else { // NDSI for snow
        if (value < 0.2) return '#8B4513';
        if (value <= 0.5) return '#00FFFF';
        return '#4169E1';
    }
};

export default function MonitorMap({ project, features, center, zoom, selectedStationId, onFeatureClick }: MonitorMapProps) {
  const [activeLayerKey, setActiveLayerKey] = useState('topo');

  const mapStyle = {
    version: 8,
    sources: {
        'base-tiles': { type: 'raster', tiles: [baseLayers[activeLayerKey as keyof typeof baseLayers].url.replace('{s}', 'a')], tileSize: 256, attribution: baseLayers[activeLayerKey as keyof typeof baseLayers].attribution }
    },
    layers: [
        { id: 'base-tiles', type: 'raster', source: 'base-tiles' }
    ]
  };

  return (
    <Map
      key={`${center.lat}-${center.lng}-${activeLayerKey}-${project.id}`}
      initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: zoom }}
      style={{width: '100%', height: '100%'}}
      mapStyle={mapStyle}
      attributionControl={true}
    >
      <MapLegend projectId={project.id} />
      <LayerControl activeLayerKey={activeLayerKey} onLayerChange={setActiveLayerKey} />
      
      {features.map((feature) => (
        <Marker
          key={feature.id}
          longitude={feature.location.lng}
          latitude={feature.location.lat}
          onClick={(e) => { e.originalEvent.stopPropagation(); onFeatureClick(feature.id); }}
        >
            <div 
              className="w-4 h-4 rounded-full cursor-pointer transition-transform duration-200"
              style={{ 
                  backgroundColor: getMarkerColor(feature.latestIndexValue, project.id),
                  border: selectedStationId === feature.id ? '2px solid hsl(var(--accent))' : '1px solid rgba(255,255,255,0.8)',
                  transform: selectedStationId === feature.id ? 'scale(1.5)' : 'scale(1)',
                  boxShadow: '0 0 5px rgba(0,0,0,0.5)',
              }}
            />
        </Marker>
      ))}
    </Map>
  );
}
