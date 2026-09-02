'use client';

import type { RouteState, RouteActions } from './types';
import type mapboxgl from 'mapbox-gl';

import { RouteSearchFields } from './routing/RouteSearchFields';
import { DepartureTimeSelector } from './routing/DepartureTimeSelector';
import { BudgetControls } from './routing/BudgetControls';
import { RouteSelectorList } from './routing/RouteSelectorList';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface RoutingOptionsProps {
  mapInstance: mapboxgl.Map | undefined;
  routeState: RouteState;
  routeActions: RouteActions;
}

const RoutingOptionsCard = ({
  mapInstance,
  routeState,
  routeActions
}: RoutingOptionsProps) => {
  const {
    originInputProximity,
    destinationInputProximity,
    departureDttm,
    depTimeOption,
    budget,
    maxTollCost,
    routeMetadata,
    routeData,
    selectedRouteIndex,
    fetchError
  } = routeState;

  const {
    handleOriginResult,
    handleDestinationResult,
    handleDepartureChange,
    setDepTimeOption,
    handleBudgetChange,
    clearFetchQueue,
    setSelectedRouteIndex
  } = routeActions;

  return (
    <div className="absolute top-5 left-5 z-20 w-[350px] flex flex-col gap-2 p-3 bg-white/80 backdrop-blur rounded-lg shadow-lg">
      <h2 className="text-sm font-bold text-gray-700">Get Directions</h2>
      
      {/* Search Input Fields */}
      <RouteSearchFields
        accessToken={MAPBOX_TOKEN}
        mapInstance={mapInstance}
        originProximity={originInputProximity}
        destinationProximity={destinationInputProximity}
        onOriginResult={handleOriginResult}
        onDestinationResult={handleDestinationResult}
      />

      {/* Departure Time Config */}
      <DepartureTimeSelector
        depTimeOption={depTimeOption}
        departureDttm={departureDttm}
        setDepTimeOption={setDepTimeOption}
        handleDepartureChange={handleDepartureChange}
      />

      {/* Budget Sliders & Controls */}
      <BudgetControls
        budget={budget}
        maxTollCost={maxTollCost}
        routeMetadata={routeMetadata}
        fetchError={fetchError}
        clearFetchQueue={clearFetchQueue}
        handleBudgetChange={handleBudgetChange}
      />

      {/* Available Alternatives List */}
      <RouteSelectorList
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        setSelectedRouteIndex={setSelectedRouteIndex}
      />
    </div>
  );
};

export default RoutingOptionsCard;