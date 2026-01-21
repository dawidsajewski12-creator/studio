"use client";

import type { Station } from '@/lib/types';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { Satellite } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { FeatureCollection } from 'geojson';

type StationWithBbox = Station & { bbox: [number, number, number, number] };

type MonitorMapProps = {
  stations: StationWithBbox[];
  center: { lat: number; lng: number };
  selectedStationId: Station['id'] | 'all';
  onMarkerClick: (stationId: Station['id']) => void;
};

export default function MonitorMap({ stations, center, selectedStationId, onMarkerClick }: MonitorMapProps) {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  const geojson: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: stations.map(station => {
      const [minLng, minLat, maxLng, maxLat] = station.bbox;
      return {
        type: 'Feature',
        properties: { id: station.id },
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

  return (
    <Map
      key={`${center.lat}-${center.lng}-${selectedStationId}`} // Force re-render
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 7
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
          },
          'station-bboxes': {
            type: 'geojson',
            data: geojson
          }
        },
        layers: [
          { id: 'osm-tiles', type: 'raster', source: 'osm-tiles' },
          {
            id: 'bboxes-fill',
            type: 'fill',
            source: 'station-bboxes',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'id'], selectedStationId],
                'hsl(var(--accent))', // Selected color
                'hsl(var(--primary))'   // Default color
              ],
              'fill-opacity': 0.2
            }
          },
          {
            id: 'bboxes-outline',
            type: 'line',
            source: 'station-bboxes',
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'id'], selectedStationId],
                'hsl(var(--accent))', // Selected color
                'hsl(var(--primary))'   // Default color
              ],
              'line-width': 1.5
            }
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
