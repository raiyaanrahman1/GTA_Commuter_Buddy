import type { FeatureCollection, Geometry } from 'geojson';
import type { LayerProps } from 'react-map-gl/mapbox';
import type mapboxgl from 'mapbox-gl';

export interface LabelPosition {
  longitude: number;
  latitude: number;
  featureIndex: number;
  targetIndex: number;
}

export interface CachedLocation {
  coords: [number, number];
  accuracy: number;
}

export interface RouteState {
  origin: [number, number] | null;
  destination: [number, number] | null;
  routeData: FeatureCollection<Geometry> | null;
  routeMetadata: string | null;
  maxTollCost: number;
  budget: number;
  depTimeOption: string;
  departureDttm: string;
  selectedRouteIndex: number | null;
  loadingVisible: boolean;
  loadingKey: number;
  loadingMessage: string | null;
  loadingExitDuration: number;
  originInputProximity: [number, number];
  destinationInputProximity: [number, number];
  
  mapInstance: mapboxgl.Map | undefined;
  animatedRouteData: FeatureCollection<Geometry> | null;
  routeLayerStyles: LayerProps;
  labelPositions: LabelPosition[];
  fetchError: string | null;
}

export interface RouteActions {
  setOrigin: (coords: [number, number] | null) => void;
  setDestination: (coords: [number, number] | null) => void;
  setDepTimeOption: (option: string) => void;
  setSelectedRouteIndex: (idx: number | null) => void;
  handleOriginResult: (coords: [number, number] | null) => void;
  handleDestinationResult: (coords: [number, number] | null) => void;
  handleDepartureChange: (newDttm: string, delay: number, message?: string | null) => void;
  handleBudgetChange: (newBudget: number) => void;
  clearFetchQueue: () => void;
  
  onMapLoad: () => void;
  onMapClick: (event: mapboxgl.MapMouseEvent) => void;
}