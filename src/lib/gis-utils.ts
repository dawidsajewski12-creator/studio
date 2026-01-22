import type { Project, Station } from './types';

/**
 * Generates an analysis cell for a given station.
 * For all projects (now treated as point-based), it creates a single 2km x 2km cell around the station's point location.
 * @param station - The station object.
 * @param project - The project object.
 * @returns An array containing a single object with a cellId and a bbox.
 */
export function getGridCellsForStation(station: Station, project: Project): { cellId: string; bbox: [number, number, number, number] }[] {
    
    // All projects now use point-based analysis. Lake projects just have many points.
    // The buffer is set based on the project type to control the cell size.
    const bufferKm = project.id.includes('lake') ? 1.0 : 0.5; // ~2x2km for lakes, 1x1km for snow
    const { lat, lng } = station.location;
    const buffer = bufferKm / 111.32; // Rough conversion from km to degrees
    
    const pointBbox: [number, number, number, number] = [lng - buffer, lat - buffer, lng + buffer, lat + buffer];

    return [{
        // The cellId is just the stationId, as each station is now a single analysis point/cell.
        cellId: station.id, 
        bbox: pointBbox
    }];
}
