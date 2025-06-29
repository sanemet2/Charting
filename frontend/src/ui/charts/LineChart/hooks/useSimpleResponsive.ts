import { useState, useEffect, useMemo } from 'react';

interface UseSimpleResponsiveProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridSize: string;
}

interface ResponsiveData {
  containerDimensions: { width: number; height: number };
  isDimensionsStable: boolean;
  responsiveSettings: {
    fontSize: number;
    padding: string;
    itemGap: string;
  };
  isNarrow: boolean;
  isVerySmall: boolean;
}

export const useSimpleResponsive = ({ 
  containerRef, 
  gridSize 
}: UseSimpleResponsiveProps): ResponsiveData => {
  
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isDimensionsStable, setIsDimensionsStable] = useState(false);

  // Responsive settings based on grid size only
  const responsiveSettings = useMemo(() => {
    const gridSettings = {
      '1x1': { fontSize: 14, padding: '8px 16px', itemGap: '6px' },
      '2x2': { fontSize: 12, padding: '6px 12px', itemGap: '5px' },
      '3x3': { fontSize: 11, padding: '6px 12px', itemGap: '4px' },
      '4x4': { fontSize: 10, padding: '5px 10px', itemGap: '4px' },
      '5x5': { fontSize: 9, padding: '4px 8px', itemGap: '3px' }
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
        
        // Mark as stable after a short delay
        const timer = setTimeout(() => {
          setIsDimensionsStable(true);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Reset stability when grid size changes
  useEffect(() => {
    setIsDimensionsStable(false);
    const timer = setTimeout(() => {
      setIsDimensionsStable(true);
    }, 150);
    
    return () => clearTimeout(timer);
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