"use client";

import type { Station } from '@/lib/types';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { Satellite } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { FeatureCollection } from 'geojson';
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

type StationWithExtras = Station & { 
  bbox: [number, number, number, number];
  latestNdsi: number | null;
};

type MonitorMapProps = {
  stations: StationWithExtras[];
  center: { lat: number; lng: number };
  selectedStationId: Station['id'] | 'all';
  onMarkerClick: (stationId: Station['id']) => void;
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

export default function MonitorMap({ stations, center, selectedStationId, onMarkerClick }: MonitorMapProps) {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [activeLayerKey, setActiveLayerKey] = useState('topo');

  const geojson: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: stations.map(station => {
      const [minLng, minLat, maxLng, maxLat] = station.bbox;
      return {
        type: 'Feature',
        properties: { 
          id: station.id,
          ndsiValue: station.latestNdsi,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat]
            ]
          ]
        }
      };
    })
  }), [stations]);

  const mapStyle = useMemo(() => ({
    version: 8,
    sources: {
      'base-tiles': {
        type: 'raster',
        tiles: [baseLayers[activeLayerKey as keyof typeof baseLayers].url.replace('{s}', 'a')],
        tileSize: 256,
        attribution: baseLayers[activeLayerKey as keyof typeof baseLayers].attribution
      },
      'station-bboxes': {
        type: 'geojson',
        data: geojson
      }
    },
    layers: [
      { id: 'base-tiles', type: 'raster', source: 'base-tiles' },
      {
        id: 'bboxes-fill',
        type: 'fill',
        source: 'station-bboxes',
        paint: {
          'fill-color': [
            'case',
            ['==', ['coalesce', ['get', 'ndsiValue'], -999], -999], '#FF0000',
            ['<', ['get', 'ndsiValue'], 0.2], '#8B4513',
            ['<=', ['get', 'ndsiValue'], 0.5], '#00FFFF',
            '#4169E1'
          ],
          'fill-opacity': [
            'case',
            ['==', ['coalesce', ['get', 'ndsiValue'], -999], -999], 0.5,
            0.7
          ]
        }
      },
      {
        id: 'bboxes-outline',
        type: 'line',
        source: 'station-bboxes',
        paint: {
          'line-color': '#000000',
          'line-width': 3,
          'line-opacity': 0.8
        }
      }
    ]
  }), [geojson, activeLayerKey]);

  return (
    <Map
      key={`${center.lat}-${center.lng}-${activeLayerKey}`}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 7
      }}
      style={{width: '100%', height: '100%'}}
      mapStyle={mapStyle}
      attributionControl={true}
    >
      <MapLegend />
      <LayerControl activeLayerKey={activeLayerKey} onLayerChange={setActiveLayerKey} />
      
      {stations.map((station) => (
        <Marker
          key={station.id}
          longitude={station.location.lng}
          latitude={station.location.lat}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onMarkerClick(station.id);
          }}
          onMouseEnter={() => setHoveredStation(station)}
          onMouseLeave={() => setHoveredStation(null)}
        >
            <div className={`p-2 rounded-full cursor-pointer flex items-center justify-center transition-colors duration-300 ${
                selectedStationId === station.id
                ? 'bg-accent text-accent-foreground ring-2 ring-accent'
                : 'bg-card text-card-foreground shadow-md'
            }`}>
                 <Satellite className="size-5" />
            </div>
        </Marker>
      ))}

      {hoveredStation && (
        <Popup
          anchor="top"
          longitude={hoveredStation.location.lng}
          latitude={hoveredStation.location.lat}
          closeButton={false}
          closeOnClick={false}
          className="z-10"
        >
          <div className="bg-popover text-popover-foreground rounded-md px-2 py-1 text-sm shadow-md">
              {hoveredStation.name}
          </div>
        </Popup>
      )}
    </Map>
  );
}
