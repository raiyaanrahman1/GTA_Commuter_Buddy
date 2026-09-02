'use client';

import { formatDuration } from '../utils/routeUtils';
import type { FeatureCollection, Geometry } from 'geojson';


interface RouteSelectorListProps {
  routeData: FeatureCollection<Geometry> | null;
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (idx: number) => void;
}

export const RouteSelectorList = ({
  routeData,
  selectedRouteIndex,
  setSelectedRouteIndex
}: RouteSelectorListProps) => {
  if (!routeData || !routeData.features || routeData.features.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-gray-200">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        Available Routes
      </span>
      {routeData.features.map((feature, idx) => {
        const properties = feature.properties;
        if (!properties) return null;

        const isBest = properties.route_type === 'best';
        const isSelected = idx === selectedRouteIndex;
        const tollCost = properties.cost;
        const distanceKm = properties.distance_meters 
          ? (properties.distance_meters / 1000).toFixed(1) 
          : null;

        // TODO: Determine label: "Recommended" for the best route, "Toll Route" if alternative has tolls, otherwise "Alternative Route"
        let routeLabel = 'Alternative Route';
        if (isBest) {
          routeLabel = 'Recommended';
        } else if (tollCost !== undefined && tollCost > 0) {
          routeLabel = 'Toll Route';
        }

        return (
          <div
            key={idx}
            onClick={() => setSelectedRouteIndex(idx)}
            className={`flex justify-between items-center p-2 rounded border text-xs cursor-pointer transition-all duration-150 
              ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100/50'
              }`}
          >
            <div className="flex flex-col">
              <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                {routeLabel}
              </span>
              {distanceKm && (
                <span className="text-gray-400 text-[10px]">{distanceKm} km</span>
              )}
            </div>
            <div className="text-right flex flex-col">
              <span className="font-bold text-gray-800">
                {formatDuration(properties.duration || 0)}
              </span>
              <span className={`text-[10px] font-bold ${
                tollCost && tollCost > 0 
                  ? (isBest ? 'text-green-600' : 'text-amber-500') 
                  : 'text-gray-400'
              }`}>
                {tollCost && tollCost > 0 ? `$${(tollCost / 100).toFixed(2)}` : 'No Tolls'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};