"use client";

import type { Station } from '@/lib/types';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

type SnowMapProps = {
  stations: Station[];
  center: { lat: number; lng: number };
  selectedStationId: Station['id'] | 'all';
  onMarkerClick: (stationId: Station['id']) => void;
};

export default function SnowMap({ stations, center, selectedStationId, onMarkerClick }: SnowMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <p className="text-muted-foreground">Google Maps API Key is missing.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={11}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'a2f5a34423a2c534'}
        className="w-full h-full"
      >
        {stations.map((station) => (
          <AdvancedMarker
            key={station.id}
            position={station.location}
            onClick={() => onMarkerClick(station.id)}
          >
            <div className="relative group">
              <div
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  selectedStationId === station.id ? 'bg-accent/80' : 'bg-background/80'
                )}
              >
                <Mountain 
                  className={cn(
                    "size-5 transition-colors duration-300",
                    selectedStationId === station.id ? 'text-accent-foreground' : 'text-primary'
                  )}
                />
              </div>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                {station.name}
              </div>
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
