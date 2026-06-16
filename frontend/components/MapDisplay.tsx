'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayerProps } from 'react-map-gl/mapbox';
import Map, { MapRef, ViewStateChangeEvent, Marker, Source, Layer } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapSearchInput = dynamic(() => import('./MapSearchInput'), { 
  ssr: false,
  loading: () => <div className="h-10 w-full bg-white border rounded animate-pulse" />
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapDisplay() {
  const mapRef = useRef<MapRef>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | undefined>(undefined);
  
  const [viewState, setViewState] = useState({
    longitude: -79.38,
    latitude: 43.65,
    zoom: 12
  });

  // Directions State
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<GeoJSON.FeatureCollection<GeoJSON.Geometry> | null>(null);

  const fetchDirections = async (start: [number, number], end: [number, number]) => {
    console.log("Calling custom backend for directions:", { start, end });
    try {
      console.log('Fetching directions from custom backend...');
      const response = await fetch('http://localhost:8000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: [start[1], start[0]],
          destination: [end[1], end[0]],
          departure_dttm: new Date().toISOString(),
          budget: 0.0
        })
      });
      const data: GeoJSON.FeatureCollection = await response.json();
      // Handle your route data here (e.g., drawing a polyline)
      console.log('Route data:', data);
      const filteredData: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        ...data,
        features: data.features.filter((f, i) => {
          if (f.properties?.route_type === 'best') return true;
          return i < 3; 
        })
      }
      setRouteData(filteredData);
    } catch (error) {
      console.error('Backend fetch error:', error);
    }
  };

  const handleOriginResult = useCallback((coords: [number, number] | null) => {
    setOrigin(coords);
    if (coords && destination) {
      fetchDirections(coords, destination);
    }
  }, [destination]);

  const handleDestinationResult = useCallback((coords: [number, number] | null) => {
    setDestination(coords);
    if (origin && coords) {
      fetchDirections(origin, coords);
    }
  }, [origin]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (origin && destination && mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(origin);
      bounds.extend(destination);

      mapRef.current.fitBounds(bounds, {
        padding: 100, // Give some space around the markers
        duration: 1000 // Smooth animation
      });
    }
  }, [origin, destination]);

  // 2. Safe Ref handling: Set state once map loads
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current.getMap());
    }
  }, []);

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

  return (
    <div className="relative w-full h-screen">
      {/* Search overlay with two boxes */}
      <div className="absolute top-5 left-5 z-20 w-[350px] flex flex-col gap-2 p-3 bg-white/80 backdrop-blur rounded-lg shadow-lg">
        <h2 className="text-sm font-bold text-gray-700">Get Directions</h2>
        <MapSearchInput 
          accessToken={MAPBOX_TOKEN} 
          mapInstance={mapInstance} 
          proximity={[
            destination?.[0] ?? viewState.longitude, 
            destination?.[1] ?? viewState.latitude
          ]}
          placeholder="From: Origin..."
          onResult={handleOriginResult}
        />
        <MapSearchInput 
          accessToken={MAPBOX_TOKEN} 
          mapInstance={mapInstance} 
          proximity={[
            origin?.[0] ?? viewState.longitude, 
            origin?.[1] ?? viewState.latitude
          ]}
          placeholder="To: Destination..."
          onResult={handleDestinationResult}
        />
      </div>

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