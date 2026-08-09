import type { Feature, LineString } from 'geojson';
import type { LabelPosition } from '../types';

// Helper to format duration to "hours + minutes" if 60 minutes or above
export const formatDuration = (seconds: number): string => {
  const totalMins = Math.round(seconds / 60);
  if (totalMins < 60) {
    return `${totalMins} min`;
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
};

// Check if two coordinate arrays are identical
export const isSameRoute = (coords1: [number, number][], coords2: [number, number][]): boolean => {
  if (coords1.length !== coords2.length) return false;
  const epsilon = 1e-6;
  return coords1.every((c1, i) => {
    const c2 = coords2[i];
    return Math.abs(c1[0] - c2[0]) < epsilon && Math.abs(c1[1] - c2[1]) < epsilon;
  });
};

// Identifies and extracts the midpoint of the longest section of routeCoords
// that does not overlap with ANY of the coordinate paths in allOtherCoords
export const getLongestUniqueSegmentMidpointAll = (
  routeCoords: [number, number][],
  allOtherCoords: [number, number][][]
): [number, number] => {
  const threshold = 0.0015; // Threshold in degrees (~150 meters)

  const segments: [number, number][][] = [];
  let currentSegment: [number, number][] = [];

  for (const coord of routeCoords) {
    let isOverlapping = false;

    // Check if this point overlaps with any point in any other route
    for (const otherCoords of allOtherCoords) {
      const overlap = otherCoords.some(
        (otherCoord) => {
          const dLng = coord[0] - otherCoord[0];
          const dLat = coord[1] - otherCoord[1];
          return dLng * dLng + dLat * dLat < threshold * threshold;
        }
      );
      if (overlap) {
        isOverlapping = true;
        break;
      }
    }

    if (!isOverlapping) {
      currentSegment.push(coord);
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Fallback if no unique segment is identified (e.g. routes are identical or entirely overlapping)
  if (segments.length === 0) {
    const midIndex = Math.floor(routeCoords.length / 2);
    return routeCoords[midIndex];
  }

  // Pick the longest unique contiguous segment
  let longestSegment = segments[0];
  for (const seg of segments) {
    if (seg.length > longestSegment.length) {
      longestSegment = seg;
    }
  }

  const midIndex = Math.floor(longestSegment.length / 2);
  return longestSegment[midIndex];
};

// Spatially disperses marker coordinates to prevent overlap on shared highways
export const getSafeLabelPositions = (features: Feature[]): LabelPosition[] => {
  const positions: LabelPosition[] = [];
  const minDistance = 0.005; // Degrees threshold (~500m) to prevent visual overlap between final markers

  // Use a TypeScript Type Guard to narrow the type to Feature<LineString> and eliminate geometry warnings
  const validRoutes = features.filter(
    (f): f is Feature<LineString> => f.geometry.type === 'LineString'
  );
  if (validRoutes.length === 0) return [];

  // Sort so the 'best' route is processed first, securing its label presence, 
  // and subsequent identical routes can be safely ignored.
  const sortedRoutes = [...validRoutes].sort((a, b) => {
    const aBest = a.properties?.route_type === 'best' ? 1 : 0;
    const bBest = b.properties?.route_type === 'best' ? 1 : 0;
    return bBest - aBest;
  });

  const acceptedRouteCoords: [number, number][][] = [];

  sortedRoutes.forEach((feature) => {
    const coords = feature.geometry.coordinates as [number, number][];
    if (coords.length === 0) return;

    // 1. Omit indicator if this route's geometry matches an already accepted route
    const isDuplicate = acceptedRouteCoords.some(accepted => isSameRoute(coords, accepted));
    if (isDuplicate) {
      return;
    }

    acceptedRouteCoords.push(coords);

    // Save index pointing to original features list
    const originalIndex = features.indexOf(feature);

    // Filter out the current route to isolate all other routes' coordinates
    const allOtherCoords = validRoutes
      .filter(f => f !== feature)
      .map(f => f.geometry.coordinates as [number, number][]);

    // 2. Position this route indicator
    let [lng, lat]: [number, number] = [0, 0];
    const isBest = feature.properties?.route_type === 'best';

    let baseTargetIdx = 0;
    if (isBest) {
      baseTargetIdx = Math.floor(coords.length * 0.5);
    } else {
      const midpoint = getLongestUniqueSegmentMidpointAll(coords, allOtherCoords);
      baseTargetIdx = coords.findIndex(c => c[0] === midpoint[0] && c[1] === midpoint[1]);
      console.log(baseTargetIdx);
      if (baseTargetIdx === -1) {
        baseTargetIdx = Math.floor(coords.length * 0.5);
      }
    }

    const lngLat = coords[baseTargetIdx];
    lng = lngLat[0];
    lat = lngLat[1];

    // 3. Keep visual collision check to resolve micro-overlaps with placed markers
    let attempts = 0;
    const step = Math.max(1, Math.floor(coords.length * 0.05));
    let finalIndex = baseTargetIdx;

    while (attempts < 10) {
      const collision = positions.some(p => {
        const dLng = p.longitude - lng;
        const dLat = p.latitude - lat;
        return Math.sqrt(dLng * dLng + dLat * dLat) < minDistance;
      });

      if (!collision) break;

      const direction = attempts % 2 === 0 ? 1 : -1;
      const offset = direction * step * (Math.floor(attempts / 2) + 1);
      finalIndex = Math.min(coords.length - 1, Math.max(0, baseTargetIdx + offset));
      const nextLngLat = coords[finalIndex];
      lng = nextLngLat[0];
      lat = nextLngLat[1];
      attempts++;
    }

    positions.push({
      longitude: lng,
      latitude: lat,
      featureIndex: originalIndex,
      targetIndex: finalIndex
    });
  });

  return positions;
};

// Flat-surface approximation helper to find local distance in meters
export const getDistanceInMeters = (coord1: [number, number], coord2: [number, number]): number => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const earthRadius = 6371000;
  
  const latMidRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const dLatRad = (lat2 - lat1) * (Math.PI / 180);
  const dLngRad = (lng2 - lng1) * (Math.PI / 180);
  
  const x = dLngRad * Math.cos(latMidRad);
  const y = dLatRad;
  
  return Math.sqrt(x * x + y * y) * earthRadius;
};

export const getCurrentDttm = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  // Formats into local YYYY-MM-DDTHH:MM format required by input[type="datetime-local"]
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};