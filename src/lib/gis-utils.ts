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

/**
 * Generates a 3x3 grid of bounding boxes around a central station point.
 * @param station - The central station.
 * @param gridSize - The number of cells along one axis (e.g., 3 for a 3x3 grid).
 * @param cellSizeKm - The size of each cell in kilometers.
 * @returns An array of objects, each with a cellId and a bbox.
 */
export function getGridCells(station: Station, gridSize: number = 3, cellSizeKm: number = 1): { cellId: string; bbox: [number, number, number, number] }[] {
    const cells = [];
    const { lat: centerLat, lng: centerLng } = station.location;
    
    // Degrees per km (approximate)
    const latDegPerKm = 1 / 111.32;
    const lngDegPerKm = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));

    const cellStepLat = cellSizeKm * latDegPerKm;
    const cellStepLng = cellSizeKm * lngDegPerKm;

    const startLat = centerLat + cellStepLat * (Math.floor(gridSize / 2));
    const startLng = centerLng - cellStepLng * (Math.floor(gridSize / 2));
    
    const cellBufferLat = cellStepLat / 2;
    const cellBufferLng = cellStepLng / 2;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cellCenterLat = startLat - (i * cellStepLat);
            const cellCenterLng = startLng + (j * cellStepLng);
            
            const cellId = `${station.id}_${i*gridSize + j}`;
            const bbox: [number, number, number, number] = [
                cellCenterLng - cellBufferLng,
                cellCenterLat - cellBufferLat,
                cellCenterLng + cellBufferLng,
                cellCenterLat + cellBufferLat,
            ];
            cells.push({ cellId, bbox });
        }
    }
    return cells;
}
