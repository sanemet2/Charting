import { useState, useEffect, useMemo, useRef } from 'react';

interface UseSimpleResponsiveProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridSize: string;
}

interface ResponsiveSettings {
  fontSize: number;
  titleSize: number;
  margin: {
    l: number;
    r: number;
    t: number;
    b: number;
  };
  nticks: number;
  dateFormat: string;
  sampleRate: number;
}

interface ResponsiveData {
  containerDimensions: { width: number; height: number };
  isDimensionsStable: boolean;
  responsiveSettings: ResponsiveSettings;
  isNarrow: boolean;
  isVerySmall: boolean;
}

export const useSimpleResponsive = ({ 
  containerRef, 
  gridSize 
}: UseSimpleResponsiveProps): ResponsiveData => {
  
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isDimensionsStable, setIsDimensionsStable] = useState(false);
  const stabilityTimer = useRef<NodeJS.Timeout | null>(null);

  // Responsive settings based on grid size only
  const responsiveSettings = useMemo((): ResponsiveSettings => {
    const gridSettings = {
      '1x1': { 
        fontSize: 14, 
        titleSize: 16,
        margin: { l: 60, r: 60, t: 40, b: 40 },
        nticks: 8,
        dateFormat: '%b-%Y',
        sampleRate: 1
      },
      '2x2': { 
        fontSize: 12, 
        titleSize: 14,
        margin: { l: 50, r: 50, t: 35, b: 35 },
        nticks: 6,
        dateFormat: '%b-%Y',
        sampleRate: 2
      },
      '3x3': { 
        fontSize: 11, 
        titleSize: 13,
        margin: { l: 45, r: 45, t: 30, b: 25 },
        nticks: 4,
        dateFormat: '%b-%Y',
        sampleRate: 5
      },
      '4x4': { 
        fontSize: 10, 
        titleSize: 12,
        margin: { l: 40, r: 40, t: 25, b: 25 },
        nticks: 4,
        dateFormat: '%b-%Y',
        sampleRate: 10
      },
      '5x5': { 
        fontSize: 9, 
        titleSize: 11,
        margin: { l: 35, r: 35, t: 20, b: 20 },
        nticks: 3,
        dateFormat: '%b-%Y',
        sampleRate: 20
      }
    };
    
    return gridSettings[gridSize as keyof typeof gridSettings] || gridSettings['3x3'];
  }, [gridSize]);

  // Container dimension tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
        
        // Clear previous timer to prevent race conditions
        if (stabilityTimer.current) {
          clearTimeout(stabilityTimer.current);
        }
        
        // Mark as stable after a short delay
        stabilityTimer.current = setTimeout(() => {
          setIsDimensionsStable(true);
        }, 150); // Use a slightly longer delay
      }
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current);
      }
    };
  }, [containerRef]);

  // Reset stability when grid size changes
  useEffect(() => {
    setIsDimensionsStable(false);
    
    // When grid size changes, we need to re-stabilize
    if (stabilityTimer.current) {
      clearTimeout(stabilityTimer.current);
    }
    
    stabilityTimer.current = setTimeout(() => {
      setIsDimensionsStable(true);
    }, 150);
    
    return () => {
      if (stabilityTimer.current) {
        clearTimeout(stabilityTimer.current);
      }
    };
  }, [gridSize]);

  // Simple breakpoint calculations
  const isNarrow = containerDimensions.width < 400;
  const isVerySmall = containerDimensions.width < 250;

  return {
    containerDimensions,
    isDimensionsStable,
    responsiveSettings,
    isNarrow,
    isVerySmall
  };
}; 