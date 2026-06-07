'use client';

import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';

interface MapSearchInputProps {
  accessToken: string;
  mapInstance: mapboxgl.Map | undefined;
  proximity: [number, number];
}

export default function MapSearchInput({ accessToken, mapInstance, proximity }: MapSearchInputProps) {
  return (
    <SearchBox
      accessToken={accessToken}
      map={mapInstance}
      mapboxgl={mapboxgl}
      placeholder="Search for local POIs..."
      marker={true}
      options={{
        types: 'poi,address',
        proximity: proximity
      }}
    />
  );
}