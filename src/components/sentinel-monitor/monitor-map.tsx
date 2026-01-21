"use client";

import type { Station } from '@/lib/types';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { Satellite } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { FeatureCollection } from 'geojson';
import MapLegend from './map-legend';

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

export default function MonitorMap({ stations, center, selectedStationId, onMarkerClick }: MonitorMapProps) {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

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
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'ndsiValue'], -1], // Use -1 for null (no data)
                -1, 'hsla(225, 13%, 40%, 0.2)', // No data color: transparent grey
                -0.2, 'hsl(30, 20%, 60%)',    // No Snow: Brownish
                0.2, 'hsl(180, 30%, 75%)',   // Patchy Snow: Light Cyan
                0.4, 'hsl(195, 80%, 85%)',   // Snow: Light Blue
                1.0, 'hsl(210, 100%, 98%)'   // Deep Snow: Almost White
              ],
              'fill-opacity': 0.65
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
                'hsl(var(--accent))', // Selected station outline color
                'hsl(var(--primary))' // Default outline color
              ],
              'line-width': [
                'case',
                ['==', ['get', 'id'], selectedStationId],
                2.5,
                1
              ],
              'line-opacity': 0.9
            }
          }
        ]
      }}
      attributionControl={true}
    >
      <MapLegend />
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
