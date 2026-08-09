import { useCallback } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type mapboxgl from 'mapbox-gl';

interface MapEventHandlersDeps {
  mapRef: React.RefObject<MapRef | null>;
  setMapInstance: (map: mapboxgl.Map | undefined) => void;
  setSelectedRouteIndex: (idx: number | null) => void;
}

export const useMapEventHandlers = ({
  mapRef,
  setMapInstance,
  setSelectedRouteIndex,
}: MapEventHandlersDeps) => {
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current.getMap());
    }
  }, [mapRef, setMapInstance]);

  const onMapClick = useCallback((event: mapboxgl.MapMouseEvent) => {
    const clickedFeature = event.features?.[0];
    if (clickedFeature && clickedFeature.properties) {
      const clickedIndex = clickedFeature.properties.route_index;
      if (clickedIndex !== undefined) {
        setSelectedRouteIndex(Number(clickedIndex));
      }
    }
  }, [setSelectedRouteIndex]);

  return {
    onMapLoad,
    onMapClick,
  };
};