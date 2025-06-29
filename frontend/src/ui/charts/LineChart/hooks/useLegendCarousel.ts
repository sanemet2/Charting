import { useMemo, useRef } from 'react';
import { Series } from '../types';
import { measureText } from '../utils/measureText';

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
  seriesInputRef: React.RefObject<HTMLInputElement | null>;
}

export const useLegendCarousel = ({
  processedSeries,
  seriesNames,
  carouselOffset,
  containerWidth,
  fontSize
}: UseLegendCarouselProps): LegendCarouselData => {
  const seriesInputRef = useRef<HTMLInputElement | null>(null);
  
  return useMemo(() => {
    if (processedSeries.length <= 1) {
      return {
        hasOverflow: false,
        maxOffset: 0,
        currentOffset: 0,
        visibleItems: processedSeries,
        canScrollNext: false,
        maxVisibleItems: processedSeries.length,
        seriesInputRef
      };
    }

    // --- More robust width calculation ---
    const itemPadding = 16; 
    const iconWidths = 52; // Width of color square + L/R button + gaps
    const font = `${fontSize}px "Inter", sans-serif`;
    const carouselButtonWidth = 30; // Approx. width of the '...' button + its gap

    const itemWidths = processedSeries.map(s => {
      const name = seriesNames[s.dataKey] || s.name;
      const textWidth = measureText(name, font);
      return textWidth + iconWidths + itemPadding;
    });

    const totalItemsWidth = itemWidths.reduce((sum, width) => sum + width, 0);
    const doesOverflow = totalItemsWidth > containerWidth;

    const availableWidth = doesOverflow ? containerWidth - carouselButtonWidth : containerWidth;

    let maxVisibleItems = 0;
    let currentWidth = 0;
    for (const width of itemWidths) {
      if (currentWidth + width > availableWidth) {
        break;
      }
      currentWidth += width;
      maxVisibleItems++;
    }
    
    const hasOverflow = processedSeries.length > maxVisibleItems;
    const maxOffset = hasOverflow ? Math.max(0, processedSeries.length - maxVisibleItems) : 0;
    const currentOffset = Math.min(carouselOffset, maxOffset);
    const canScrollNext = hasOverflow;

    return {
      hasOverflow,
      maxOffset,
      currentOffset,
      visibleItems: processedSeries.slice(currentOffset, currentOffset + maxVisibleItems),
      canScrollNext,
      maxVisibleItems,
      seriesInputRef
    };
  }, [processedSeries, seriesNames, carouselOffset, containerWidth, fontSize]);
}; 