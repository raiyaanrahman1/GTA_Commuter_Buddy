'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

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
  handleBudgetChange: (val: number) => void;
  clearFetchQueue: () => void;
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
  handleBudgetChange,
  clearFetchQueue
}: RoutingOptionsProps) => {
  const [tempBudget, setTempBudget] = useState(budget);
  const sliderKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'];

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

      {/* Budget Control */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-500">Max Budget</label>
          <span className="text-xs font-bold text-blue-600">${tempBudget}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={tempBudget}
            onChange={(e) => setTempBudget(Number(e.target.value))}

            onMouseDown={() => clearFetchQueue()}
            onTouchStart={() => clearFetchQueue()}
            onKeyDown={(e) => {
              if (sliderKeys.includes(e.key)) clearFetchQueue();
            }}

            onMouseUp={() => {
              if (tempBudget !== budget) handleBudgetChange(tempBudget)
            }}
            onTouchEnd={() => {
              if (tempBudget !== budget) handleBudgetChange(tempBudget)
            }}
            onKeyUp={(e) => {
              // Support keyboard navigation on range slider
              if (sliderKeys.includes(e.key) && tempBudget !== budget) {
                handleBudgetChange(tempBudget);
              }
            }}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <input
            type="number"
            min="0"
            max="500"
            step="5"
            value={tempBudget}
            onChange={(e) => {
              const val = Math.max(0, Math.min(500, Number(e.target.value)));
              setTempBudget(val);
              handleBudgetChange(val);
            }}
            className="w-16 text-xs p-1 border rounded-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center bg-white text-gray-700"
          />
        </div>
      </div>
    </div>
  )
}

export default RoutingOptionsCard