'use client';

import { Select } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import type { handleDepartureChangeType } from '../hooks/useRouteOptionHandlers'

interface DepartureTimeSelectorProps {
  depTimeOption: string;
  departureDttm: string | null;
  setDepTimeOption: (value: string) => void;
  handleDepartureChange: handleDepartureChangeType;
}

export const DepartureTimeSelector = ({
  depTimeOption,
  departureDttm,
  setDepTimeOption,
  handleDepartureChange
}: DepartureTimeSelectorProps) => {
  return (
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
            value={departureDttm ? new Date(departureDttm) : null}
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
          />
        )
      }
    </div>
  );
};