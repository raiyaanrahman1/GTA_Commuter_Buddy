import { useState, useRef, useCallback, useEffect } from 'react';

export const useMapLoading = () => {
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const loadingExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingExitDuration = 1000;

  const restartLoading = useCallback(() => {
    setLoadingVisible(false);

    if (loadingExitTimerRef.current) {
      clearTimeout(loadingExitTimerRef.current);
    }

    loadingExitTimerRef.current = setTimeout(() => {
      setLoadingKey((prev) => prev + 1);
      setLoadingVisible(true);
    }, loadingExitDuration / 4);
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
      if (loadingExitTimerRef.current) {
        clearTimeout(loadingExitTimerRef.current);
      }
    };
  }, []);

  return {
    loadingVisible,
    loadingKey,
    loadingMessage,
    loadingExitDuration,
    setLoadingMessage,
    startLoading,
    stopLoading
  };
};