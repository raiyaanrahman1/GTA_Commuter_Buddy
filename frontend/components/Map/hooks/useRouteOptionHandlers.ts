import { useCallback, useEffect } from 'react';
import type { FeatureCollection, Geometry } from 'geojson';

interface OptionsDeps {
  origin: [number, number] | null;
  setOrigin: (coords: [number, number] | null) => void;
  destination: [number, number] | null;
  setDestination: (coords: [number, number] | null) => void;
  budget: number;
  setBudget: (val: number) => void;
  departureDttm: string;
  setDepartureDttm: (dttm: string) => void;
  setSelectedRouteIndex: (idx: number | null) => void;
  routeData: FeatureCollection<Geometry> | null;
  fitMapBounds: (start: [number, number], end: [number, number]) => void;
  flyToCoords: (coords: [number, number]) => void;
  queueFetchDirections: (
    start: [number, number],
    end: [number, number],
    depTime: string,
    budVal: number,
    delay: number,
    message?: string | null
  ) => void;
}

export const useRouteOptionHandlers = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  budget,
  setBudget,
  departureDttm,
  setDepartureDttm,
  setSelectedRouteIndex,
  routeData,
  fitMapBounds,
  flyToCoords,
  queueFetchDirections
}: OptionsDeps) => {
  // Synchronize selection state to select the 'best' route by default when data loads
  useEffect(() => {
    if (routeData) {
      const bestIdx = routeData.features.findIndex(f => f.properties?.route_type === 'best');
      setSelectedRouteIndex(bestIdx !== -1 ? bestIdx : 0);
    } else {
      setSelectedRouteIndex(null);
    }
  }, [routeData, setSelectedRouteIndex]);

  const handleOriginResult = useCallback((coords: [number, number] | null) => {
    setOrigin(coords);
    if (coords && destination) {
      fitMapBounds(coords, destination);
      queueFetchDirections(coords, destination, departureDttm, budget, 0);
    } else if (coords) {
      flyToCoords(coords);
    }
  }, [destination, departureDttm, budget, fitMapBounds, flyToCoords, queueFetchDirections, setOrigin]);

  const handleDestinationResult = useCallback((coords: [number, number] | null) => {
    setDestination(coords);
    if (origin && coords) {
      fitMapBounds(origin, coords);
      queueFetchDirections(origin, coords, departureDttm, budget, 0);
    } else if (coords) {
      flyToCoords(coords);
    }
  }, [origin, departureDttm, budget, fitMapBounds, flyToCoords, queueFetchDirections, setDestination]);

  const handleDepartureChange = useCallback((newDttm: string, delay: number, message: string | null = null) => {
    setDepartureDttm(newDttm);
    if (origin && destination) {
      queueFetchDirections(origin, destination, newDttm, budget, delay, message);
    }
  }, [origin, destination, budget, queueFetchDirections, setDepartureDttm]);

  const handleBudgetChange = useCallback((newBudget: number) => {
    setBudget(newBudget);
    if (origin && destination) {
      queueFetchDirections(origin, destination, departureDttm, newBudget, 800);
    }
  }, [origin, destination, departureDttm, queueFetchDirections, setBudget]);

  return {
    handleOriginResult,
    handleDestinationResult,
    handleDepartureChange,
    handleBudgetChange
  };
};