'use client';

import dynamic from 'next/dynamic';
import type mapboxgl from 'mapbox-gl';

const MapSearchInput = dynamic(() => import('../MapSearchInput'), {
  ssr: false,
  loading: () => <div className="h-10 w-full bg-white border rounded animate-pulse" />
});

interface RouteSearchFieldsProps {
  accessToken: string;
  mapInstance: mapboxgl.Map | undefined;
  originProximity: [number, number];
  destinationProximity: [number, number];
  onOriginResult: (result: [number, number] | null) => void;
  onDestinationResult: (result: [number, number] | null) => void;
}

export const RouteSearchFields = ({
  accessToken,
  mapInstance,
  originProximity,
  destinationProximity,
  onOriginResult,
  onDestinationResult
}: RouteSearchFieldsProps) => {
  return (
    <>
      <MapSearchInput
        accessToken={accessToken}
        mapInstance={mapInstance}
        proximity={originProximity}
        placeholder="From: Origin..."
        onResult={onOriginResult}
      />
      <MapSearchInput
        accessToken={accessToken}
        mapInstance={mapInstance}
        proximity={destinationProximity}
        placeholder="To: Destination..."
        onResult={onDestinationResult}
      />
    </>
  );
};