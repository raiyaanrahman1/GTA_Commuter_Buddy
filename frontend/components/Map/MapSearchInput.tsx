'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Combobox, TextInput, Loader, CloseButton, useCombobox } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { SearchBoxCore, SessionToken } from '@mapbox/search-js-core';
import type { SearchBoxSuggestion } from '@mapbox/search-js-core';
import type mapboxgl from 'mapbox-gl';
import { getDistanceInMeters } from './utils/routeUtils';
import type { CachedLocation } from './types';

interface MapSearchInputProps {
  accessToken: string;
  mapInstance: mapboxgl.Map | undefined;
  proximity: [number, number];
  placeholder: string;
  onResult: (coords: [number, number] | null) => void;
}

export default function MapSearchInput({
  accessToken,
  proximity,
  placeholder,
  onResult
}: MapSearchInputProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchBoxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Debounce input value by 300ms to reduce Mapbox billable keypress requests
  const [debouncedQuery] = useDebouncedValue(value, 300);

  // A stable flag to control whether suggest requests are allowed
  const shouldSuggestRef = useRef(true);

  // Store both coordinates and certainty radius to calculate circle intersections
  const lastGeolocRef = useRef<CachedLocation | null>(null);

  // Keep a session token in a stable Ref (fixes the stuck loading spinner)
  const sessionTokenRef = useRef<SessionToken | null>(null);
  
  // Lazily initialize the session token on the client side
  if (sessionTokenRef.current === null) {
    sessionTokenRef.current = new SessionToken();
  }

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Stably instantiate SearchBoxCore
  const searchBox = useMemo(() => new SearchBoxCore({ accessToken }), [accessToken]);

  // Query Mapbox Search API when debounced query updates
  useEffect(() => {
    if (
      debouncedQuery.trim().length === 0 || 
      debouncedQuery === 'Your Location' || 
      !shouldSuggestRef.current
    ) {
      return;
    }

    let active = true;

    searchBox.suggest(debouncedQuery, {
      proximity,
      types: 'address,poi',
      sessionToken: sessionTokenRef.current as SessionToken
    })
    .then((res) => {
      if (active) {
        setSuggestions(res.suggestions || []);
      }
    })
    .catch((err) => {
      console.error('Mapbox suggest error:', err);
    })
    .finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [debouncedQuery, proximity, searchBox]);

  // Reset and synchronize all state variables when input is cleared
  const handleClear = useCallback(() => {
    setValue('');
    setSuggestions([]);
    setLoading(false);
    lastGeolocRef.current = null; // Clear stable geoloc ref on input clear
    shouldSuggestRef.current = true; // Allow search suggestions again once cleared
    onResult(null); // Notify parent to clear origin/destination coordinate markers
  }, [onResult]);

  // Handle browser GPS geocoding lookup with intersecting uncertainty circles
  const handleUseCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      setLoading(true);
      combobox.closeDropdown();
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude, accuracy } = position.coords;
          let coords: [number, number] = [longitude, latitude];
          const currentAccuracy = accuracy ?? 15; // Default fallback to 15m if accuracy is null

          if (lastGeolocRef.current !== null) {
            const distanceMeters = getDistanceInMeters(coords, lastGeolocRef.current.coords);
            const sumOfRadii = lastGeolocRef.current.accuracy + currentAccuracy;

            // Precision refinement check: If new reading is significantly more accurate (e.g., 25% or greater improvement),
            // we adopt it anyway to resolve coarse cellular locks.
            const isSignificantlyMoreAccurate = currentAccuracy < lastGeolocRef.current.accuracy * 0.75;

            if (distanceMeters <= sumOfRadii && !isSignificantlyMoreAccurate) {
              // Circles intersect and precision is comparable; keep the stable cached location
              coords = lastGeolocRef.current.coords;
              console.log('comparable locations and precision');
              console.log(distanceMeters);
              console.log(isSignificantlyMoreAccurate, lastGeolocRef.current.accuracy, currentAccuracy);

            } else {
              // Circles do not intersect (actual movement) OR precision improved; update reference
              console.log('different locations or precision');
              console.log(distanceMeters);
              console.log(isSignificantlyMoreAccurate, lastGeolocRef.current.accuracy, currentAccuracy);
              lastGeolocRef.current = { coords, accuracy: currentAccuracy };
            }
          } else {
            // First time getting location; save coordinates and confidence radius
            lastGeolocRef.current = { coords, accuracy: currentAccuracy };
          }

          shouldSuggestRef.current = false; // Block suggest API for "Your Location" selection
          setValue('Your Location');
          setSuggestions([]);
          onResult(coords);
          setLoading(false);
        },
        (error) => {
          console.error("GPS location resolution failed:", error);
          setLoading(false);
        },
        {
          enableHighAccuracy: true, // Request fine GPS/Wi-Fi positioning
          timeout: 6000,            // Wait up to 6 seconds for a lock
          maximumAge: 0             // Force fresh hardware queries
        }
      );
    }
  }, [onResult, combobox]);

  // Handle option selection
  const handleSelect = useCallback(async (optionValue: string) => {
    if (optionValue === 'current_location') {
      handleUseCurrentLocation();
      return;
    }

    const selectedSuggestion = suggestions.find(s => s.mapbox_id === optionValue);
    if (!selectedSuggestion) return;

    const displayName = selectedSuggestion.name || selectedSuggestion.full_address || '';
    
    shouldSuggestRef.current = false; // Block suggest API for selection
    setValue(displayName);
    combobox.closeDropdown();

    try {
      setLoading(true);
      
      // Pass the session token during coordinates lookup
      const res = await searchBox.retrieve(selectedSuggestion, { sessionToken: sessionTokenRef.current as SessionToken });
      
      // Cycle and refresh the session token Ref to prepare for the next search flow
      sessionTokenRef.current = new SessionToken();

      if (res?.features?.length > 0) {
        const coords = res.features[0].geometry.coordinates as [number, number];
        onResult(coords);
      }
    } catch (err) {
      console.error('Retrieve coordinate error:', err);
    } finally {
      setLoading(false);
    }
  }, [suggestions, searchBox, onResult, combobox, handleUseCurrentLocation]);

  // Prepend the "Use Current Location" option to your suggestions list
  const options = [
    <Combobox.Option value="current_location" key="current_location">
      <div className="flex items-center gap-2 text-xs py-1 text-blue-600 hover:text-blue-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3.5 h-3.5 text-blue-500 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <span className="font-bold">Use Current Location</span>
      </div>
    </Combobox.Option>,
    ...suggestions.map((item) => (
      <Combobox.Option value={item.mapbox_id} key={item.mapbox_id}>
        <div className="flex flex-col text-xs leading-tight py-0.5">
          <span className="font-semibold text-gray-800">{item.name}</span>
          <span className="text-gray-400 text-[10px] mt-0.5">{item.full_address}</span>
        </div>
      </Combobox.Option>
    ))
  ];

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => handleSelect(val)}
    >
      <Combobox.Target>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            const newVal = event.currentTarget.value;
            setValue(newVal);
            
            // Allow suggestions to load again as soon as user edits/types
            shouldSuggestRef.current = true;
            
            // Instantly clear out states synchronously on empty string input (bypasses React 19 warning)
            if (newVal.trim().length === 0) {
              handleClear();
            } else {
              setLoading(true);
            }
            
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          size="sm"
          radius="md"
          leftSection={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.2}
              stroke="currentColor"
              className="w-4 h-4 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
              />
            </svg>
          }
          // Dynamically adjust width to give standard padding when the clear button is active
          rightSectionWidth={value ? 58 : 35}
          rightSection={
            <div className="flex items-center justify-end gap-1.5 pr-2 w-full">
              {loading && <Loader size="xs" color="blue" />}
              {value && (
                <CloseButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the dropdown from opening on click
                    handleClear();
                    combobox.closeDropdown();
                  }}
                />
              )}
            </div>
          }
        />
      </Combobox.Target>

      <Combobox.Dropdown className="shadow-lg rounded-md max-h-[220px] overflow-y-auto z-30">
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}