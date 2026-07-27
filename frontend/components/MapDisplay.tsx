'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayerProps } from 'react-map-gl/mapbox';
import Map, { MapRef, ViewStateChangeEvent, Marker, Source, Layer } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import RoutingOptionsCard from './RoutingOptionsCard';
import { useIdle } from '@mantine/hooks';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const routeLayer: LayerProps = {
  id: 'route-line',
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round'
  },
  paint: {
    'line-color': [
      'match',
      ['get', 'route_type'],
      'best', '#2563eb',      // Deep vibrant blue
      'potential', '#94a3b8', // Muted slate gray
      '#cccccc'
    ],
    'line-width': [
      'match',
      ['get', 'route_type'],
      'best', 8,              // Much thicker
      'potential', 5,         // Thinner
      2
    ],
    'line-opacity': [
      'match',
      ['get', 'route_type'],
      'best', 1,              // Fully opaque
      'potential', 0.8,       // Semi-transparent to push it into background
      0.5
    ]
  }
};

const LeaveNowRefreshInterval = 5 * 1000 * 60 // 5 minutes

export default function MapDisplay() {
  const mapRef = useRef<MapRef>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | undefined>(undefined);
  const [routeMetadata, setRouteMetadata] = useState<string | null>(null);
  const [maxTollCost, setMaxTollCost] = useState(200.0);
  const isIdle = useIdle(LeaveNowRefreshInterval, { initialState: false });

  const [viewState, setViewState] = useState({
    longitude: -79.38,
    latitude: 43.65,
    zoom: 12
  });

  // Directions State
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<GeoJSON.FeatureCollection<GeoJSON.Geometry> | null>(null);

  // Departure and Budget State
  const getCurrentDttm = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    // Formats into local YYYY-MM-DDTHH:MM format required by input[type="datetime-local"]
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }
  const [depTimeOption, setDepTimeOption] = useState('Leave Now');
  const [departureDttm, setDepartureDttm] = useState<string>(() => getCurrentDttm());
  const [budget, setBudget] = useState<number>(0);

  const clearFetchQueue = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }

  const fetchDirections = useCallback(async (
    start: [number, number],
    end: [number, number],
    depTime: string,
    budVal: number
  ) => {
    // console.log("Calling custom backend for directions:", { start, end });
    try {
      console.log('Fetching directions from custom backend...');
      const responseBody = JSON.stringify({
        origin: [start[1], start[0]],
        destination: [end[1], end[0]],
        departure_dttm: new Date(depTime).toISOString(),
        budget: budVal * 100.0
      });
      console.log(responseBody);

      const startTime = performance.now();
      const response = await fetch('http://localhost:8000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: responseBody
      });
      interface responseType {
        data: GeoJSON.FeatureCollection,
        metadata: string,
        toll_cost: number
      }
      const {
        data,
        metadata,
        toll_cost
      }: responseType = await response.json()
      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;

      console.log(`Backend fetch took ${durationInSeconds.toFixed(3)} seconds.`);
      console.log('Route data:', data);
      const tollCostDollars = toll_cost / 100;
      const roundedTollCost = Math.ceil(tollCostDollars / 5) * 5.0

      let filteredData = data;
      if (metadata === 'TollRoute') {
        filteredData = {
          ...data,
          features: data.features.filter(f => ['best', 'potential'].includes(f.properties?.route_type))
        }
      } else {
        setBudget(0);
      }
      setRouteData(filteredData);
      setRouteMetadata(metadata);
      setMaxTollCost(roundedTollCost);
      clearFetchQueue();
    } catch (error) {
      console.error('Backend fetch error:', error);
    }
  }, []);


  const queueFetchDirections = useCallback((
    start: [number, number],
    end: [number, number],
    depTime: string,
    budVal: number,
    delay: number
  ) => {
    clearFetchQueue()

    debounceTimeoutRef.current = setTimeout(() => {
      fetchDirections(start, end, depTime, budVal);
    }, delay);
  }, [fetchDirections]);

  const fitMapBounds = useCallback((start: [number, number], end: [number, number]) => {
    if (mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(start);
      bounds.extend(end);

      mapRef.current.fitBounds(bounds, {
        padding: 100, // Give some space around the markers
        duration: 1000 // Smooth animation
      });
    }
  }, []);

  const flyToCoords = useCallback((coords: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 14,
        duration: 1000
      });
    }
  }, []);

  const handleOriginResult = useCallback((coords: [number, number] | null) => {
    setOrigin(coords);
    if (coords && destination) {
      fitMapBounds(coords, destination);
      queueFetchDirections(coords, destination, departureDttm, budget, 0);
    } else if (coords) {
      flyToCoords(coords)
    }
  }, [destination, departureDttm, budget, fitMapBounds, flyToCoords, queueFetchDirections]);

  const handleDestinationResult = useCallback((coords: [number, number] | null) => {
    setDestination(coords);
    if (origin && coords) {
      fitMapBounds(origin, coords)
      queueFetchDirections(origin, coords, departureDttm, budget, 0);
    } else if (coords) {
      flyToCoords(coords)
    }
  }, [origin, departureDttm, budget, fitMapBounds, flyToCoords, queueFetchDirections]);

  const handleDepartureChange = useCallback((newDttm: string) => {
    setDepartureDttm(newDttm);
    // console.log(`handleDepartureChange: ${newDttm}`)
    if (origin && destination) {
      queueFetchDirections(origin, destination, newDttm, budget, 800);
    }
  }, [origin, destination, budget, queueFetchDirections]);

  const handleBudgetChange = useCallback((newBudget: number) => {
    setBudget(newBudget);
    if (origin && destination) {
      queueFetchDirections(origin, destination, departureDttm, newBudget, 800);
    }
  }, [origin, destination, departureDttm, queueFetchDirections]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;

          // Update map position
          setViewState((prev) => ({
            ...prev,
            longitude,
            latitude,
            zoom: 14 // Zoom in closer to their location
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }

  useEffect(() => {
    // on mount
    getUserLocation();

    // on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // console.log(isIdle);
    if (depTimeOption !== 'Leave Now' || isIdle) return;

    // console.log('resetting date refresh timer');
    const curDttm = getCurrentDttm();
    // console.log(`currentDttm=${curDttm}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleDepartureChange(curDttm);

    const intervalId = setInterval(() => {
      // console.log('resetting date refresh timer');
      const curDttm = getCurrentDttm();
      // console.log(`currentDttm=${curDttm}`);
      handleDepartureChange(curDttm);

    }, LeaveNowRefreshInterval);

    // Cleanup clears the timer on unmount, when options change, or when the user goes idle
    return () => {
      // console.log(`clearing date refresh timer ${intervalId}`)
      clearInterval(intervalId);
    }
  }, [depTimeOption, isIdle, handleDepartureChange]);

  // 2. Safe Ref handling: Set state once map loads
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current.getMap());
    }
  }, []);

  const originInputProximity: [number, number] = [
    destination?.[0] ?? viewState.longitude,
    destination?.[1] ?? viewState.latitude
  ]

  const destinationInputProximity: [number, number] = [
    origin?.[0] ?? viewState.longitude,
    origin?.[1] ?? viewState.latitude
  ]

  // ----------------- Duration/Cost Indicator Helpers ----------------- 
  // Helper to format duration to "hours + minutes" if 60 minutes or above
  const formatDuration = (seconds: number): string => {
    const totalMins = Math.round(seconds / 60);
    if (totalMins < 60) {
      return `${totalMins} min`;
    }
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  };

  // Check if two coordinate arrays are identical
  const isSameRoute = (coords1: [number, number][], coords2: [number, number][]): boolean => {
    if (coords1.length !== coords2.length) return false;
    const epsilon = 1e-6;
    return coords1.every((c1, i) => {
      const c2 = coords2[i];
      return Math.abs(c1[0] - c2[0]) < epsilon && Math.abs(c1[1] - c2[1]) < epsilon;
    });
  };

  // Identifies and extracts the midpoint of the longest section of routeCoords
  // that does not overlap with ANY of the coordinate paths in allOtherCoords
  const getLongestUniqueSegmentMidpointAll = (
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

  interface LabelPosition {
    longitude: number;
    latitude: number;
    featureIndex: number;
  }

  // Spatially disperses marker coordinates to prevent overlap on shared highways
  const getSafeLabelPositions = (features: GeoJSON.Feature[]): LabelPosition[] => {
    const positions: LabelPosition[] = [];
    const minDistance = 0.005; // Degrees threshold (~500m) to prevent visual overlap between final markers

    // Use a TypeScript Type Guard to narrow the type to Feature<LineString> and eliminate geometry warnings
    const validRoutes = features.filter(
      (f): f is GeoJSON.Feature<GeoJSON.LineString> => f.geometry.type === 'LineString'
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
      // Feature.geometry is now strictly typed as GeoJSON.LineString
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

      if (isBest) {
        // Best route indicator is always placed at its overall physical midpoint
        const midIndex = Math.floor(coords.length * 0.5);
        [lng, lat] = coords[midIndex];
      } else {
        // Other (potential) route indicators are placed at the midpoint of their largest unique section
        [lng, lat] = getLongestUniqueSegmentMidpointAll(coords, allOtherCoords);
      }

      // 3. Keep visual collision check to resolve micro-overlaps with placed markers
      let attempts = 0;
      const step = Math.max(1, Math.floor(coords.length * 0.05));
      const targetIndex = coords.findIndex(c => c[0] === lng && c[1] === lat);
      const safeTargetIdx = targetIndex !== -1 ? targetIndex : Math.floor(coords.length * 0.5);

      while (attempts < 10) {
        const collision = positions.some(p => {
          const dLng = p.longitude - lng;
          const dLat = p.latitude - lat;
          return Math.sqrt(dLng * dLng + dLat * dLat) < minDistance;
        });

        if (!collision) break;

        const direction = attempts % 2 === 0 ? 1 : -1;
        const offset = direction * step * (Math.floor(attempts / 2) + 1);
        const newIndex = Math.min(coords.length - 1, Math.max(0, safeTargetIdx + offset));
        [lng, lat] = coords[newIndex];
        attempts++;
      }

      positions.push({ longitude: lng, latitude: lat, featureIndex: originalIndex });
    });

    return positions;
  };

  return (
    <div className="relative w-full h-full">
      {/* Search overlay with two boxes */}
      <RoutingOptionsCard
        mapInstance={mapInstance}
        originInputProximity={originInputProximity}
        destinationInputProximity={destinationInputProximity}
        handleOriginResult={handleOriginResult}
        handleDestinationResult={handleDestinationResult}
        departureDttm={departureDttm}
        handleDepartureChange={handleDepartureChange}
        depTimeOption={depTimeOption}
        setDepTimeOption={setDepTimeOption}
        budget={budget}
        maxTollCost={maxTollCost}
        handleBudgetChange={handleBudgetChange}
        clearFetchQueue={clearFetchQueue}
        routeMetadata={routeMetadata}
      />

      <Map
        {...viewState}
        ref={mapRef}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onLoad={onMapLoad}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {routeData && (
          <Source id="my-route" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {routeData && getSafeLabelPositions(routeData.features).map((pos) => {
          const feature = routeData.features[pos.featureIndex];
          const duration = feature.properties?.duration; // <-- Updated
          const tollCost = feature.properties?.cost; // <-- Updated
          const routeType = feature.properties?.route_type;

          if (duration === undefined) return null;

          const durationStr = formatDuration(duration);
          const isBest = routeType === 'best';

          return (
            <Marker key={pos.featureIndex} longitude={pos.longitude} latitude={pos.latitude} anchor="center">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md border text-[10px] font-bold select-none whitespace-nowrap 
                  ${
                  // ''
                  'bg-white text-gray-700 border-gray-300'
                  }
                  ${
                  ''
                  // isBest
                  //   ? 'bg-blue-400 text-white border-blue-400'
                  //   : 'bg-white text-gray-700 border-gray-300'
                  
                  }
                  `
                }
              >
                <span className={isBest ? 'text-blue-600' : ''}>{durationStr}</span>
                {tollCost !== undefined && tollCost > 0 ? (
                  <>
                    <span className={isBest ? 'text-gray-400' : 'text-gray-400'}>•</span>
                    <span className={isBest ? 'text-green-600' : 'text-amber-500'}>
                      ${(tollCost / 100).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={isBest ? 'text-gray-400' : 'text-gray-400'}>•</span>
                    <span className={isBest ? 'text-gray-500' : 'text-gray-500'}>Free</span>
                  </>
                )}
              </div>
            </Marker>
          );
        })}

        {origin && (
          <Marker longitude={origin[0]} latitude={origin[1]} color="#22c55e" /> // Green for Start
        )}
        {destination && (
          <Marker longitude={destination[0]} latitude={destination[1]} color="#ef4444" /> // Red for End
        )}
      </Map>
    </div>
  );
}