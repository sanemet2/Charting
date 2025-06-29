import { useState, useRef, useEffect, useMemo } from 'react';
import { Series } from '../types';
import { debug, debugCategories } from '../utils/debug';

interface UseLegendProps {
  processedSeries: Series[];
  gridSize: string;
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{[key: string]: 'y' | 'y2'}>>;
  settings: {
    showLegend: boolean;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  containerDimensions: { width: number; height: number };
  isNarrow: boolean;
  isVerySmall: boolean;
  isDimensionsStable: boolean;
}

interface UseLegendReturn {
  // Series management
  seriesNames: {[key: string]: string};
  setSeriesNames: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  editingSeries: string | null;
  setEditingSeries: React.Dispatch<React.SetStateAction<string | null>>;
  seriesInputRef: React.RefObject<HTMLInputElement | null>;
  handleSeriesSubmit: (e: React.FormEvent, seriesKey: string) => void;
  
  // Carousel management
  carouselOffset: number;
  setCarouselOffset: React.Dispatch<React.SetStateAction<number>>;
  getLegendCarousel: () => {
    hasOverflow: boolean;
    maxOffset: number;
    currentOffset: number;
    visibleItems: Series[];
    canScrollNext: boolean;
  };
  handleCarouselNext: () => void;
  
  // Responsive positioning
  legendStyle: React.CSSProperties;
  legendHeight: number;
  shouldShowLegend: boolean;
}

export const useLegend = ({
  processedSeries,
  gridSize,
  seriesAxisAssignment,
  setSeriesAxisAssignment,
  settings,
  containerDimensions,
  isNarrow,
  isVerySmall,
  isDimensionsStable
}: UseLegendProps): UseLegendReturn => {
  
  const [seriesNames, setSeriesNames] = useState<{[key: string]: string}>({});
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedSeriesNamesRef = useRef(false);

  // Initialize series names from props ONLY ONCE
  const initialSeriesNames = useMemo(() => {
    const names: {[key: string]: string} = {};
    processedSeries.forEach((s) => {
      names[s.dataKey] = s.name;
    });
    return names;
  }, [processedSeries]);

  useEffect(() => {
    if (hasInitializedSeriesNamesRef.current) return;
    
    if (Object.keys(initialSeriesNames).length > 0) {
      setSeriesNames(initialSeriesNames);
      hasInitializedSeriesNamesRef.current = true;
    }
  }, [initialSeriesNames]);

  // Focus and select series input when editing
  useEffect(() => {
    if (editingSeries && seriesInputRef.current) {
      seriesInputRef.current.focus();
      seriesInputRef.current.select();
    }
  }, [editingSeries]);

  const handleSeriesSubmit = (e: React.FormEvent, seriesKey: string) => {
    e.preventDefault();
    setEditingSeries(null);
  };

  // Carousel logic
  const getLegendCarousel = () => {
    const maxVisibleItems = 2; // Fixed to 2 items as requested
    const hasOverflow = processedSeries.length > maxVisibleItems;
    const maxOffset = hasOverflow ? processedSeries.length - maxVisibleItems : 0;
    
    // Ensure carousel offset doesn't exceed bounds
    const currentOffset = Math.min(carouselOffset, maxOffset);

    return {
      hasOverflow,
      maxOffset,
      currentOffset,
      visibleItems: processedSeries.slice(currentOffset, currentOffset + maxVisibleItems),
      canScrollNext: hasOverflow
    };
  };

  const handleCarouselNext = () => {
    setCarouselOffset((prev) => {
      const next = prev + 1;
      // Endless loop: if we reach the end, go back to start
      const maxOffset = Math.max(0, processedSeries.length - 2);
      const newOffset = next > maxOffset ? 0 : next;
      return newOffset;
    });
  };

  // Responsive positioning calculations
  const legendHeight = useMemo(() => {
    if (!settings.showLegend || processedSeries.length === 0) return 0;
    
    // 🔧 FIX: Completely deterministic height calculation - no async dependencies
    const gridBasedHeights = {
      '1x1': 36,  // Largest for single chart
      '2x2': 32,  // Large for 2x2 grid
      '3x3': 28,  // Standard for 3x3 grid  
      '4x4': 24,  // Smaller for 4x4 grid
      '5x5': 20   // Smallest for 5x5 grid
    };
    
    const baseHeight = gridBasedHeights[gridSize as keyof typeof gridBasedHeights] || 28;
    
    debug(debugCategories.LEGEND, {
      message: 'Legend height calculation',
      gridSize,
      baseHeight,
      isDimensionsStable,
      seriesCount: processedSeries.length
    });
    
    return baseHeight;
  }, [settings.showLegend, processedSeries.length, gridSize, containerDimensions, isDimensionsStable]);

  const legendStyle = useMemo((): React.CSSProperties => {
    // 🔧 FIX: Simplified, deterministic styling
    const gridSettings = {
      '1x1': { padding: '8px 16px', fontSize: 14 },
      '2x2': { padding: '6px 12px', fontSize: 12 },
      '3x3': { padding: '6px 12px', fontSize: 11 },
      '4x4': { padding: '5px 10px', fontSize: 10 },
      '5x5': { padding: '4px 8px', fontSize: 9 }
    };
    
    const settings = gridSettings[gridSize as keyof typeof gridSettings] || gridSettings['3x3'];
    
    debug(debugCategories.LEGEND, {
      message: 'Legend style calculation',
      legendHeight,
      fontSize: settings.fontSize
    });
    
    return {
      width: '100%',
      height: `${legendHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: settings.padding,
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      fontSize: `${settings.fontSize}px`,
      boxSizing: 'border-box',
      flexShrink: 0,
      position: 'relative' // Ensure it's in normal document flow
    };
  }, [legendHeight, gridSize]);

  const shouldShowLegend = settings.showLegend && processedSeries.length > 0;

  return {
    // Series management
    seriesNames,
    setSeriesNames,
    editingSeries,
    setEditingSeries,
    seriesInputRef,
    handleSeriesSubmit,
    
    // Carousel management
    carouselOffset,
    setCarouselOffset,
    getLegendCarousel,
    handleCarouselNext,
    
    // Responsive positioning
    legendStyle,
    legendHeight,
    shouldShowLegend
  };
}; 