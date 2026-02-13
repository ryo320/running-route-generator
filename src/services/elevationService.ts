import type { Coordinates } from '../types';

// Public Open-Elevation API
const ELEVATION_API_BASE = 'https://api.open-elevation.com/api/v1/lookup';

interface ElevationResult {
    latitude: number;
    longitude: number;
    elevation: number;
}

interface ElevationResponse {
    results: ElevationResult[];
}

/**
 * Fetches elevation data for a list of coordinates.
 * Note: To avoid hitting API limits or strict payload sizes, we should sample the coordinates.
 */
export const getElevations = async (coordinates: Coordinates[]): Promise<number[]> => {
    // Sampling: Take a point every ~100m is usually enough for a run profile, 
    // but OSRM returns many points. Let's limit to max 50-100 points per request.
    const sampleRate = Math.ceil(coordinates.length / 50);
    const sampledCoords = coordinates.filter((_, i) => i % sampleRate === 0);

    // Ensure start and end are included if not already
    if (sampledCoords[sampledCoords.length - 1] !== coordinates[coordinates.length - 1]) {
        sampledCoords.push(coordinates[coordinates.length - 1]);
    }

    const locations = sampledCoords.map(c => ({ latitude: c.lat, longitude: c.lng }));

    try {
        const response = await fetch(ELEVATION_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locations })
        });

        if (!response.ok) {
            console.warn('Elevation API error:', response.statusText);
            return [];
        }

        const data: ElevationResponse = await response.json();
        return data.results.map(r => r.elevation);
    } catch (error) {
        console.error('Failed to fetch elevation:', error);
        return [];
    }
};

/**
 * Calculates total elevation gain from a list of elevations.
 */
export const calculateElevationGain = (elevations: number[]): number => {
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) {
            gain += diff;
        }
    }
    return gain;
};

/**
 * Checks if a route is considered "flat".
 * Threshold: e.g., less than 10m gain per km? 
 * Or fixed total gain?
 * Let's use gain per km. 
 * A marathon is "flat" if < 100-200m? 
 * 5km with 30m gain is pretty flat. 50m is rolling.
 * Let's define flat as < 8m/km for now.
 */
export const isRouteFlat = (distanceKm: number, elevationGainM: number): boolean => {
    if (distanceKm === 0) return true;
    return (elevationGainM / distanceKm) < 10.0; // 10m gain per km
};
