import type { Station } from './types';

/**
 * Calculates a square bounding box around a given geographic point.
 * @param station - The station object with latitude and longitude.
 * @param bufferKm - The buffer distance in kilometers from the center to the edge.
 * @returns A bounding box array: [minLng, minLat, maxLng, maxLat].
 */
export function getBoundingBox(station: Station, bufferKm = 0.5): [number, number, number, number] {
    const { lat, lng } = station.location;
    // Approximate conversion: 1 degree of latitude is ~111.32 km.
    const buffer = bufferKm / 111.32;
    return [lng - buffer, lat - buffer, lng + buffer, lat + buffer];
}
