import { useReducer, useEffect } from 'react';
import { DataSeries } from '../../../../core/models/DataTypes';
import { DataPoint, Series } from '../types';
import { ChartSettings } from '../../../components/ChartSettingsModal';

// Central state interface
interface ChartState {
  // Data
  rawData: DataPoint[];
  rawSeries: Series[];
  rawDataSeries: DataSeries[];
  processedData: DataPoint[];
  processedSeries: Series[];
  
  // UI State
  gridSize: string;
  containerDimensions: { width: number; height: number };
  isDimensionsStable: boolean;
  
  // Series Management
  seriesNames: {[key: string]: string};
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  editingSeries: string | null;
  
  // Legend State
  carouselOffset: number;
  legendHeight: number;
  shouldShowLegend: boolean;
  
  // Title State
  chartTitle: string;
  isEditingTitle: boolean;
  
  // Settings State
  settings: ChartSettings;
}

// Action types
type ChartAction = 
  | { type: 'SET_RAW_DATA'; payload: { data: DataPoint[]; series: Series[]; dataSeries: DataSeries[] } }
  | { type: 'SET_GRID_SIZE'; payload: string }
  | { type: 'SET_CONTAINER_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'SET_DIMENSIONS_STABLE'; payload: boolean }
  | { type: 'UPDATE_SERIES_NAME'; payload: { seriesKey: string; name: string } }
  | { type: 'SET_SERIES_AXIS'; payload: { seriesKey: string; axis: 'y' | 'y2' } }
  | { type: 'SET_EDITING_SERIES'; payload: string | null }
  | { type: 'SET_CAROUSEL_OFFSET'; payload: number }
  | { type: 'SET_LEGEND_HEIGHT'; payload: number }
  | { type: 'SET_CHART_TITLE'; payload: string }
  | { type: 'SET_EDITING_TITLE'; payload: boolean }
  | { type: 'SET_SETTINGS'; payload: ChartSettings }
  | { type: 'PROCESS_DATA' }
  | { type: 'CALCULATE_LEGEND' };

// Initial state
const initialState: ChartState = {
  rawData: [],
  rawSeries: [],
  rawDataSeries: [],
  processedData: [],
  processedSeries: [],
  gridSize: '3x3',
  containerDimensions: { width: 0, height: 0 },
  isDimensionsStable: false,
  seriesNames: {},
  seriesAxisAssignment: {},
  editingSeries: null,
  carouselOffset: 0,
  legendHeight: 30,
  shouldShowLegend: true,
  chartTitle: 'Line Chart',
  isEditingTitle: false,
  settings: {
    showGrid: true,
    showTooltip: true,
    colors: {}
  }
};

// Pure data processing functions (extracted from hooks)
const processChartData = (state: ChartState): { processedData: DataPoint[]; processedSeries: Series[] } => {
  if (state.rawDataSeries.length === 0) {
    return { processedData: state.rawData, processedSeries: state.rawSeries };
  }

  const responsiveSettings = getResponsiveSettings(state.gridSize);
  
  // Same logic as useChartData but pure function
  const dailySeries = state.rawDataSeries.filter(s => s.frequency === 'daily');
  const monthlyAndOtherSeries = state.rawDataSeries.filter(s => s.frequency !== 'daily');
  
  const allDates = new Set<string>();
  
  // Sample daily series
  dailySeries.forEach(series => {
    const seriesDates = series.dataPoints.map((point: any) => point.date);
    const sampledSeriesDates = seriesDates.filter((_: any, index: number) => 
      index % responsiveSettings.sampleRate === 0
    );
    sampledSeriesDates.forEach((date: string) => allDates.add(date));
  });
  
  // Keep all non-daily data
  monthlyAndOtherSeries.forEach(series => {
    series.dataPoints.forEach((point: any) => allDates.add(point.date));
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  const processedData = sortedDates.map(date => {
    const point: DataPoint = { date };
    state.rawDataSeries.forEach(series => {
      const dataPoint = series.dataPoints.find((dp: any) => dp.date === date);
      if (dataPoint) {
        point[series.id] = dataPoint.value;
      }
    });
    return point;
  });

  const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const processedSeries = state.rawDataSeries.map((series, index) => ({
    id: series.id,
    name: series.name,
    dataKey: series.id,
    color: colors[index % colors.length]
  }));

  return { processedData, processedSeries };
};

const getResponsiveSettings = (gridSize: string) => {
  const settings = {
    '1x1': { sampleRate: 2 },
    '2x2': { sampleRate: 3 },
    '3x3': { sampleRate: 5 },
    '4x4': { sampleRate: 7 },
    '5x5': { sampleRate: 10 }
  };
  return settings[gridSize as keyof typeof settings] || settings['3x3'];
};

const calculateLegendHeight = (state: ChartState): number => {
  if (!state.shouldShowLegend || state.processedSeries.length === 0) return 0;
  
  const gridBasedHeights = {
    '1x1': 36,
    '2x2': 32,
    '3x3': 28,
    '4x4': 24,
    '5x5': 20
  };
  
  return gridBasedHeights[state.gridSize as keyof typeof gridBasedHeights] || 28;
};

// Reducer function
const chartReducer = (state: ChartState, action: ChartAction): ChartState => {
  switch (action.type) {
    case 'SET_RAW_DATA':
      return {
        ...state,
        rawData: action.payload.data,
        rawSeries: action.payload.series,
        rawDataSeries: action.payload.dataSeries
      };
      
    case 'SET_GRID_SIZE':
      return {
        ...state,
        gridSize: action.payload,
        carouselOffset: 0 // Reset carousel when grid changes
      };
      
    case 'SET_CONTAINER_DIMENSIONS':
      if (
        state.containerDimensions.width === action.payload.width &&
        state.containerDimensions.height === action.payload.height
      ) {
        return state;
      }
      return {
        ...state,
        containerDimensions: action.payload
      };
      
    case 'SET_DIMENSIONS_STABLE':
      if (state.isDimensionsStable === action.payload) {
        return state;
      }
      return {
        ...state,
        isDimensionsStable: action.payload
      };
      
    case 'UPDATE_SERIES_NAME':
      return {
        ...state,
        seriesNames: {
          ...state.seriesNames,
          [action.payload.seriesKey]: action.payload.name
        }
      };
      
    case 'SET_SERIES_AXIS':
      return {
        ...state,
        seriesAxisAssignment: {
          ...state.seriesAxisAssignment,
          [action.payload.seriesKey]: action.payload.axis
        }
      };
      
    case 'SET_EDITING_SERIES':
      return {
        ...state,
        editingSeries: action.payload
      };
      
    case 'SET_CAROUSEL_OFFSET':
      return {
        ...state,
        carouselOffset: action.payload
      };
      
    case 'SET_LEGEND_HEIGHT':
      if (state.legendHeight === action.payload) {
        return state; // Bail out if height hasn't changed
      }
      return {
        ...state,
        legendHeight: action.payload
      };
      
    case 'SET_CHART_TITLE':
      return {
        ...state,
        chartTitle: action.payload
      };
      
    case 'SET_EDITING_TITLE':
      return {
        ...state,
        isEditingTitle: action.payload
      };
      
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload
      };
      
    case 'PROCESS_DATA': {
      const { processedData, processedSeries } = processChartData(state);
      
      // Initialize axis assignments for new series
      const newAxisAssignments = { ...state.seriesAxisAssignment };
      processedSeries.forEach(series => {
        if (!newAxisAssignments[series.dataKey]) {
          newAxisAssignments[series.dataKey] = 'y';
        }
      });
      
      // Initialize series names
      const newSeriesNames = { ...state.seriesNames };
      processedSeries.forEach(series => {
        if (!newSeriesNames[series.dataKey]) {
          newSeriesNames[series.dataKey] = series.name;
        }
      });
      
      // Initialize series colors using the actual colors assigned to the series
      const newColors = { ...state.settings.colors };
      processedSeries.forEach((series) => {
        if (!newColors[series.dataKey]) {
          // Use the color that was actually assigned to the series in processChartData
          newColors[series.dataKey] = series.color || '#6366f1';
        }
      });
      
      return {
        ...state,
        processedData,
        processedSeries,
        seriesAxisAssignment: newAxisAssignments,
        seriesNames: newSeriesNames,
        settings: {
          ...state.settings,
          colors: newColors
        }
      };
    }
    
    case 'CALCULATE_LEGEND':
      return {
        ...state,
        legendHeight: calculateLegendHeight(state)
      };
      
    default:
      return state;
  }
};

// Main hook
export const useChartState = (initialProps: {
  data?: DataPoint[];
  series?: Series[];
  dataSeries?: DataSeries[];
  gridSize?: string;
}) => {
  const [state, dispatch] = useReducer(chartReducer, {
    ...initialState,
    rawData: initialProps.data || [],
    rawSeries: initialProps.series || [],
    rawDataSeries: initialProps.dataSeries || [],
    gridSize: initialProps.gridSize || '3x3'
  });

  // Auto-process data when raw data changes
  useEffect(() => {
    dispatch({ type: 'PROCESS_DATA' });
  }, [state.rawData, state.rawSeries, state.rawDataSeries, state.gridSize]);

  // Auto-calculate legend when relevant state changes
  useEffect(() => {
    dispatch({ type: 'CALCULATE_LEGEND' });
  }, [state.processedSeries, state.gridSize, state.shouldShowLegend]);

  return { state, dispatch };
}; 