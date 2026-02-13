import type { Coordinates } from '../types';

const OVERPASS_API_BASE = 'https://overpass-api.de/api/interpreter';

export interface POI {
  lat: number;
  lng: number;
  type: 'park' | 'water' | 'lit';
  name?: string;
}

/**
 * Fetches Scenic POIs (Parks, Water) near a given location within a radius.
 */
export const getScenicPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  // Overpass QL
  // relation["leisure"="park"](around:radius, lat, lng);
  // way["leisure"="park"](around:radius, lat, lng);
  // relation["natural"="water"](around:radius, lat, lng);

  const query = `
    [out:json][timeout:25];
    (
      way["leisure"="park"](around:${radius},${center.lat},${center.lng});
      relation["leisure"="park"](around:${radius},${center.lat},${center.lng});
      way["natural"="water"](around:${radius},${center.lat},${center.lng});
      relation["natural"="water"](around:${radius},${center.lat},${center.lng});
    );
    out center 10; 
  `;

  return fetchPOIs(query, 'park');
};

/**
 * Fetches "Safe" POIs (e.g. well-lit streets, convenience stores, police stations - simplified for now).
 * Note: Data for "lit" is sparse. using convenience stores as safe points proxy or main roads.
 */
export const getProximityPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  // searching for convenience stores as they are usually lit and safe
  const query = `
      [out:json][timeout:25];
      (
        node["shop"="convenience"](around:${radius},${center.lat},${center.lng});
      );
      out 10;
    `;
  return fetchPOIs(query, 'lit');
};

/**
 * Fetches Urban/Lively POIs (Commercial areas, Attractions).
 */
export const getUrbanPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  const query = `
      [out:json][timeout:25];
      (
        way["landuse"="commercial"](around:${radius},${center.lat},${center.lng});
        relation["landuse"="commercial"](around:${radius},${center.lat},${center.lng});
        node["tourism"="attraction"](around:${radius},${center.lat},${center.lng});
        way["leisure"="stadium"](around:${radius},${center.lat},${center.lng});
      );
      out center 10;
    `;
  return fetchPOIs(query, 'lit'); // Reuse 'lit' type for now as 'urban' marker
};

/**
 * Fetches Quiet POIs (Libraries, Places of Worship, Gardens).
 */
export const getQuietPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  const query = `
      [out:json][timeout:25];
      (
        node["amenity"="library"](around:${radius},${center.lat},${center.lng});
        way["amenity"="place_of_worship"](around:${radius},${center.lat},${center.lng});
        relation["leisure"="garden"](around:${radius},${center.lat},${center.lng});
        way["landuse"="forest"](around:${radius},${center.lat},${center.lng});
      );
      out center 10;
    `;
  return fetchPOIs(query, 'park'); // Reuse 'park' type for quiet areas
};

/**
 * Fetches Points along Waterways (for Flat routes).
 */
export const getFlatPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  const query = `
      [out:json][timeout:25];
      (
        way["waterway"="river"](around:${radius},${center.lat},${center.lng});
        relation["waterway"="river"](around:${radius},${center.lat},${center.lng});
        way["natural"="water"](around:${radius},${center.lat},${center.lng});
      );
      out center 10;
    `;
  return fetchPOIs(query, 'water');
};

/**
 * Fetches "Few Lights" POIs (Cycleways, Paths, Living Streets).
 */
export const getFewLightsPOIs = async (center: Coordinates, radius: number = 2000): Promise<POI[]> => {
  const query = `
      [out:json][timeout:25];
      (
        way["highway"="cycleway"](around:${radius},${center.lat},${center.lng});
        way["highway"="path"](around:${radius},${center.lat},${center.lng});
        way["highway"="living_street"](around:${radius},${center.lat},${center.lng});
      );
      out center 10;
    `;
  return fetchPOIs(query, 'park'); // Reuse 'park' type for green/safe routes
};

const fetchPOIs = async (query: string, type: POI['type']): Promise<POI[]> => {
  try {
    const response = await fetch(OVERPASS_API_BASE, {
      method: 'POST',
      body: query,
    });

    if (!response.ok) {
      throw new Error(`Overpass API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.elements.map((el: any) => {
      // Elements can be nodes, ways, or relations.
      // 'center' is available if we use 'out center'
      const lat = el.lat || el.center?.lat;
      const lng = el.lon || el.center?.lon;
      return {
        lat,
        lng,
        type,
        name: el.tags?.name
      };
    }).filter((p: any) => p.lat && p.lng);

  } catch (error) {
    console.error('Failed to fetch POIs:', error);
    return [];
  }
};
