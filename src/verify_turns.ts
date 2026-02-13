import { getRouteFromOSRM } from './services/routingService';

async function verify() {
    // Tokyo Station to Imperial Palace (approx)
    const waypoints = [
        { lat: 35.6812, lng: 139.7671 },
        { lat: 35.6852, lng: 139.7528 }
    ];

    console.log("Fetching route...");
    const route = await getRouteFromOSRM(waypoints);

    if (route) {
        console.log(`Route found: ${route.distance}km`);
        console.log(`Turn Count: ${route.turnCount}`);

        if (typeof route.turnCount === 'number') {
            console.log("VERIFICATION SUCCESS: turnCount is present.");
        } else {
            console.error("VERIFICATION FAILED: turnCount is missing.");
        }
    } else {
        console.error("Failed to fetch route.");
    }
}

verify();
