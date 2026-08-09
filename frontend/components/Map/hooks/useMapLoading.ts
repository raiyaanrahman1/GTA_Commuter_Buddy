import { useState, useRef, useCallback, useEffect } from 'react';

export const useMapLoading = () => {
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitDuration = 1000;

  const restartLoading = useCallback(() => {
    setLoadingVisible(false);

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }

    exitTimerRef.current = setTimeout(() => {
      setLoadingKey((prev) => prev + 1);
      setLoadingVisible(true);
    }, exitDuration / 4);
  }, []);

  const startLoading = useCallback(() => {
    if (loadingVisible) {
      restartLoading();
    } else {
      setLoadingVisible(true);
    }
  }, [loadingVisible, restartLoading]);

  const stopLoading = useCallback(() => {
    setLoadingVisible(false);
    setLoadingMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  return {
    loadingVisible,
    loadingKey,
    loadingMessage,
    setLoadingMessage,
    startLoading,
    stopLoading
  };
};