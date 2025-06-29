import { useCallback, useMemo } from 'react';
import { DataSeries } from '../../../../core/models/DataTypes';
import { DataPoint, Series } from '../types';

// Action creators hook - provides clean API for updating chart state
export const useChartActions = (dispatch: React.Dispatch<any>) => {
  
  const setRawData = useCallback((data: DataPoint[], series: Series[], dataSeries: DataSeries[]) => {
    dispatch({ type: 'SET_RAW_DATA', payload: { data, series, dataSeries } });
  }, [dispatch]);

  const setGridSize = useCallback((gridSize: string) => {
    dispatch({ type: 'SET_GRID_SIZE', payload: gridSize });
  }, [dispatch]);

  const setContainerDimensions = useCallback((width: number, height: number) => {
    dispatch({ type: 'SET_CONTAINER_DIMENSIONS', payload: { width, height } });
  }, [dispatch]);

  const setDimensionsStable = useCallback((stable: boolean) => {
    dispatch({ type: 'SET_DIMENSIONS_STABLE', payload: stable });
  }, [dispatch]);

  const updateSeriesName = useCallback((seriesKey: string, name: string) => {
    dispatch({ type: 'UPDATE_SERIES_NAME', payload: { seriesKey, name } });
  }, [dispatch]);

  const setSeriesAxis = useCallback((seriesKey: string, axis: 'y' | 'y2') => {
    dispatch({ type: 'SET_SERIES_AXIS', payload: { seriesKey, axis } });
  }, [dispatch]);

  const toggleSeriesAxis = useCallback((seriesKey: string, currentAxis: 'y' | 'y2') => {
    const newAxis = currentAxis === 'y2' ? 'y' : 'y2';
    dispatch({ type: 'SET_SERIES_AXIS', payload: { seriesKey, axis: newAxis } });
  }, [dispatch]);

  const setEditingSeries = useCallback((seriesKey: string | null) => {
    dispatch({ type: 'SET_EDITING_SERIES', payload: seriesKey });
  }, [dispatch]);

  const setCarouselOffset = useCallback((offset: number) => {
    dispatch({ type: 'SET_CAROUSEL_OFFSET', payload: offset });
  }, [dispatch]);

  const setLegendHeight = useCallback((height: number) => {
    dispatch({ type: 'SET_LEGEND_HEIGHT', payload: height });
  }, [dispatch]);

  const nextCarouselPage = useCallback((maxVisibleItems: number, totalItems: number) => {
    dispatch({ 
      type: 'SET_CAROUSEL_OFFSET', 
      payload: (currentOffset: number) => {
        const next = currentOffset + 1;
        const maxOffset = Math.max(0, totalItems - maxVisibleItems);
        return next > maxOffset ? 0 : next;
      }
    });
  }, [dispatch]);

  const setChartTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_CHART_TITLE', payload: title });
  }, [dispatch]);

  const setEditingTitle = useCallback((editing: boolean) => {
    dispatch({ type: 'SET_EDITING_TITLE', payload: editing });
  }, [dispatch]);

  return useMemo(() => ({
    // Data actions
    setRawData,
    setGridSize,
    
    // Container actions
    setContainerDimensions,
    setDimensionsStable,
    
    // Series actions
    updateSeriesName,
    setSeriesAxis,
    toggleSeriesAxis,
    setEditingSeries,
    
    // Legend actions
    setCarouselOffset,
    setLegendHeight,
    nextCarouselPage,
    
    // Title actions
    setChartTitle,
    setEditingTitle
  }), [
    dispatch, 
    setRawData, 
    setGridSize, 
    setContainerDimensions, 
    setDimensionsStable, 
    updateSeriesName, 
    setSeriesAxis, 
    toggleSeriesAxis, 
    setEditingSeries, 
    setCarouselOffset,
    setLegendHeight,
    nextCarouselPage, 
    setChartTitle, 
    setEditingTitle
  ]);
}; 