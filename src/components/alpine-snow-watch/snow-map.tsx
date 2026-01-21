"use client";

import type { Station } from '@/lib/types';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import { Mountain } from 'lucide-react';
import { useState } from 'react';

type SnowMapProps = {
  stations: Station[];
  center: { lat: number; lng: number };
  selectedStationId: Station['id'] | 'all';
  onMarkerClick: (stationId: Station['id']) => void;
};

export default function SnowMap({ stations, center, selectedStationId, onMarkerClick }: SnowMapProps) {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  return (
    <Map
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 10
      }}
      style={{width: '100%', height: '100%'}}
      mapStyle={{
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          }
        ]
      }}
      attributionControl={true}
    >
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
                 <Mountain className="size-5" />
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
