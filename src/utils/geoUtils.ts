import type { Coordinates } from '../types';

export const toRad = (value: number) => (value * Math.PI) / 180;
export const toDeg = (value: number) => (value * 180) / Math.PI;

/**
 * Calculates the destination point given a start point, distance (km), and bearing (degrees).
 */
export const calculateDestination = (start: Coordinates, distanceKm: number, bearing: number): Coordinates => {
    const R = 6371; // Earth Radius in km
    const d = distanceKm;
    const lat1 = toRad(start.lat);
    const lon1 = toRad(start.lng);
    const brng = toRad(bearing);

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
    );

    const lon2 =
        lon1 +
        Math.atan2(
            Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
            Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
        );

    return {
        lat: toDeg(lat2),
        lng: toDeg(lon2),
    };
};

/**
 * Generates a random bearing between 0 and 360.
 */
export const getRandomBearing = (): number => {
    return Math.random() * 360;
};

/**
 * Calculates the bearing between two points.
 */
export const getBearing = (start: Coordinates, end: Coordinates): number => {
    const startLat = toRad(start.lat);
    const startLng = toRad(start.lng);
    const endLat = toRad(end.lat);
    const endLng = toRad(end.lng);
    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
};

/**
 * Detects significant turn points from a list of coordinates.
 * @param coordinates List of route coordinates
 * @param maxPoints Maximum number of turn points to return
 * @param turnThreshold Minimum angle change (degrees) to be considered a turn (default 30)
 */
export const detectTurnPoints = (coordinates: Coordinates[], maxPoints: number = 10, turnThreshold: number = 30): Coordinates[] => {
    if (coordinates.length <= 2) return [];

    const turns: { index: number; angle: number; coord: Coordinates }[] = [];

    // Detect all turns > threshold
    for (let i = 1; i < coordinates.length - 1; i++) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];
        const next = coordinates[i + 1];

        const bearing1 = getBearing(prev, curr);
        const bearing2 = getBearing(curr, next);

        let angleDiff = Math.abs(bearing1 - bearing2);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        if (angleDiff > turnThreshold) {
            turns.push({ index: i, angle: angleDiff, coord: curr });
        }
    }

    // Sort by angle severity (descending) to pick key turns
    turns.sort((a, b) => b.angle - a.angle);

    // Select top candidates
    const selectedTurns = turns.slice(0, maxPoints);

    // Sort back by index to maintain route order
    selectedTurns.sort((a, b) => a.index - b.index);

    return selectedTurns.map(t => t.coord);
};

/**
 * Generates polygon waypoints for a loop route.
 * @param start Start coordinates
 * @param totalDistance Total desired distance in km
 * @param points Number of waypoints (default 3 for a triangle-ish loop)
 */
export const generateLoopWaypoints = (start: Coordinates, totalDistance: number, points: number = 3): Coordinates[] => {
    // Crude approximation: treat the route as a polygon roughly centered explicitly or implicitly.
    // Enhanced strategy: 
    // 1. Pick a random initial bearing.
    // 2. Go out `radius` km.
    // 3. Create a polygon.
    // Radius ~ Perimeter / 2PI for circle, but for a run we want to go OUT and BACK.
    // Let's approximate a circle route where circumference = distance.
    // Diameter = distance / PI. Radius = distance / (2 * PI).

    const centerBearing = getRandomBearing();

    // Special case for Out-and-Back (points=1)
    if (points === 1) {
        const radius = totalDistance / 2.0;
        const destination = calculateDestination(start, radius, centerBearing);
        return [destination];
    }

    const radius = totalDistance / (2 * Math.PI);
    const centerPoint = calculateDestination(start, radius, centerBearing);

    const waypoints: Coordinates[] = [];
    // Generate points around this center (which is actually just the first point on the circle relative to start)
    // Wait, previous logic treated centerPoint as... a point on the circle?
    // "centerPoint = calculateDestination(start, radius, centerBearing)" -> This point is `radius` away from start.
    // So if start is on the circle, centerPoint is the "center"? No.
    // If start is on circle, and we go radius, we are at center?
    // If centerPoint IS the center of the circle, then start is on perimeter.
    // Then we need points on perimeter.

    // Re-reading original logic:
    // const centerPoint = calculateDestination(start, radius, centerBearing);
    // const angleToStart = (centerBearing + 180) % 360;
    // for (...) calculateDestination(centerPoint, radius, angle)

    // Yes, `centerPoint` was used as the CENTER of the circle.
    // And `start` is `radius` away from `centerPoint`.
    // So `centerPoint` IS the center.
    // Correct.

    // So for points=1 (Out and Back), my previous logic above (radius=dist/2, start->dest->start) implies dest is diameter away?
    // No, if I want start -> dest -> start = totalDistance.
    // dist(start, dest) = totalDistance / 2.
    // So `dest` is `totalDistance/2` away from start.
    // That is correct.

    // Resume Polygon Logic for points > 1
    const angleToStart = (centerBearing + 180) % 360;

    for (let i = 1; i < points; i++) {
        const angle = angleToStart + (360 / points) * i;
        waypoints.push(calculateDestination(centerPoint, radius, angle));
    }

    return waypoints;
};
