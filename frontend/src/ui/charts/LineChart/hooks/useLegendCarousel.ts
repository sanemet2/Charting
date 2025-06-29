import { useMemo } from 'react';
import { Series } from '../types';

interface UseLegendCarouselProps {
  processedSeries: Series[];
  seriesNames: {[key: string]: string};
  carouselOffset: number;
  containerWidth: number;
  fontSize: number;
}

interface LegendCarouselData {
  hasOverflow: boolean;
  maxOffset: number;
  currentOffset: number;
  visibleItems: Series[];
  canScrollNext: boolean;
  maxVisibleItems: number;
}

export const useLegendCarousel = ({
  processedSeries,
  seriesNames,
  carouselOffset,
  containerWidth,
  fontSize
}: UseLegendCarouselProps): LegendCarouselData => {
  
  return useMemo(() => {
    // Early return for simple cases
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

    // Calculate item widths
    const itemPadding = 24;
    const avgCharWidth = fontSize * 0.6;
    const iconWidths = 60;

    let totalItemsWidth = 0;
    let maxVisibleItems = 0;

    for (const series of processedSeries) {
      const name = seriesNames[series.dataKey] || series.name;
      const itemWidth = (name.length * avgCharWidth) + iconWidths + itemPadding;
      
      if (totalItemsWidth + itemWidth > containerWidth && maxVisibleItems > 0) {
        break;
      }
      
      totalItemsWidth += itemWidth;
      maxVisibleItems++;
    }

    // Ensure at least one item is shown
    if (processedSeries.length > 0 && maxVisibleItems === 0) {
      maxVisibleItems = 1;
    }

    const hasOverflow = processedSeries.length > maxVisibleItems;
    const maxOffset = hasOverflow ? processedSeries.length - maxVisibleItems : 0;
    const currentOffset = Math.min(carouselOffset, maxOffset);

    return {
      hasOverflow,
      maxOffset,
      currentOffset,
      visibleItems: processedSeries.slice(currentOffset, currentOffset + maxVisibleItems),
      canScrollNext: hasOverflow,
      maxVisibleItems
    };
  }, [processedSeries, seriesNames, carouselOffset, containerWidth, fontSize]);
}; 