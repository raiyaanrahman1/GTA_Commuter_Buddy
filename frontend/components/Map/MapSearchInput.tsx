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
  
  const [debouncedQuery] = useDebouncedValue(value, 300);

  const shouldSuggestRef = useRef(true);

  const lastGeolocRef = useRef<CachedLocation | null>(null);

  const sessionTokenRef = useRef<SessionToken | null>(null);
  
  if (sessionTokenRef.current === null) {
    sessionTokenRef.current = new SessionToken();
  }

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const searchBox = useMemo(() => new SearchBoxCore({ accessToken }), [accessToken]);

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

  const handleClear = useCallback(() => {
    setValue('');
    setSuggestions([]);
    setLoading(false);
    lastGeolocRef.current = null;
    shouldSuggestRef.current = true;
    onResult(null);
  }, [onResult]);

  const handleUseCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      setLoading(true);
      combobox.closeDropdown();
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude, accuracy } = position.coords;
          let coords: [number, number] = [longitude, latitude];
          const currentAccuracy = accuracy ?? 15;

          if (lastGeolocRef.current !== null) {
            const distanceMeters = getDistanceInMeters(coords, lastGeolocRef.current.coords);
            const sumOfRadii = lastGeolocRef.current.accuracy + currentAccuracy;

            const isSignificantlyMoreAccurate = currentAccuracy < lastGeolocRef.current.accuracy * 0.75;

            if (distanceMeters <= sumOfRadii && !isSignificantlyMoreAccurate) {
              coords = lastGeolocRef.current.coords;
              console.log('comparable locations and precision');
              console.log(distanceMeters);
              console.log(isSignificantlyMoreAccurate, lastGeolocRef.current.accuracy, currentAccuracy);
            } else {
              console.log('different locations or precision');
              console.log(distanceMeters);
              console.log(isSignificantlyMoreAccurate, lastGeolocRef.current.accuracy, currentAccuracy);
              lastGeolocRef.current = { coords, accuracy: currentAccuracy };
            }
          } else {
            lastGeolocRef.current = { coords, accuracy: currentAccuracy };
          }

          shouldSuggestRef.current = false;
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
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0
        }
      );
    }
  }, [onResult, combobox]);

  const handleSelect = useCallback(async (optionValue: string) => {
    if (optionValue === 'current_location') {
      handleUseCurrentLocation();
      return;
    }

    const selectedSuggestion = suggestions.find(s => s.mapbox_id === optionValue);
    if (!selectedSuggestion) return;

    const displayName = selectedSuggestion.name || selectedSuggestion.full_address || '';
    
    shouldSuggestRef.current = false;
    setValue(displayName);
    combobox.closeDropdown();

    try {
      setLoading(true);
      
      const res = await searchBox.retrieve(selectedSuggestion, { sessionToken: sessionTokenRef.current as SessionToken });
      
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
            
            shouldSuggestRef.current = true;
            
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
          rightSectionWidth={value ? 58 : 35}
          rightSection={
            <div className="flex items-center justify-end gap-1.5 pr-2 w-full">
              {loading && <Loader size="xs" color="blue" />}
              {value && (
                <CloseButton
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
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