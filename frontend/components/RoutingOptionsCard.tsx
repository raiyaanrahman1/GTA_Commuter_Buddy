'use client';
import dynamic from 'next/dynamic';
import { Slider, NumberInput } from '@mantine/core';
import { useEffect, useState } from 'react';

const MapSearchInput = dynamic(() => import('./MapSearchInput'), {
  ssr: false,
  loading: () => <div className="h-10 w-full bg-white border rounded animate-pulse" />
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface RoutingOptionsProps {
  mapInstance: mapboxgl.Map | undefined;
  originInputProximity: [number, number],
  destinationInputProximity: [number, number]
  handleOriginResult: (coords: [number, number] | null) => void;
  handleDestinationResult: (coords: [number, number] | null) => void;
  departureDttm: string;
  handleDepartureChange: (val: string) => void;
  budget: number;
  maxTollCost: number;
  handleBudgetChange: (val: number) => void;
  clearFetchQueue: () => void;
  routeMetadata: string | null;
}

const RoutingOptionsCard = ({
  mapInstance,
  originInputProximity,
  destinationInputProximity,
  handleOriginResult,
  handleDestinationResult,
  departureDttm,
  handleDepartureChange,
  budget,
  maxTollCost,
  handleBudgetChange,
  clearFetchQueue,
  routeMetadata
}: RoutingOptionsProps) => {
  const [tempBudget, setTempBudget] = useState(budget);
  const sliderKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempBudget(budget);
  }, [budget]);

  const budgetAbsoluteMax = 200;
  const safeMax = maxTollCost > 0 ? maxTollCost : budgetAbsoluteMax;
  const stepSize = 5;
  const marks = [
    {
      value: 0,
      label: '$0'
    }
  ];
  for (let i = 0; i < 4; i++) {
    const val = safeMax * (i + 1) * 0.25;
    if (val % stepSize === 0) marks.push({
      value: val,
      label: `$${val}`
    })
  }

  return (
    <div className="absolute top-5 left-5 z-20 w-[350px] flex flex-col gap-2 p-3 bg-white/80 backdrop-blur rounded-lg shadow-lg">
      <h2 className="text-sm font-bold text-gray-700">Get Directions</h2>
      <MapSearchInput
        accessToken={MAPBOX_TOKEN}
        mapInstance={mapInstance}
        proximity={originInputProximity}
        placeholder="From: Origin..."
        onResult={handleOriginResult}
      />
      <MapSearchInput
        accessToken={MAPBOX_TOKEN}
        mapInstance={mapInstance}
        proximity={destinationInputProximity}
        placeholder="To: Destination..."
        onResult={handleDestinationResult}
      />

      {/* Departure Time Field */}
      <div className="flex flex-col gap-1 mt-1">
        <label className="text-xs font-semibold text-gray-500">Departure Time</label>
        <input
          type="datetime-local"
          value={departureDttm}
          onChange={(e) => handleDepartureChange(e.target.value)}
          className="w-full text-xs p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
        />
      </div>


      {/* Budget Controls */}
      <div className="flex flex-col gap-1 mt-1">

        {/* Budget Controls Heading and Indicator */}
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-500">Max Budget</label>
          <span className="text-xs font-bold text-blue-600">${tempBudget}</span>
        </div>

        {/* Budget Inputs */}
        <div className="flex flex-row gap-5 items-center">

          {/* Budget Slider */}
          <div className="grow">
            <Slider
              min={0}
              max={safeMax}
              step={stepSize}
              value={tempBudget}
              onChange={setTempBudget}
              disabled={routeMetadata === 'NonTollRoute'}
              color="blue"
              label={(val) => `$${val}`}
              marks={marks}

              // Keyboard/Mouse interaction logic
              onMouseDown={() => clearFetchQueue()}
              onTouchStart={() => clearFetchQueue()}
              onKeyDown={(e) => {
                if (sliderKeys.includes(e.key)) clearFetchQueue();
              }}
              onMouseUp={() => {
                if (tempBudget !== budget) handleBudgetChange(tempBudget);
              }}
              onTouchEnd={() => {
                if (tempBudget !== budget) handleBudgetChange(tempBudget);
              }}
              onKeyUp={(e) => {
                if (sliderKeys.includes(e.key) && tempBudget !== budget) {
                  handleBudgetChange(tempBudget);
                }
              }}
            />

          </div>

          {/* Budget text input */}
          <NumberInput
            min={0}
            max={safeMax}
            step={stepSize}
            value={tempBudget}
            onChange={(val) => {
              const numericVal = typeof val === 'number' ? val : Number(val);
              const clampedVal = Math.max(0, Math.min(budgetAbsoluteMax, numericVal || 0));
              setTempBudget(clampedVal);
              handleBudgetChange(clampedVal);
            }}
            disabled={routeMetadata === 'NonTollRoute'}
            size="xs"
            radius="md"
            className="w-16"
            styles={{
              input: {
                textAlign: 'center',
              },
            }}
          />
        </div>

        {/* Budget Errors */}
        {routeMetadata === 'NonTollRoute' && (
          <p className="text-xs font-medium text-red-700 mt-5">
            This route does not use the 407 ETR, budget not available
          </p>
        )}
      </div>
    </div>
  )
}

export default RoutingOptionsCard