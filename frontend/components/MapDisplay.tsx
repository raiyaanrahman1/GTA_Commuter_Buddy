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
          features: data.features.filter((f, i) => {
            if (f.properties?.route_type === 'best') return true;
            return i < 3;
          })
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