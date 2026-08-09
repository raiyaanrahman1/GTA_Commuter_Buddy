import { useMemo } from 'react';
import type { LayerProps } from 'react-map-gl/mapbox';

export const useRouteLayerStyles = (selectedRouteIndex: number | null): LayerProps => {
  return useMemo<LayerProps>(() => ({
    id: 'route-line',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      'line-sort-key': [
        'case',
        ['==', ['get', 'route_index'], selectedRouteIndex],
        2, // Render selected route on top
        1  // Render others underneath
      ]
    },
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'route_index'], selectedRouteIndex],
        '#2563eb', // Selected: Vibrant Blue
        '#94a3b8'  // Unselected: Muted Slate Gray
      ],
      'line-width': [
        'case',
        ['==', ['get', 'route_index'], selectedRouteIndex],
        8, // Selected: Thicker
        5  // Unselected: Thinner
      ],
      'line-opacity': [
        'case',
        ['==', ['get', 'route_index'], selectedRouteIndex],
        1.0,
        0.8
      ]
    }
  }), [selectedRouteIndex]);
};