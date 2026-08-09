import { useState, useCallback, useEffect, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';

export const useMapView = (
  mapRef: React.RefObject<MapRef | null>,
  origin: [number, number] | null,
  destination: [number, number] | null
) => {
  const [viewState, setViewState] = useState({
    longitude: -79.38,
    latitude: 43.65,
    zoom: 12
  });

  const getUserLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
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
    getUserLocation();
  }, [getUserLocation]);

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
  }, [mapRef]);

  const flyToCoords = useCallback((coords: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 14,
        duration: 1000
      });
    }
  }, [mapRef]);

  const originInputProximity = useMemo<[number, number]>(() => [
    destination?.[0] ?? viewState.longitude,
    destination?.[1] ?? viewState.latitude
  ], [destination, viewState.longitude, viewState.latitude]);

  const destinationInputProximity = useMemo<[number, number]>(() => [
    origin?.[0] ?? viewState.longitude,
    origin?.[1] ?? viewState.latitude
  ], [origin, viewState.longitude, viewState.latitude]);

  return {
    viewState,
    setViewState,
    fitMapBounds,
    flyToCoords,
    originInputProximity,
    destinationInputProximity
  };
};