import type { Project, Station } from './types';

/**
 * Generates an analysis cell for a given station.
 * For all projects (now treated as point-based), it creates a single cell around the station's point location.
 * @param station - The station object.
 * @param project - The project object.
 * @returns An array containing a single object with a cellId and a bbox.
 */
export function getGridCellsForStation(station: Station, project: Project): { cellId: string; bbox: [number, number, number, number] }[] {
    
    // The buffer is set based on the project type to control the cell size.
    // Reduced buffer for lakes to stay under API resolution limits (1500m/px for 1x1 aggregation).
    const bufferKm = project.id.includes('lake') ? 0.7 : 0.5; // ~1.4x1.4km for lakes, 1x1km for snow
    const { lat, lng } = station.location;
    const buffer = bufferKm / 111.32; // Rough conversion from km to degrees
    
    const pointBbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

    return [{
        // The cellId is just the stationId, as each station is now a single analysis point/cell.
        cellId: station.id, 
        bbox: pointBbox
    }];
}
