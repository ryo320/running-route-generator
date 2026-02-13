import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import MapView from './components/Map/MapView';
import RoutePlanner from './components/Controls/RoutePlanner';
import type { RouteRequest, Coordinates, Route } from './types';
import { generateLoopWaypoints, calculateDestination, getRandomBearing } from './utils/geoUtils';
import { getRouteFromOSRM } from './services/routingService';
import { getScenicPOIs, getProximityPOIs, getUrbanPOIs, getQuietPOIs, getFlatPOIs, getFewLightsPOIs } from './services/poiService';
import { getElevations, calculateElevationGain, isRouteFlat } from './services/elevationService';
import RouteDetails from './components/Controls/RouteDetails';
import Toast from './components/UI/Toast';
import type { ToastType } from './components/UI/Toast';
import LoadingOverlay from './components/UI/LoadingOverlay';

function App() {
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({ lat: 35.6895, lng: 139.6917 }); // Default Tokyo
  const [startLocation, setStartLocation] = useState<Coordinates | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Coordinates | null>(null);

  const [routeRequest, setRouteRequest] = useState<Omit<RouteRequest, 'start'>>({
    distance: 5,
    type: 'loop',
    preferences: {
      scenery: false,
      safety: false,
      flat: false,
      quiet: false,
      fewLights: false,
      urban: false,
      minimizeTurns: false
    },
    avoidRepetition: true
  });
  const [generatedRoute, setGeneratedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Initial location fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(coords);
          // Only set start location if not already set manually
          setStartLocation((prev) => prev || coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Initialize destination if switching to One-way
  // Clear destination when switching to Loop
  useEffect(() => {
    if (routeRequest.type === 'loop') {
      setDestinationLocation(null);
    }
  }, [routeRequest.type]);

  const handleToggleDestination = (enabled: boolean) => {
    if (enabled) {
      const start = startLocation || currentLocation;
      setDestinationLocation({
        lat: start.lat + 0.005,
        lng: start.lng + 0.005
      });
    } else {
      setDestinationLocation(null);
    }
  };

  // Marker Drag Handlers
  const handleStartDragEnd = (coords: Coordinates) => {
    setStartLocation(coords);
  };

  const handleDestinationDragEnd = (coords: Coordinates) => {
    setDestinationLocation(coords);
  };

  const handleGenerateRoute = async (overrideRequest?: Omit<RouteRequest, 'start'>) => {
    // Use override if provided, else state
    const currentRequest = overrideRequest || routeRequest;

    setIsLoading(true);
    setGeneratedRoute(null);

    const targetDistance = currentRequest.distance;
    // Tolerance: 10% or 1km, whichever is smaller, but at least 500m
    const tolerance = Math.max(0.5, Math.min(1.0, targetDistance * 0.1));

    let bestRoute: Route | null = null;
    let minError = Infinity;
    const startTime = Date.now();
    const CALCULATION_TIMEOUT_MS = 10000; // 10 seconds
    let timedOut = false;

    // Use Manual Start if set
    const effectiveStart = startLocation || currentLocation;

    // DIRECT ROUTE (One-way with explicit destination)
    if (currentRequest.type === 'one-way' && destinationLocation) {
      console.log("Generating direct route to destination...");
      const waypoints = [effectiveStart, destinationLocation];
      const route = await getRouteFromOSRM(waypoints);
      if (route) {
        const elevations = await getElevations(route.coordinates);
        route.elevationGain = calculateElevationGain(elevations);
        route.turnCount = route.turnCount ?? 0;
        setGeneratedRoute(route);
        showToast("ルートを作成しました！", 'success');
      } else {
        showToast("ルートが見つかりませんでした。", 'error');
      }
      setIsLoading(false);
      return;
    }


    try {
      // Attempt loop for accuracy
      const MAX_ATTEMPTS = 10;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        // Check timeout
        if (Date.now() - startTime > CALCULATION_TIMEOUT_MS) {
          console.log("Calculation timed out. Returning best route found so far.");
          timedOut = true;
          break;
        }

        console.log(`Generation Attempt ${attempt}/${MAX_ATTEMPTS}: Target ${targetDistance}km`);

        // Adjust scale factor based on previous error if any
        let scaleFactor = 1.0;
        if (bestRoute && bestRoute.distance > 0) {
          scaleFactor = targetDistance / bestRoute.distance;
          // Dampen the correction to avoid oscillation
          scaleFactor = 1.0 + (scaleFactor - 1.0) * 0.8;
          console.log(`Applying scale factor: ${scaleFactor}`);
        }

        // Adjust effective distance for calculation
        const effectiveDistance = targetDistance * scaleFactor;

        let waypoints: Coordinates[] = [];
        const searchRadius = (effectiveDistance * 1000) / 2;

        // 1. POI Logic
        const intermediatePoints: Coordinates[] = [];

        // Fetch POIs based on preferences
        if (currentRequest.preferences.scenery) {
          const pois = await getScenicPOIs(effectiveStart, Math.min(searchRadius, 3000));
          if (pois.length > 0) intermediatePoints.push(pois[Math.floor(Math.random() * pois.length)]);
        }
        if (currentRequest.preferences.urban) {
          const pois = await getUrbanPOIs(effectiveStart, Math.min(searchRadius, 3000));
          if (pois.length > 0) intermediatePoints.push(pois[Math.floor(Math.random() * pois.length)]);
        }
        if (currentRequest.preferences.safety) {
          const pois = await getProximityPOIs(effectiveStart, Math.min(searchRadius, 3000));
          if (pois.length > 0) intermediatePoints.push(pois[0]);
        }
        if (currentRequest.preferences.quiet) {
          const pois = await getQuietPOIs(effectiveStart, Math.min(searchRadius, 3000));
          if (pois.length > 0) intermediatePoints.push(pois[Math.floor(Math.random() * pois.length)]);
        }
        if (currentRequest.preferences.flat) {
          const pois = await getFlatPOIs(effectiveStart, Math.min(searchRadius, 3000));
          if (pois.length > 0) intermediatePoints.push(pois[Math.floor(Math.random() * pois.length)]);
        }
        if (currentRequest.preferences.fewLights) {
          const pois = await getFewLightsPOIs(effectiveStart, Math.min(searchRadius, 3000));
          // Prefer paths/cycleways
          if (pois.length > 0) intermediatePoints.push(pois[Math.floor(Math.random() * pois.length)]);
        }

        // Remove duplicates and limit POIs to avoid zigzag
        const uniquePoints = intermediatePoints.filter((v, i, a) => a.findIndex(t => t.lat === v.lat && t.lng === v.lng) === i).slice(0, 3);

        // 2. Waypoint Generation
        if (currentRequest.type === 'loop') {
          if (uniquePoints.length > 0 && !currentRequest.avoidRepetition) {
            // Basic loop through POIs
            waypoints = [effectiveStart, ...uniquePoints, effectiveStart];
          } else {
            // Generate geometric loop if avoidRepetition is on or no POIs found
            // Use 3 points for a triangle, 4 for square
            // Fallback: If we differ struggling to find a route (attempt > 5), simplify the shape to just 1 point (out and back triangle)
            const isFallbackMode = attempt > 5;
            let pointsCount = currentRequest.avoidRepetition ? 3 : 1;

            if (isFallbackMode) {
              console.log("Fallback mode: Simplifying route shape to increase success rate.");
              pointsCount = 1;
            }

            const geometricWaypoints = generateLoopWaypoints(effectiveStart, effectiveDistance, pointsCount);

            // If we have POIs, try to replace geometric points with nearest POIs? 
            // For now, just append POIs if they fit? No, simpler to just use geometric points if avoidRepetition is prioritized.
            // Let's mix: Use Geometric points as base.
            waypoints = [effectiveStart, ...geometricWaypoints, effectiveStart];

            // TODO: If POIs exist, we could insert them? 
            // For MVP of this feature, geometric loop ensures "different path".
          }
        } else {
          const bearing = getRandomBearing();
          const destination = calculateDestination(effectiveStart, effectiveDistance, bearing);
          if (uniquePoints.length > 0) {
            waypoints = [effectiveStart, ...uniquePoints, destination];
          } else {
            waypoints = [effectiveStart, destination];
          }
        }

        const route = await getRouteFromOSRM(waypoints);

        if (route) {
          // Calculate Elevation
          const elevations = await getElevations(route.coordinates);
          const elevationGain = calculateElevationGain(elevations);
          route.elevationGain = elevationGain;

          const error = Math.abs(route.distance - targetDistance);
          const turnCount = route.turnCount ?? 0;
          console.log(`Attempt ${attempt} Result: ${route.distance}km (Error: ${error.toFixed(2)}km), Gain: ${elevationGain}m, Turns: ${turnCount}`);

          // Check "Flat" preference
          if (currentRequest.preferences.flat) {
            const isFlat = isRouteFlat(route.distance, elevationGain);
            console.log(`Flatness check: ${isFlat ? 'PASS' : 'FAIL'} (${(elevationGain / route.distance).toFixed(1)}m/km)`);

            if (!isFlat && attempt < MAX_ATTEMPTS) {
              console.log("Route too hilly for 'Flat' preference. Retrying...");
              // If too hilly, we might want to try a different random seed or avoid the hilly area.
              // For now, simple retry might pick a different random bearing.
              // But if we are keeping 'bestRoute', we should only keep this one if it's better than previous best?
              // Logic: If 'Flat' is required, prioritize Flatness over Distance Accuracy?
              // Let's say: If completely fails flatness, we don't accept it as "best" unless it's the last attempt.

              // If this is not flat, and we have retries left, continue to next loop without setting bestRoute?
              // Or set it as bestRoute ONLY if we don't have one yet?
              if (!bestRoute) {
                bestRoute = { ...route, waypoints };
                minError = error; // Track error for this route
              }
              // Don't break, try again to find a flatter one
              await new Promise(r => setTimeout(r, 500));
              continue;
            }
          }

          // If we passed flatness check (or didn't care), check distance accuracy and turns
          // If minimizeTurns is ON, we prioritize low turn count for valid routes
          if (currentRequest.preferences.minimizeTurns) {
            // If this route is "valid" (within reasonable range, say 1.5x tolerance for candidates is too loose? let's stick to error check later)
            // We update bestRoute if:
            // 1. It's the first one.
            // 2. It has FEWER turns than current best.
            // 3. It has SAME turns but BETTER distance accuracy.

            // First, is it better than what we have?
            let isBetter = false;
            if (!bestRoute) {
              isBetter = true;
            } else {
              const bestTurns = bestRoute.turnCount ?? Infinity;
              if (turnCount < bestTurns) {
                // Much better turns? But wait, what if distance is way off?
                // We should only compare "valid" routes if we can? 
                // Or just prioritize turns overall? 
                // Let's assume we want "close to distance" AND "few turns".
                // If both are within tolerance (checked below), we pick fewer turns.
                // But here we are just tracking "best so far".
                // Let's weigh them: Minimize (Error + TurnPenalty).
                // But simpler: If minimizeTurns is ON, we exhaust ALL attempts (don't break early) and pick the one with lowest turns among those within tolerance.
                // If none within tolerance, pick one with lowest error? Or lowest turns?
                // Let's stick to: Update bestRoute if error is smaller (standard) BUT if we find a Valid Tolerance route, we store it in a candidate list?

                // Alternative: Just update bestRoute if (error < minError). 
                // BUT, if we hit tolerance logic (below), we usually BREAK. 
                // We should change the BREAK logic.

                // Let's adhere to: Best Route = Closest Distance (unless we find multiple within tolerance).
                if (error < minError) {
                  isBetter = true;
                }
              } else if (turnCount === bestTurns && error < minError) {
                isBetter = true;
              }
            }

            if (isBetter) {
              minError = error;
              bestRoute = { ...route, waypoints };
            }

          } else {
            // Standard logic: optimize for distance accuracy
            if (error < minError) {
              minError = error;
              bestRoute = { ...route, waypoints };
            }
          }

          if (error <= tolerance) {
            // If flat preference is on, we only break if it's also flat.
            if (currentRequest.preferences.flat && !isRouteFlat(route.distance, elevationGain)) {
              // It's accurate distance but hilly.
            } else if (currentRequest.preferences.minimizeTurns) {
              // If minimizeTurns is ON, we have a VALID route.
              // But we want to find the one with FEWEST TURNS.
              // So we do NOT break. We continue to try to find other routes.
              // We should record this as a "candidate" or just ensure bestRoute logic above handles it.
              // Re-evaluating bestRoute logic above:
              // If I find a route with 0 turns but 10km error (target 5), and one with 10 turns and 0km error.
              // The 0 turn one is likely useless.
              // So "BestRoute" should primarily be "Valid Distance".

              // Let's refine the Strategy for Minimize Turns:
              // 1. Keep track of "Best Valid Route" (lowest turns among valid distance routes).
              // 2. Keep track of "Best Fallback Route" (closest distance if no valid routes).

              // Currently `bestRoute` is used for both.
              // Let's just say: If we are within tolerance, we compare with current `bestRoute` (if it was also within tolerance).

              const currentBestIsWithinTolerance = bestRoute && Math.abs(bestRoute.distance - targetDistance) <= tolerance;

              if (currentBestIsWithinTolerance) {
                // if current route has fewer turns than bestRoute, take it.
                if ((route.turnCount ?? 0) < (bestRoute?.turnCount ?? Infinity)) {
                  bestRoute = { ...route, waypoints };
                  console.log("New best route found (fewer turns)");
                }
              } else {
                // Previous best was NOT within tolerance, but this one IS.
                // So this one clearly wins.
                bestRoute = { ...route, waypoints };
                minError = error;
              }

              console.log("Route within tolerance found. Continuing search for fewer turns...");
              // Do NOT break, continue loop to find potentially better routes
            } else {
              console.log("Route within tolerance found.");
              break;
            }
          }
        }

        // Wait a short bit before next API call
        await new Promise(r => setTimeout(r, 500));
      }

      // Emergency Fallback: If random attempts failed, try deterministic cardinal directions
      if (!bestRoute && routeRequest.type === 'loop') {
        console.log("Entering Emergency Fallback Mode (Cardinal Directions)");
        const directions = [0, 90, 180, 270]; // North, East, South, West

        for (const bearing of directions) {
          console.log(`Fallback Attempt: Bearing ${bearing} degrees`);
          const radius = targetDistance / 2.0;
          const dest = calculateDestination(effectiveStart, radius, bearing);
          const waypoints = [effectiveStart, dest, effectiveStart];

          const route = await getRouteFromOSRM(waypoints);

          if (route) {
            // Calculate Elevation for consistency
            const elevations = await getElevations(route.coordinates);
            const elevationGain = calculateElevationGain(elevations);
            route.elevationGain = elevationGain;
            route.turnCount = route.turnCount ?? 0;

            // Strict validity check: distance must be non-trivial
            if (route.distance > 0.1) {
              console.log(`Fallback Success: Found route in direction ${bearing}`);
              bestRoute = { ...route, waypoints };
              break; // Found a route, stop searching
            }
          }
          // Small delay to be nice to API
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (bestRoute) {
        setGeneratedRoute(bestRoute);
        if (timedOut) {
          showToast("検索時間を超過したため、現時点の最善ルートを表示します", 'info');
        } else {
          showToast("ルートを生成しました", 'success');
        }
      } else {
        showToast("ルートを生成できませんでした。条件を緩めて再試行してください。", 'error');
      }

    } catch (error) {
      console.error("Route generation failed:", error);
      showToast("エラーが発生しました。", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Retry: Keep settings (just re-roll)
  const handleRetrySameSettings = () => {
    handleGenerateRoute(routeRequest);
  };

  // Retry: Keep distance, reset preferences
  const handleRetrySameDistance = () => {
    const newRequest: Omit<RouteRequest, 'start'> = {
      distance: routeRequest.distance,
      type: routeRequest.type,
      preferences: {
        scenery: false,
        safety: false,
        flat: false,
        quiet: false,
        fewLights: false,
        urban: false,
        minimizeTurns: false
      },
      avoidRepetition: true
    };
    // Update state to match visual
    setRouteRequest(newRequest);
    handleGenerateRoute(newRequest);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapView
          center={currentLocation}
          startPoint={startLocation}
          destination={destinationLocation}
          route={generatedRoute}
          onStartDragEnd={handleStartDragEnd}
          onDestinationDragEnd={handleDestinationDragEnd}
        />
        {/* Helper Text Overlay */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-200 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-2 whitespace-nowrap">
            <span className="flex gap-0.5">
              <MapPin className="w-5 h-5 text-blue-600 fill-blue-600/20" />
              <MapPin className="w-5 h-5 text-red-500 fill-red-500/20" />
            </span>
            ピンをドラッグしてスタート・ゴール地点を調整できます
          </p>
        </div>

        {/* Loading Overlay */}
        {isLoading && <LoadingOverlay message="最適なランニングルートを探しています..." />}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="absolute top-4 left-4 z-10 w-full max-w-sm md:top-8 md:left-8 max-h-[90vh] overflow-y-auto pb-8 scrollbar-hide">
        <RoutePlanner
          requests={routeRequest}
          onChange={setRouteRequest}
          onGenerate={() => handleGenerateRoute()}
          isLoading={isLoading}
          hasDestination={!!destinationLocation}
          onToggleDestination={handleToggleDestination}
        />
        {generatedRoute && (
          <RouteDetails
            route={generatedRoute}
            targetDistance={routeRequest.distance}
            onRetrySameSettings={handleRetrySameSettings}
            onRetrySameDistance={handleRetrySameDistance}
          />
        )}
      </div>
    </div>
  )
}

export default App
