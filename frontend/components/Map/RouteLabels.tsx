import React from 'react';
import { Marker } from 'react-map-gl/mapbox';
import type { FeatureCollection, Geometry } from 'geojson';
import type { LabelPosition } from './types';
import { formatDuration } from './utils/routeUtils';
import styles from './Map.module.css';

interface RouteLabelsProps {
  routeData: FeatureCollection<Geometry> | null;
  animatedRouteData: FeatureCollection<Geometry> | null;
  labelPositions: LabelPosition[];
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (idx: number | null) => void;
}

export const RouteLabels: React.FC<RouteLabelsProps> = ({
  routeData,
  animatedRouteData,
  labelPositions,
  selectedRouteIndex,
  setSelectedRouteIndex,
}) => {
  if (!routeData || !animatedRouteData) return null;

  return (
    <>
      {labelPositions.map((pos) => {
        const feature = routeData.features[pos.featureIndex];

        // Identify how many coordinates of this specific route line have drawn
        const animatedFeature = animatedRouteData.features[pos.featureIndex];
        const hasPassedMarker = (
          animatedFeature &&
          animatedFeature.geometry.type === 'LineString' &&
          animatedFeature.geometry.coordinates.length >= pos.targetIndex
        );

        // Only render when the route line reaches the marker location
        if (!hasPassedMarker) return null;

        const duration = feature.properties?.duration;
        const tollCost = feature.properties?.cost;
        const routeType = feature.properties?.route_type;
        const isBest = routeType === 'best';
        const isSelected = pos.featureIndex === selectedRouteIndex;

        if (duration === undefined) return null;

        const durationStr = formatDuration(duration);

        return (
          <Marker
            key={pos.featureIndex}
            longitude={pos.longitude}
            latitude={pos.latitude}
            anchor="center"
          >
            <div
              onClick={(e) => {
                e.stopPropagation(); // Stop click from propagating into map layer click
                setSelectedRouteIndex(pos.featureIndex);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full shadow-md border text-[10px] font-bold select-none cursor-pointer transition-all duration-200 
                ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700 scale-105 z-10'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                } ${styles.animatedMarker}`}
            >
              <span className={isSelected ? 'text-blue-700 font-extrabold' : ''}>
                {durationStr}
              </span>
              {tollCost !== undefined && tollCost > 0 ? (
                <>
                  <span className={isSelected ? 'text-blue-300' : 'text-gray-400'}>
                    •
                  </span>
                  <span
                    className={
                      isBest ? 'text-green-600 font-extrabold' : 'text-amber-500'
                    }
                  >
                    ${(tollCost / 100).toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <span className={isSelected ? 'text-blue-300' : 'text-gray-400'}>
                    •
                  </span>
                  <span className={isSelected ? 'text-blue-500' : 'text-gray-500'}>
                    No Tolls
                  </span>
                </>
              )}
            </div>
          </Marker>
        );
      })}
    </>
  );
};