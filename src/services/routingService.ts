import type { Coordinates, Route } from '../types';

const OSRM_API_BASE = 'https://router.project-osrm.org/route/v1/foot';

export const getRouteFromOSRM = async (waypoints: Coordinates[]): Promise<Route | null> => {
    if (waypoints.length < 2) return null;

    // Format coordinates as "lng,lat;lng,lat"
    const coordsString = waypoints
        .map((p) => `${p.lng},${p.lat}`)
        .join(';');

    const url = `${OSRM_API_BASE}/${coordsString}?overview=full&geometries=geojson&steps=true`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM API Error: ${response.statusText}`);
        }
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error('OSRM API returned no routes', data);
            return null;
        }

        const routeData = data.routes[0];

        // Check for zero or near-zero distance (less than 50 meters)
        // This prevents "0km" routes from being displayed
        if (routeData.distance < 50) {
            console.warn('OSRM returned route with distance < 50m. Treating as invalid.');
            return null;
        }

        const geometry = routeData.geometry.coordinates; // [lng, lat] array

        // Calculate turn count
        // OSRM steps correspond to instructions. We count steps that are likely turns.
        // We exclude 'depart' and 'arrive'.
        let turnCount = 0;
        if (routeData.legs) {
            routeData.legs.forEach((leg: any) => {
                leg.steps.forEach((step: any) => {
                    const type = step.maneuver.type;
                    const modifier = step.maneuver.modifier;
                    // Filter out non-turn maneuvers if possible, or just count all non-trivial instructions
                    // 'new name' might not be a turn. 'depart' and 'arrive' are definitely not turns.
                    if (type !== 'depart' && type !== 'arrive' && type !== 'new name' && modifier !== 'straight') {
                        turnCount++;
                    }
                });
            });
        }

        // Convert [lng, lat] to { lat, lng }
        const coordinates: Coordinates[] = geometry.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
        }));

        return {
            id: `route-${Date.now()}`,
            coordinates,
            distance: routeData.distance / 1000, // meters to km
            turnCount
        };

    } catch (error) {
        console.error('Failed to fetch route from OSRM:', error);
        return null;
    }
};
