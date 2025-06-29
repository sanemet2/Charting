import { useState, useRef, useEffect, useMemo } from 'react';
import { Series } from '../types';

interface UseSeriesManagementProps {
  processedSeries: Series[];
  gridSize: string;
}

interface UseSeriesManagementReturn {
  seriesNames: {[key: string]: string};
  setSeriesNames: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  editingSeries: string | null;
  setEditingSeries: React.Dispatch<React.SetStateAction<string | null>>;
  carouselOffset: number;
  setCarouselOffset: React.Dispatch<React.SetStateAction<number>>;
  seriesInputRef: React.RefObject<HTMLInputElement | null>;
  handleSeriesSubmit: (e: React.FormEvent, seriesKey: string) => void;
  getLegendCarousel: () => {
    hasOverflow: boolean;
    maxOffset: number;
    currentOffset: number;
    visibleItems: Series[];
    canScrollNext: boolean;
  };
  handleCarouselNext: () => void;
  getMaxLegendItems: (gridSize: string) => number;
}

export const useSeriesManagement = ({
  processedSeries,
  gridSize
}: UseSeriesManagementProps): UseSeriesManagementReturn => {
  
  const [seriesNames, setSeriesNames] = useState<{[key: string]: string}>({});
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedSeriesNamesRef = useRef(false);

  // Memoize series names to prevent unnecessary re-renders
  const initialSeriesNames = useMemo(() => {
    const names: {[key: string]: string} = {};
    processedSeries.forEach((s) => {
      names[s.dataKey] = s.name;
    });
    return names;
  }, [processedSeries]);

  // Initialize series names from props ONLY ONCE
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

  const getMaxLegendItems = (gridSize: string): number => {
    // Always show exactly 2 items for now, as requested
    return 2;
  };

  const getLegendCarousel = () => {
    const maxVisibleItems = 2; // Fixed to 2 items as requested
    const hasOverflow = processedSeries.length > maxVisibleItems;
    const maxOffset = hasOverflow ? processedSeries.length - maxVisibleItems : 0;
    
    // Ensure carousel offset doesn't exceed bounds
    const currentOffset = Math.min(carouselOffset, maxOffset);

    console.log('Carousel Debug:', {
      gridSize,
      maxVisibleItems,
      seriesCount: processedSeries.length,
      hasOverflow,
      carouselOffset,
      maxOffset,
      currentOffset
    });

    return {
      hasOverflow,
      maxOffset,
      currentOffset,
      visibleItems: processedSeries.slice(currentOffset, currentOffset + maxVisibleItems),
      canScrollNext: hasOverflow // Show button if there's overflow
    };
  };

  const handleCarouselNext = () => {
    console.log('Carousel button clicked!');
    setCarouselOffset((prev) => {
      const next = prev + 1;
      // Endless loop: if we reach the end, go back to start
      const maxOffset = Math.max(0, processedSeries.length - 2);
      const newOffset = next > maxOffset ? 0 : next;
      console.log('Carousel advancing:', { prev, next, maxOffset, newOffset });
      return newOffset;
    });
  };

  return {
    seriesNames,
    setSeriesNames,
    editingSeries,
    setEditingSeries,
    carouselOffset,
    setCarouselOffset,
    seriesInputRef,
    handleSeriesSubmit,
    getLegendCarousel,
    handleCarouselNext,
    getMaxLegendItems
  };
}; 