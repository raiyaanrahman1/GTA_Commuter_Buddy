import { useCallback, useEffect, useRef } from 'react';
import type { FeatureCollection, Geometry } from 'geojson';
import { isSameRoute } from '../utils/routeUtils';

interface FetchDeps {
  origin: [number, number] | null;
  destination: [number, number] | null;
  setRouteData: (data: FeatureCollection<Geometry> | null) => void;
  setRouteMetadata: (meta: string | null) => void;
  setMaxTollCost: (cost: number) => void;
  setBudget: (val: number) => void;
  startLoading: () => void;
  stopLoading: () => void;
  setLoadingMessage: (msg: string | null) => void;
}

export const useRouteFetch = ({
  origin,
  destination,
  setRouteData,
  setRouteMetadata,
  setMaxTollCost,
  setBudget,
  startLoading,
  stopLoading,
  setLoadingMessage
}: FetchDeps) => {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRequests = useRef(0);

  const clearFetchQueue = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const fetchDirections = useCallback(async (
    start: [number, number],
    end: [number, number],
    depTime: string,
    budVal: number
  ) => {
    try {
      console.log('Fetching directions from custom backend...');
      const responseBody = JSON.stringify({
        origin: [start[1], start[0]],
        destination: [end[1], end[0]],
        departure_dttm: new Date(depTime).toISOString(),
        budget: budVal * 100.0
      });
      console.log(responseBody);

      const startTime = performance.now();
      const response = await fetch('http://localhost:8000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: responseBody
      });
      
      interface ResponseType {
        data: FeatureCollection<Geometry>;
        metadata: string;
        toll_cost: number;
      }
      
      const {
        data,
        metadata,
        toll_cost
      }: ResponseType = await response.json();
      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;

      console.log(`Backend fetch took ${durationInSeconds.toFixed(3)} seconds.`);
      console.log('Route data:', data);
      const tollCostDollars = toll_cost / 100;
      const roundedTollCost = Math.ceil(tollCostDollars / 5) * 5.0;

      let filteredData = data;
      if (metadata === 'TollRoute') {
        filteredData = {
          ...data,
          features: data.features.filter(f => ['best', 'potential'].includes(f.properties?.route_type))
        };
      } else {
        setBudget(0);
      }

      const bestFeature = filteredData.features.find(f => f.properties?.route_type === 'best');
      const bestCoords = bestFeature?.geometry.type === 'LineString'
        ? (bestFeature.geometry.coordinates as [number, number][])
        : null;

      if (bestCoords) {
        filteredData = {
          ...filteredData,
          features: filteredData.features.filter(f => {
            const isBest = f.properties?.route_type === 'best';
            if (isBest) return true;

            if (f.geometry.type === 'LineString') {
              const coords = f.geometry.coordinates as [number, number][];
              const sameRoute = isSameRoute(coords, bestCoords);
              console.log(`sameRoute: ${sameRoute}`);
              return !sameRoute;
            }
            return true;
          })
        };
      }

      const enrichedFeatures = filteredData.features.map((f, idx) => ({
        ...f,
        properties: {
          ...f.properties,
          route_index: idx
        }
      }));

      setRouteData({ ...filteredData, features: enrichedFeatures });
      setRouteMetadata(metadata);
      setMaxTollCost(roundedTollCost);
      clearFetchQueue();
    } catch (error) {
      console.error('Backend fetch error:', error);
    }
  }, [clearFetchQueue, setBudget, setRouteData, setRouteMetadata, setMaxTollCost]);

  const queueFetchDirections = useCallback((
    start: [number, number],
    end: [number, number],
    depTime: string,
    budVal: number,
    delay: number,
    message: string | null = null
  ) => {
    clearFetchQueue();
    setLoadingMessage(message);
    startLoading();

    debounceTimeoutRef.current = setTimeout(async () => {
      pendingRequests.current += 1;
      await fetchDirections(start, end, depTime, budVal);
      pendingRequests.current -= 1;
      if (pendingRequests.current === 0) {
        stopLoading();
      }
    }, delay);
  }, [fetchDirections, startLoading, stopLoading, clearFetchQueue, setLoadingMessage]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    queueFetchDirections,
    clearFetchQueue
  };
};