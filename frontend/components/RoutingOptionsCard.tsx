'use client';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { Slider, NumberInput, Select } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useEffect, useState, useRef } from 'react';
import { formatDuration } from './MapDisplay';

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
  handleDepartureChange: (val: string, delay: number) => void;
  depTimeOption: string;
  setDepTimeOption: (val: string) => void;
  budget: number;
  maxTollCost: number;
  handleBudgetChange: (val: number) => void;
  clearFetchQueue: () => void;
  routeMetadata: string | null;
  routeData: GeoJSON.FeatureCollection | null;
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (val: number | null) => void;
}

const RoutingOptionsCard = ({
  mapInstance,
  originInputProximity,
  destinationInputProximity,
  handleOriginResult,
  handleDestinationResult,
  departureDttm,
  handleDepartureChange,
  depTimeOption,
  setDepTimeOption,
  budget,
  maxTollCost,
  handleBudgetChange,
  clearFetchQueue,
  routeMetadata,
  routeData,
  selectedRouteIndex,
  setSelectedRouteIndex
}: RoutingOptionsProps) => {
  const [tempBudget, setTempBudget] = useState(budget);
  const isDraggingRef = useRef(false);
  const sliderKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempBudget(Math.min(budget, maxTollCost));
  }, [budget, maxTollCost]);

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
      <div className="flex flex-col gap-2 mt-1">
        <label className="text-xs font-semibold text-gray-500">Departure Time</label>
        <Select
          data={['Leave Now', 'Depart At']}
          value={depTimeOption}
          onChange={newValue => {
            if (newValue !== null) setDepTimeOption(newValue);
          }}
        />
        {
          depTimeOption === 'Depart At' && (
            <DateTimePicker
              value={departureDttm}
              valueFormat="MMMM DD, YYYY hh:mm A"
              onChange={newDate => {
                if (newDate !== null) handleDepartureChange(newDate, 800);
              }}
              timePickerProps={{
                format: '12h',
                minutesStep: 5,
                withDropdown: true 
              }}
              presets={[
                { value: dayjs().format('YYYY-MM-DD HH:mm:ss'), label: 'Today' },
                { value: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), label: 'Tomorrow' },
                { value: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'), label: 'Next Week' },
                { value: dayjs().add(1, 'month').format('YYYY-MM-DD HH:mm:ss'), label: 'Next month' },
              ]}
              // className="w-full text-xs p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
            />
          )
        }

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
              /*
                The slider uses this logic because after the knob has moved,
                the user can keep it held down. If we used onChange it would send the request while
                the mouse is still held down. This way, the request is only sent after the mouse has come up,
                and the user has finalized their selection (debouncing also included)
              */
              onMouseDown={() => {
                clearFetchQueue();
                isDraggingRef.current = true;
              }}
              onTouchStart={() => {
                clearFetchQueue();
                isDraggingRef.current = true;
              }}
              onKeyDown={(e) => {
                if (sliderKeys.includes(e.key)) clearFetchQueue();
              }}
              onKeyUp={(e) => {
                // Trigger only when they release the arrow key
                if (sliderKeys.includes(e.key) && tempBudget !== budget) {
                  handleBudgetChange(tempBudget);
                }
              }}
              /* 
                Changed from onMouseUp, onTouchEnd to onChangeEnd due to how event listeners work.
                Previously, when this was an <input type="range"> element, those event listeners would trigger even
                if the mouse was outside the element when it triggered. This is because the <input type="range">
                is a special element that the browser grants Implicit Pointer Capture. When the element was changed
                to a Mantine Slider component, this was no longer the case. So it was changed to a onChangeEnd event
                (a Mantine-specific prop)

                Contrary to the name "onChangeEnd", this gets trigerred when the user stops dragging the slider
                (i.e. lifts the mouse) or when the value is changed with the keyboard - not when the knob position stops changing.
                We want it to be able to be triggered even if the mouse is outside the component,
                but it shouldn't be triggered while holding down one of the arrow keys - handleBudgetChange should only be triggered
                when the key is lifted. Therefore, we use onChangeEnd with a ref checking if the slider
                is being dragged (via the mouse or touch)
              */ 
              onChangeEnd={(val) => {
                if (isDraggingRef.current) {
                  isDraggingRef.current = false;
                  if (val !== budget) {
                    handleBudgetChange(val);
                  }
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
        ) || (<div className='mt-3'/>)}
      </div>

      {/* Interactive Sidebar Route List */}
      {routeData && routeData.features.length > 0 && (
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

            // Determine label: "Recommended" for the best route, "Toll Route" if alternative has tolls, otherwise "Alternative Route"
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
      )}
    </div>
  );
}

export default RoutingOptionsCard;