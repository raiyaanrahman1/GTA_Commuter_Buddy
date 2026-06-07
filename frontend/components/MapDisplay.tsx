'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Map, { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import dynamic from 'next/dynamic';
import 'mapbox-gl/dist/mapbox-gl.css';

// ONLY the SearchBox is dynamically loaded
const MapSearchInput = dynamic(() => import('./MapSearchInput'), { 
  ssr: false,
  loading: () => <div className="h-10 w-full bg-white border rounded animate-pulse" />
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapDisplay() {
  const mapRef = useRef<MapRef>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | undefined>(undefined);
  
  // default: Toronto
  const [viewState, setViewState] = useState({
    longitude: -79.38,
    latitude: 43.65,
    zoom: 12
  });

  // 1. Precise Geolocation
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

  // 2. Safe Ref handling: Set state once map loads
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current.getMap());
    }
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* Search overlay */}
      <div className="absolute top-5 left-5 z-20 w-[350px]">
        <MapSearchInput 
          accessToken={MAPBOX_TOKEN} 
          mapInstance={mapInstance} 
          proximity={[viewState.longitude, viewState.latitude]}
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
      />
    </div>
  );
}