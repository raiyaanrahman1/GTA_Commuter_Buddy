import { useEffect, useState, useRef } from 'react';
import type { FeatureCollection, Geometry, Feature } from 'geojson';

export const useRouteAnimation = (routeData: FeatureCollection<Geometry> | null) => {
  const [animatedRouteData, setAnimatedRouteData] = useState<FeatureCollection<Geometry> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animates drawing of the polylines from origin to destination on route update
  useEffect(() => {
    if (!routeData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimatedRouteData(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Cancel any active animation loops
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const duration = 4000; // Animation duration in milliseconds
    const startTime = performance.now();

    // Deep copy original geometries to avoid mutating original state references
    const originalFeatures = routeData.features.map(f => {
      if (f.geometry.type === 'LineString') {
        const lineGeom = f.geometry;
        return {
          ...f,
          geometry: {
            ...lineGeom,
            coordinates: [...lineGeom.coordinates]
          }
        };
      }
      return f;
    });

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth deceleration easing function (Cubic Out)
      const easeCubicOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeCubicOut(progress);

      const animatedFeatures = originalFeatures.map(f => {
        if (f.geometry.type !== 'LineString') return f;
        
        const fullCoords = f.geometry.coordinates as [number, number][];
        // Ensure we always render a minimum of 2 coordinates to form a valid line segment
        const pointCount = Math.max(2, Math.floor(fullCoords.length * easedProgress));
        
        return {
          ...f,
          geometry: {
            ...f.geometry,
            coordinates: fullCoords.slice(0, pointCount)
          }
        };
      });

      setAnimatedRouteData({
        ...routeData,
        features: animatedFeatures as Feature<Geometry>[]
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [routeData]);

  return animatedRouteData;
};