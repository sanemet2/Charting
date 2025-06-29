import { useMemo } from 'react';
import { DataSeries } from '../../../../core/models/DataTypes';
import { DataPoint, Series } from '../types';

interface UseChartDataProps {
  data: DataPoint[];
  series: Series[];
  dataSeries: DataSeries[];
  gridSize: string;
}

interface UseChartDataReturn {
  processedData: DataPoint[];
  processedSeries: Series[];
}

// Responsive settings helper (will be moved to its own hook later)
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

export const useChartData = ({
  data,
  series,
  dataSeries,
  gridSize
}: UseChartDataProps): UseChartDataReturn => {
  
  // Convert DataSeries to chart format with frequency-aware processing
  const processedData = useMemo(() => {
    if (dataSeries.length === 0) return data;
    
    const currentResponsiveSettings = getResponsiveSettings(gridSize);
    
    console.log('🔍 FREQUENCY-AWARE DEBUG: Starting data processing', {
      seriesCount: dataSeries.length,
      seriesFrequencies: dataSeries.map(s => ({ id: s.id, name: s.name, frequency: s.frequency, pointCount: s.dataPoints.length }))
    });
    
    // Separate series by frequency for different processing strategies
    const dailySeries = dataSeries.filter(s => s.frequency === 'daily');
    const monthlyAndOtherSeries = dataSeries.filter(s => s.frequency !== 'daily');
    
    // Collect all unique dates, but handle frequencies differently
    const allDates = new Set<string>();
    
    // For daily series: Sample them for performance
    dailySeries.forEach(series => {
      const seriesDates = series.dataPoints.map((point: any) => point.date);
      // Sample daily series based on grid size for performance
      const sampledSeriesDates = seriesDates.filter((_: any, index: number) => index % currentResponsiveSettings.sampleRate === 0);
      sampledSeriesDates.forEach((date: string) => allDates.add(date));
      
      console.log(`🔍 DAILY SERIES PROCESSING: ${series.name}`, {
        totalPoints: seriesDates.length,
        sampledPoints: sampledSeriesDates.length,
        sampleRate: currentResponsiveSettings.sampleRate,
        firstFewSampled: sampledSeriesDates.slice(0, 5),
        lastFewSampled: sampledSeriesDates.slice(-5)
      });
    });
    
    // For monthly/quarterly/yearly series: Keep ALL data points (no sampling)
    monthlyAndOtherSeries.forEach(series => {
      series.dataPoints.forEach((point: any) => allDates.add(point.date));
      
      console.log(`🔍 NON-DAILY SERIES PROCESSING: ${series.name}`, {
        frequency: series.frequency,
        totalPoints: series.dataPoints.length,
        allPointsKept: true,
        dateRange: series.dataPoints.length > 0 ? {
          first: series.dataPoints[0].date,
          last: series.dataPoints[series.dataPoints.length - 1].date
        } : 'NO DATA'
      });
    });
    
    // Sort all collected dates
    const sortedDates = Array.from(allDates).sort();
    
    console.log('🔍 FREQUENCY-AWARE DEBUG: Final date processing', {
      totalUniqueDates: sortedDates.length,
      dateRange: sortedDates.length > 0 ? {
        first: sortedDates[0],
        last: sortedDates[sortedDates.length - 1]
      } : 'NO DATES',
      dailySeriesCount: dailySeries.length,
      nonDailySeriesCount: monthlyAndOtherSeries.length
    });
    
    // Create merged data structure with all preserved dates
    const processedData = sortedDates.map(date => {
      const point: DataPoint = { date };
      dataSeries.forEach(series => {
        const dataPoint = series.dataPoints.find((dp: any) => dp.date === date);
        if (dataPoint) {
          point[series.id] = dataPoint.value;
        }
      });
      return point;
    });
    
    // Debug: Check data availability for each series
    dataSeries.forEach(series => {
      const availableData = processedData.filter(p => p[series.id] != null);
      console.log(`🔍 SERIES DATA AVAILABILITY: ${series.name}`, {
        frequency: series.frequency,
        originalDataPoints: series.dataPoints.length,
        availableInProcessed: availableData.length,
        dataLossPercentage: series.dataPoints.length > 0 ? 
          ((series.dataPoints.length - availableData.length) / series.dataPoints.length * 100).toFixed(1) + '%' : '0%',
        sampleValues: availableData.slice(0, 5).map(p => ({ date: p.date, value: p[series.id] }))
      });
    });
    
    return processedData;
  }, [dataSeries, data, gridSize]);

  // Convert DataSeries to series format
  const processedSeries = useMemo(() => {
    if (dataSeries.length === 0) return series;
    
    const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    return dataSeries.map((series, index) => ({
      name: series.name,
      dataKey: series.id,
      color: colors[index % colors.length]
    }));
  }, [dataSeries, series]);

  return {
    processedData,
    processedSeries
  };
}; 