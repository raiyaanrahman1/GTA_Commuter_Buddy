'use client';

import { useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import RoutingOptionsCard from './RoutingOptionsCard';
import { useMapState } from './hooks/useMapState';
import { RouteLabels } from './RouteLabels';
import { LoadingOverlay, Loader, Text } from '@mantine/core';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapDisplay() {
  const mapRef = useRef<MapRef>(null);

  const { viewState, setViewState, routeState, routeActions } = useMapState(mapRef);

  return (
    <div className="relative w-full h-full">
      {/* Search overlay with two boxes */}
      <RoutingOptionsCard
        mapInstance={routeState.mapInstance}
        routeState={routeState}
        routeActions={routeActions}
      />

      <Map
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={routeActions.onMapLoad}
        onClick={routeActions.onMapClick}
        interactiveLayerIds={routeState.routeData ? ['route-line'] : undefined}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <LoadingOverlay
          key={routeState.loadingKey} // This forces remount/restart
          visible={routeState.loadingVisible}
          overlayProps={{ blur: 2 }}
          zIndex={0}
          transitionProps={{ transition: 'fade', duration: 200, exitDuration: routeState.loadingExitDuration }}
          loaderProps={{
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader size="md" color="blue" />
                {routeState.loadingMessage && (
                  <Text size="sm" fw={700} c="blue.6">
                    {routeState.loadingMessage}
                  </Text>
                )}
              </div>
            )
          }}
        />

        {/* Render the animated route lines */}
        {routeState.animatedRouteData && (
          <Source id="my-route" type="geojson" data={routeState.animatedRouteData}>
            <Layer {...routeState.routeLayerStyles} />
          </Source>
        )}

        {/* Wait until the drawing finishes, then fade the markers in */}
        <RouteLabels
          routeData={routeState.routeData}
          animatedRouteData={routeState.animatedRouteData}
          labelPositions={routeState.labelPositions}
          selectedRouteIndex={routeState.selectedRouteIndex}
          setSelectedRouteIndex={routeActions.setSelectedRouteIndex}
        />

        {routeState.origin && (
          <Marker longitude={routeState.origin[0]} latitude={routeState.origin[1]} color="#22c55e" />
        )}
        {routeState.destination && (
          <Marker longitude={routeState.destination[0]} latitude={routeState.destination[1]} color="#ef4444" />
        )}
      </Map>
    </div>
  );
}