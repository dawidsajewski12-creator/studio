import type { Project, Station } from './types';

/**
 * Generates analysis cells for a given station based on the project's analysis type.
 * If the project's analysisType is 'grid' and the station has a bbox and gridShape, it creates a grid of cells.
 * Otherwise (for 'point' analysis), it creates a single 1km x 1km cell around the station's point location.
 * @param station - The station object.
 * @param project - The project object to determine the analysis type.
 * @returns An array of objects, each with a cellId and a bbox.
 */
export function getGridCellsForStation(station: Station, project: Project): { cellId: string; bbox: [number, number, number, number] }[] {
    
    // --- Grid Analysis Logic (from bbox and gridShape) ---
    if (project.analysisType === 'grid' && station.bbox && station.gridShape) {
        const cells = [];
        const [gridWidth, gridHeight] = station.gridShape;
        const [minLng, minLat, maxLng, maxLat] = station.bbox;

        const cellLngSize = (maxLng - minLng) / gridWidth;
        const cellLatSize = (maxLat - minLat) / gridHeight;

        let cellCounter = 0;
        for (let i = 0; i < gridHeight; i++) { // rows
            for (let j = 0; j < gridWidth; j++) { // columns
                const cellMinLat = minLat + (i * cellLatSize);
                const cellMinLng = minLng + (j * cellLngSize);
                
                const cellId = `${station.id}_${cellCounter++}`;
                const cellBbox: [number, number, number, number] = [
                    cellMinLng,
                    cellMinLat,
                    cellMinLng + cellLngSize,
                    cellMinLat + cellLatSize
                ];
                cells.push({ cellId, bbox: cellBbox });
            }
        }
        return cells;
    }

    // --- Point Analysis Logic (fallback for 'point' type projects) ---
    const bufferKm = 0.5; // Default: Creates a 1km x 1km box for points
    const { lat, lng } = station.location;
    const buffer = bufferKm / 111.32; // Rough conversion
    const pointBbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

    return [{
        cellId: station.id, // For point analysis, cellId is the stationId
        bbox: pointBbox
    }];
}
