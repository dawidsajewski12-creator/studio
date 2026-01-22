import type { Station } from './types';

/**
 * Generates analysis cells for a given station.
 * If the station has a bbox and gridShape, it creates a grid over that area.
 * Otherwise, it creates a single 1km x 1km cell around the station's point location.
 * @param station - The station object.
 * @returns An array of objects, each with a cellId and a bbox.
 */
export function getGridCellsForStation(station: Station): { cellId: string; bbox: [number, number, number, number] }[] {
    // --- Grid Analysis Logic (for entire BBox) ---
    if (station.bbox && station.gridShape) {
        const { bbox, gridShape, id: stationId } = station;
        const [minLng, minLat, maxLng, maxLat] = bbox;
        const [gridWidth, gridHeight] = gridShape;
        const cells = [];

        const totalLatDiff = maxLat - minLat;
        const totalLngDiff = maxLng - minLng;
        const cellLat = totalLatDiff / gridHeight;
        const cellLng = totalLngDiff / gridWidth;

        for (let i = 0; i < gridHeight; i++) {
            for (let j = 0; j < gridWidth; j++) {
                const cellMinLat = minLat + (i * cellLat);
                const cellMaxLat = cellMinLat + cellLat;
                const cellMinLng = minLng + (j * cellLng);
                const cellMaxLng = cellMinLng + cellLng;
                
                const cellId = `${stationId}_${i}_${j}`;
                const cellBbox: [number, number, number, number] = [cellMinLng, cellMinLat, cellMaxLng, cellMaxLat];
                cells.push({ cellId, bbox: cellBbox });
            }
        }
        return cells;
    }

    // --- Point Analysis Logic (fallback) ---
    const { lat, lng } = station.location;
    const bufferKm = 0.5; // Creates a 1km x 1km box
    // Approximate conversion: 1 degree of latitude is ~111.32 km.
    const buffer = bufferKm / 111.32;
    const pointBbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

    return [{
        cellId: station.id, // For point analysis, cellId is the stationId
        bbox: pointBbox
    }];
}
