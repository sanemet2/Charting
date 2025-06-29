import { useMemo, useState, useEffect, RefObject, useRef } from 'react';
import { debug, debugCategories } from '../utils/debug';

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

interface UseResponsiveSettingsProps {
  gridSize: string;
  containerRef?: RefObject<HTMLDivElement | null>;
}

interface UseResponsiveSettingsReturn {
  responsiveSettings: ResponsiveSettings;
  containerDimensions: { width: number; height: number };
  isNarrow: boolean;
  isVerySmall: boolean;
  isDimensionsStable: boolean;
}

export const useResponsiveSettings = ({
  gridSize,
  containerRef
}: UseResponsiveSettingsProps): UseResponsiveSettingsReturn => {
  
  // Track actual container dimensions
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isDimensionsStable, setIsDimensionsStable] = useState(false);
  
  // Track grid size changes to reset stability
  const [lastGridSize, setLastGridSize] = useState(gridSize);
  
  // Reset stability when grid size changes
  useEffect(() => {
    if (lastGridSize !== gridSize) {
            debug(debugCategories.RESPONSIVE, {
        message: 'Grid changed, marking dimensions as unstable',
        from: lastGridSize,
        to: gridSize
      });
      setIsDimensionsStable(false);
      setLastGridSize(gridSize);
      
      // 🔧 ADD: Fallback timeout to force stability if ResizeObserver doesn't trigger
      const fallbackTimer = setTimeout(() => {
        setIsDimensionsStable(true);
        debug(debugCategories.RESPONSIVE, {
          message: 'Forced stability via timeout fallback',
          gridSize
        });
      }, 200); // 200ms fallback - longer than typical resize time
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [gridSize, lastGridSize]);
  
  // ResizeObserver to track container size changes
  useEffect(() => {
    if (!containerRef?.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        
        setContainerDimensions(prevDimensions => {
          const widthChange = prevDimensions.width - width;
          const heightChange = prevDimensions.height - height;
          const hasChanged = prevDimensions.width !== width || prevDimensions.height !== height;
          
          // 🔍 DEBUG: Detailed resize event analysis 
          debug(debugCategories.RESPONSIVE, {
            message: hasChanged ? '🚨 RESIZE EVENT TRIGGERED 🚨' : 'RESIZE EVENT - No change',
            gridSize,
            prevDimensions,
            newDimensions: { width, height },
            changes: { widthChange, heightChange },
            changeAmount: Math.abs(widthChange) + Math.abs(heightChange),
            isSubPixel: Math.abs(widthChange) < 1 && Math.abs(heightChange) < 1,
            timestamp: Date.now()
          });
          
          if (hasChanged) {
            // Mark as stable after dimensions settle
            setTimeout(() => {
              setIsDimensionsStable(true);
              debug(debugCategories.RESPONSIVE, {
                message: 'Dimensions stabilized',
                gridSize,
                finalDimensions: { width, height }
              });
            }, 150); // 🔧 FIX: Increased delay to ensure font changes have fully rendered
          }
          
          return { width, height };
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, gridSize]);
  
  // Container size breakpoints
  const isNarrow = containerDimensions.width > 0 && containerDimensions.width < 350;
  const isVerySmall = containerDimensions.width > 0 && containerDimensions.width < 250;

  // Comprehensive responsive system based on grid size
  const getResponsiveSettings = (gridSize: string): ResponsiveSettings => {
    const settings = {
      '1x1': { 
        fontSize: 16, titleSize: 18, margin: { l: 80, r: 80, t: 20, b: 80 },
        nticks: 10, dateFormat: '%b %Y', sampleRate: 2
      },
      '2x2': { 
        fontSize: 14, titleSize: 16, margin: { l: 60, r: 60, t: 12, b: 70 },
        nticks: 8, dateFormat: '%b %Y', sampleRate: 3
      },
      '3x3': { 
        fontSize: 12, titleSize: 14, margin: { l: 50, r: 50, t: 10, b: 80 },
        nticks: 6, dateFormat: '%b %y', sampleRate: 5
      },
      '4x4': { 
        fontSize: 10, titleSize: 12, margin: { l: 40, r: 40, t: 8, b: 60 },
        nticks: 5, dateFormat: '%b %y', sampleRate: 7
      },
      '5x5': { 
        fontSize: 8, titleSize: 10, margin: { l: 35, r: 30, t: 8, b: 45 },
        nticks: 4, dateFormat: '%b %y', sampleRate: 10
      }
    };
    return settings[gridSize as keyof typeof settings] || settings['3x3'];
  };

  const responsiveSettings = useMemo((): ResponsiveSettings => {
    const baseSettings = getResponsiveSettings(gridSize);
    
    // Apply container-based scaling if container dimensions are available
    if (containerDimensions.width > 0) {
      // More aggressive scaling for very small containers (5x5 grid)
      const containerScale = containerDimensions.width < 200 ? 
        Math.min(containerDimensions.width / 300, 0.8) : // Extra small containers
        Math.min(containerDimensions.width / 400, 1.2);   // Normal scaling
      
      const narrowScale = isVerySmall ? 0.6 : isNarrow ? 0.8 : 1; // More aggressive scaling
      
      return {
        ...baseSettings,
        fontSize: Math.max(7, Math.round(baseSettings.fontSize * containerScale * narrowScale)), // Allow smaller fonts
        titleSize: Math.max(8, Math.round(baseSettings.titleSize * containerScale * narrowScale)), // Allow smaller titles
        margin: {
          ...baseSettings.margin,
          l: Math.max(25, Math.round(baseSettings.margin.l * containerScale * 0.8)), // Tighter left margin
          r: Math.max(15, Math.round(baseSettings.margin.r * containerScale * 0.8)), // Tighter right margin
          t: Math.max(10, Math.round(baseSettings.margin.t * containerScale * 0.7)), // Much tighter top
          b: Math.max(5, Math.round(baseSettings.margin.b * containerScale * 0.5))   // Much tighter bottom
        }
      };
    }
    
    return baseSettings;
  }, [gridSize, containerDimensions, isNarrow, isVerySmall]);

  return {
    responsiveSettings,
    containerDimensions,
    isNarrow,
    isVerySmall,
    isDimensionsStable
  };
}; 