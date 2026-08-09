import { useEffect, useEffectEvent } from 'react';
import { useIdle } from '@mantine/hooks';

const LeaveNowRefreshInterval = 5 * 1000 * 60; // 5 minutes

const getCurrentDttm = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export const useDepartureRefresh = (
  depTimeOption: string,
  handleDepartureChange: (newDttm: string, delay: number, message?: string | null) => void
) => {
  const isIdle = useIdle(LeaveNowRefreshInterval, { initialState: false });

  const onRefreshDeparture = useEffectEvent((newDttm: string) => {
    handleDepartureChange(newDttm, 0, 'Getting you the latest results...');
  });

  useEffect(() => {
    if (depTimeOption !== 'Leave Now' || isIdle) return;

    const curDttm = getCurrentDttm();
    onRefreshDeparture(curDttm);

    const intervalId = setInterval(() => {
      const refreshedDttm = getCurrentDttm();
      onRefreshDeparture(refreshedDttm);
    }, LeaveNowRefreshInterval);

    // Cleanup clears the timer on unmount, when options change, or when the user goes idle
    return () => {
      clearInterval(intervalId);
    };
  }, [depTimeOption, isIdle]);
};