'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { MapRef, ViewStateChangeEvent, Marker } from 'react-map-gl/mapbox';
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
      const data = await response.json();
      // Handle your route data here (e.g., drawing a polyline)
      console.log('Route data:', data);
    } catch (error) {
      console.error('Backend fetch error:', error);
    }
  };

  // Trigger backend directions when both points exist
  useEffect(() => {
    if (origin && destination) {
      fetchDirections(origin, destination);
    }
  }, [origin, destination]);

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
          onResult={(coords) => setOrigin(coords)}
        />
        <MapSearchInput 
          accessToken={MAPBOX_TOKEN} 
          mapInstance={mapInstance} 
          proximity={[
            origin?.[0] ?? viewState.longitude, 
            origin?.[1] ?? viewState.latitude
          ]}
          placeholder="To: Destination..."
          onResult={(coords) => setDestination(coords)}
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
        {/* Custom Markers for Directions */}
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