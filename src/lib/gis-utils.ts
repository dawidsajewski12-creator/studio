import type { Project, Station } from './types';

/**
 * Generates analysis cells for a given station based on the project's analysis type.
 * If the project's analysisType is 'grid', it creates a 3x3 grid of 1x1 km cells around the station's point location.
 * Otherwise (for 'point' analysis), it creates a single 1km x 1km cell around the station's point location.
 * @param station - The station object.
 * @param project - The project object to determine the analysis type.
 * @returns An array of objects, each with a cellId and a bbox.
 */
export function getGridCellsForStation(station: Station, project: Project): { cellId: string; bbox: [number, number, number, number] }[] {
    const { lat, lng } = station.location;
    
    // --- Grid Analysis Logic (3x3 grid) ---
    if (project.analysisType === 'grid') {
        const cells = [];
        const gridSize = 3; // 3x3 grid
        const cellKm = 1; // Each cell is 1km x 1km
        const totalGridKm = gridSize * cellKm;

        const kmInLatDeg = 111.32;
        const kmInLngDeg = kmInLatDeg * Math.cos(lat * (Math.PI / 180));
        
        const totalLatBuffer = (totalGridKm / 2) / kmInLatDeg;
        const totalLngBuffer = (totalGridKm / 2) / kmInLngDeg;

        const cellLatSize = cellKm / kmInLatDeg;
        const cellLngSize = cellKm / kmInLngDeg;

        const startLat = lat - totalLatBuffer;
        const startLng = lng - totalLngBuffer;

        let cellCounter = 0;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cellMinLat = startLat + (i * cellLatSize);
                const cellMinLng = startLng + (j * cellLngSize);
                
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
    const bufferKm = 0.5; // Creates a 1km x 1km box
    const buffer = bufferKm / 111.32;
    const pointBbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

    return [{
        cellId: station.id, // For point analysis, cellId is the stationId
        bbox: pointBbox
    }];
}
