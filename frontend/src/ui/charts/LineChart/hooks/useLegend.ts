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
  responsiveSettings: {
    fontSize: number;
  };
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
    maxVisibleItems: number;
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
  isDimensionsStable,
  responsiveSettings
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
    // 🔧 FIX: Dynamic calculation of visible items based on container width AND font size
    const itemPadding = 24; // Approx padding/margin per item
    const avgCharWidth = responsiveSettings.fontSize * 0.6; // Estimate char width based on font size
    const iconWidths = 60; // Space for L/R toggle, color swatch, etc.

    // If there are only two series, always try to show both.
    if (processedSeries.length <= 2) {
      return {
        hasOverflow: false,
        maxOffset: 0,
        currentOffset: 0,
        visibleItems: processedSeries,
        canScrollNext: false,
        maxVisibleItems: 2
      };
    }

    let totalItemsWidth = 0;
    let maxVisibleItems = 0;

    for (const series of processedSeries) {
      const name = seriesNames[series.dataKey] || series.name;
      const itemWidth = (name.length * avgCharWidth) + iconWidths + itemPadding;
      if (totalItemsWidth + itemWidth > containerDimensions.width && maxVisibleItems > 0) {
        break; // Not enough space for the next item
      }
      totalItemsWidth += itemWidth;
      maxVisibleItems++;
    }
    
    // Ensure at least one item is shown if there are any series
    if (processedSeries.length > 0 && maxVisibleItems === 0) {
      maxVisibleItems = 1;
    }

    const hasOverflow = processedSeries.length > maxVisibleItems;
    const maxOffset = hasOverflow ? processedSeries.length - maxVisibleItems : 0;
    
    // Ensure carousel offset doesn't exceed bounds
    const currentOffset = Math.min(carouselOffset, maxOffset);

    return {
      hasOverflow,
      maxOffset,
      currentOffset,
      visibleItems: processedSeries.slice(currentOffset, currentOffset + maxVisibleItems),
      canScrollNext: hasOverflow,
      maxVisibleItems
    };
  };

  const handleCarouselNext = () => {
    const { maxVisibleItems } = getLegendCarousel(); // Get current dynamic value
    setCarouselOffset((prev) => {
      const next = prev + 1;
      const maxOffset = Math.max(0, processedSeries.length - maxVisibleItems);
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
      fontSize: responsiveSettings.fontSize // Use responsive font size
    });
    
    return {
      width: '100%',
      height: `${legendHeight}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: settings.padding,
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      fontSize: `${responsiveSettings.fontSize}px`, // Use responsive font size
      boxSizing: 'border-box',
      flexShrink: 0,
      position: 'relative' // Ensure it's in normal document flow
    };
  }, [legendHeight, gridSize, responsiveSettings.fontSize]);

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