import { useState, useMemo } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { FeatureCollection, Geometry } from 'geojson';
import type mapboxgl from 'mapbox-gl';
import { useMapLoading } from './useMapLoading';
import { useMapView } from './useMapView';
import { useRouteFetch } from './useRouteFetch';
import { useRouteOptionHandlers } from './useRouteOptionHandlers';
import { useRouteAnimation } from './useRouteAnimation';
import { useDepartureRefresh } from './useDepartureRefresh';
import { useRouteLayerStyles } from './useRouteLayerStyles';
import { useMapEventHandlers } from './useMapEventHandlers';
import { getSafeLabelPositions } from '../utils/routeUtils';
import { getCurrentDttm } from '../utils/routeUtils';
import type { RouteState, RouteActions } from '../types';

export const useMapState = (mapRef: React.RefObject<MapRef | null>) => {
  // 1. Core Map States (Single Source of Truth)
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | undefined>(undefined);
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routeData, setRouteData] = useState<FeatureCollection<Geometry> | null>(null);
  const [routeMetadata, setRouteMetadata] = useState<string | null>(null);
  const [maxTollCost, setMaxTollCost] = useState(200.0);
  const [budget, setBudget] = useState<number>(0);
  const [depTimeOption, setDepTimeOption] = useState('Leave Now');
  const [departureDttm, setDepartureDttm] = useState<string>(() => getCurrentDttm());
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 2. Delegate Loading Overlay State
  const {
    loadingVisible,
    loadingKey,
    loadingMessage,
    loadingExitDuration,
    setLoadingMessage,
    startLoading,
    stopLoading
  } = useMapLoading();

  // 3. Delegate Viewport, Geolocation, and Input Proximity State
  const {
    viewState,
    setViewState,
    fitMapBounds,
    flyToCoords,
    originInputProximity,
    destinationInputProximity
  } = useMapView(mapRef, origin, destination);

  // 4. Delegate directions API Fetching
  const {
    queueFetchDirections,
    clearFetchQueue
  } = useRouteFetch({
    setRouteData,
    setRouteMetadata,
    setMaxTollCost,
    setBudget,
    startLoading,
    stopLoading,
    setLoadingMessage,
    setFetchError
  });

  // 5. Delegate Options Form handlers
  const {
    handleOriginResult,
    handleDestinationResult,
    handleDepartureChange,
    handleBudgetChange
  } = useRouteOptionHandlers({
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
  });

  // 6. Delegate departure time auto-refresh timing
  useDepartureRefresh(depTimeOption, handleDepartureChange);

  // 7. Delegate route polyline drawing animations
  const animatedRouteData = useRouteAnimation(routeData);

  // 8. Delegate route selection line styling definitions
  const routeLayerStyles = useRouteLayerStyles(selectedRouteIndex);

  // 9. Delegate Map Event Handlers
  const { onMapLoad, onMapClick } = useMapEventHandlers({
    mapRef,
    setMapInstance,
    setSelectedRouteIndex
  });

  // Project and disperse route label positions
  const labelPositions = useMemo(() => {
    if (!routeData) return [];
    return getSafeLabelPositions(routeData.features);
  }, [routeData]);

  const routeState: RouteState = {
    origin,
    destination,
    routeData,
    routeMetadata,
    maxTollCost,
    budget,
    depTimeOption,
    departureDttm,
    selectedRouteIndex,
    loadingVisible,
    loadingKey,
    loadingMessage,
    loadingExitDuration,
    originInputProximity,
    destinationInputProximity,
    mapInstance,
    animatedRouteData,
    routeLayerStyles,
    labelPositions,
    fetchError
  };

  const routeActions: RouteActions = {
    setOrigin,
    setDestination,
    setDepTimeOption,
    setSelectedRouteIndex,
    handleOriginResult,
    handleDestinationResult,
    handleDepartureChange,
    handleBudgetChange,
    clearFetchQueue,
    onMapLoad,
    onMapClick
  };

  return {
    viewState,
    setViewState,
    routeState,
    routeActions
  };
};