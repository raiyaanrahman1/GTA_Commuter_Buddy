'use client';

import { SearchBox } from '@mapbox/search-js-react';
import type { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import mapboxgl from 'mapbox-gl';
import { useCallback } from 'react';

interface MapSearchInputProps {
  accessToken: string;
  mapInstance: mapboxgl.Map | undefined;
  proximity: [number, number];
  placeholder: string;
  // Using the library's internal type or a compatible Feature structure
  onResult: (coords: [number, number] | null) => void;
}

export default function MapSearchInput({ 
  accessToken, 
  mapInstance, 
  proximity, 
  placeholder,
  onResult 
}: MapSearchInputProps) {
  
  // Handle result selection
  const handleRetrieve = useCallback((res: SearchBoxRetrieveResponse) => {
    if (res?.features?.length > 0) {
      const coords = res.features[0].geometry.coordinates as [number, number];
      onResult(coords);
    }
  }, [onResult]);

  return (
    <SearchBox
      accessToken={accessToken}
      map={mapInstance}
      mapboxgl={mapboxgl}
      placeholder={placeholder}
      marker={false} // We handle markers manually for better control
      onRetrieve={handleRetrieve}
      options={{
        types: 'address,poi',
        proximity: proximity
      }}
    />
  );
}