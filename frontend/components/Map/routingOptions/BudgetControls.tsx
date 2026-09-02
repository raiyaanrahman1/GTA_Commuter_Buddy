'use client';

import { Slider, NumberInput } from '@mantine/core';
import { useEffect, useState, useRef } from 'react';

interface BudgetControlsProps {
  budget: number;
  maxTollCost: number;
  routeMetadata: string | null;
  fetchError: string | null;
  clearFetchQueue: () => void;
  handleBudgetChange: (val: number) => void;
}

export const BudgetControls = ({
  budget,
  maxTollCost,
  routeMetadata,
  fetchError,
  clearFetchQueue,
  handleBudgetChange
}: BudgetControlsProps) => {
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
    if (val % stepSize === 0) {
      marks.push({
        value: val,
        label: `$${val}`
      });
    }
  }

  return (
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

        {/* Budget & Fetch Errors */}
        {fetchError ? (
          <p className="text-xs font-medium text-red-700 mt-5">
            {fetchError}
          </p>
        ) : routeMetadata === 'NonTollRoute' ? (
          <p className="text-xs font-medium text-red-700 mt-5">
            This route does not use the 407 ETR, budget not available
          </p>
        ) : (
          <div className="mt-3" />
        )}
      </div>
  );
};