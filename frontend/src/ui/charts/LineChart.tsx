import React, { useState, useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import './ChartStyles.css';
import ChartSettingsModal, { ChartSettings } from '../components/ChartSettingsModal';
import { DataSeries } from '../../core/models/DataTypes';

interface DataPoint {
  date: string;
  [key: string]: string | number; // Allow dynamic series names
}

interface Series {
  name: string;
  dataKey: string;
  color?: string;
}

interface LineChartProps {
  id: string;
  onClose: (id: string) => void;
  data?: DataPoint[];
  series?: Series[];
  dataSeries?: DataSeries[];
  isDropTarget?: boolean;
  gridSize?: string;
}

const defaultSettings: ChartSettings = {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  axisLabels: {
    xAxis: '',
    yAxis: ''
  },
  colors: {
    primary: '#6366f1',
    secondary: '#f43f5e'
  }
};

const LineChart: React.FC<LineChartProps> = ({ 
  id, 
  onClose, 
  data = [], 
  series = [], 
  dataSeries = [],
  isDropTarget = false,
  gridSize = '3x3'
}) => {
  const [chartTitle, setChartTitle] = useState('Line Chart');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [seriesNames, setSeriesNames] = useState<{[key: string]: string}>({});
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChartSettings>(defaultSettings);
  const [seriesAxisAssignment, setSeriesAxisAssignment] = useState<{[key: string]: 'y' | 'y2'}>({});
  const [carouselOffset, setCarouselOffset] = useState(0);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedSeriesNamesRef = useRef(false);

  // Comprehensive responsive system based on grid size
  const getResponsiveSettings = (gridSize: string) => {
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
        fontSize: 12, titleSize: 14, margin: { l: 50, r: 50, t: 10, b: 65 },
        nticks: 6, dateFormat: '%b %y', sampleRate: 5
      },
      '4x4': { 
        fontSize: 10, titleSize: 12, margin: { l: 40, r: 40, t: 8, b: 60 },
        nticks: 5, dateFormat: '%b %y', sampleRate: 7
      },
      '5x5': { 
        fontSize: 8, titleSize: 10, margin: { l: 35, r: 35, t: 8, b: 55 },
        nticks: 4, dateFormat: '%b %y', sampleRate: 10
      }
    };
    return settings[gridSize as keyof typeof settings] || settings['3x3'];
  };

  const responsiveSettings = useMemo(() => getResponsiveSettings(gridSize), [gridSize]);

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
      const seriesDates = series.dataPoints.map(point => point.date);
      // Sample daily series based on grid size for performance
      const sampledSeriesDates = seriesDates.filter((_, index) => index % currentResponsiveSettings.sampleRate === 0);
      sampledSeriesDates.forEach(date => allDates.add(date));
      
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
      series.dataPoints.forEach(point => allDates.add(point.date));
      
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
        const dataPoint = series.dataPoints.find(dp => dp.date === date);
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

  // Track if we've done initial auto-assignment
  const hasAutoAssignedRef = useRef(false);
  
  // Compute initial axis assignments based on scale differences
  const initialAxisAssignments = useMemo(() => {
    // Don't run auto-assignment if we already have manual assignments
    if (hasAutoAssignedRef.current) {
      console.log('🔍 AUTO-ASSIGN DEBUG: Already assigned, skipping to preserve manual overrides');
      return {};
    }
    
    if (processedSeries.length <= 1 || processedData.length === 0) {
      console.log('🔍 AUTO-ASSIGN DEBUG: Skipping - not enough series or data', {
        seriesCount: processedSeries.length,
        dataCount: processedData.length
      });
      return {};
    }
    
    const seriesRanges = processedSeries.map(s => {
      const values = processedData.map(d => d[s.dataKey] as number).filter(v => v != null);
      if (values.length === 0) return { dataKey: s.dataKey, name: s.name, min: 0, max: 0, range: 0 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { dataKey: s.dataKey, name: s.name, min, max, range: max - min };
    });

    console.log('🔍 AUTO-ASSIGN DEBUG: Series ranges calculated:', seriesRanges);

    // If series have very different scales (one range is 10x larger than another), auto-assign to different axes
    const shouldAutoAssign = seriesRanges.some((range1, i) => 
      seriesRanges.some((range2, j) => {
        if (i !== j && range1.range > 0 && range2.range > 0) {
          const ratio1 = range1.range / range2.range;
          const ratio2 = range2.range / range1.range;
          const shouldAssign = ratio1 > 10 || ratio2 > 10;
          console.log(`🔍 AUTO-ASSIGN DEBUG: Comparing ${range1.name} vs ${range2.name}:`, {
            range1: range1.range,
            range2: range2.range,
            ratio1: ratio1.toFixed(2),
            ratio2: ratio2.toFixed(2),
            shouldAssign
          });
          return shouldAssign;
        }
        return false;
      })
    );

    console.log('🔍 AUTO-ASSIGN DEBUG: Should auto-assign?', shouldAutoAssign);

    if (shouldAutoAssign) {
      const assignment: {[key: string]: 'y' | 'y2'} = {};
      
      // Smart scale-based grouping algorithm
      // Step 1: Sort series by range size
      const sortedRanges = [...seriesRanges].sort((a, b) => b.range - a.range);
      console.log('🔍 SMART-ASSIGN DEBUG: Sorted by range:', sortedRanges.map(r => ({ 
        name: r.name, 
        range: r.range, 
        min: r.min, 
        max: r.max 
      })));
      
      // Step 2: Group series with similar scales (within 10x of each other)
      const groups: typeof seriesRanges[] = [];
      
      sortedRanges.forEach(range => {
        // Find a group where this series fits (within 10x range)
        let assignedToGroup = false;
        for (const group of groups) {
          const groupRepresentative = group[0];
          const ratio1 = range.range / groupRepresentative.range;
          const ratio2 = groupRepresentative.range / range.range;
          
                     // If ranges are within 3x of each other, add to this group (stricter grouping)
           if (ratio1 <= 3 && ratio2 <= 3) {
            group.push(range);
            assignedToGroup = true;
            console.log(`🔍 SMART-ASSIGN DEBUG: Added ${range.name} to group with ${groupRepresentative.name} (ratio: ${ratio1.toFixed(2)})`);
            break;
          }
        }
        
        // If no suitable group found, create new group
        if (!assignedToGroup) {
          groups.push([range]);
          console.log(`🔍 SMART-ASSIGN DEBUG: Created new group for ${range.name}`);
        }
      });
      
      console.log('🔍 SMART-ASSIGN DEBUG: Final groups:', groups.map((group, i) => ({
        groupIndex: i,
        axis: i % 2 === 0 ? 'y' : 'y2',
        series: group.map(r => ({ name: r.name, range: r.range }))
      })));
      
      // Step 3: Assign groups to axes (alternate between y and y2)
      groups.forEach((group, groupIndex) => {
        const axis = groupIndex % 2 === 0 ? 'y' : 'y2';
        group.forEach(range => {
          assignment[range.dataKey] = axis;
        });
      });
      
      console.log('🔍 SMART-ASSIGN DEBUG: Final assignment:', assignment);
      return assignment;
    }
    
    console.log('🔍 AUTO-ASSIGN DEBUG: No auto-assignment needed');
    return {};
  }, [processedSeries, processedData]);
  
  // Apply initial axis assignments ONLY ONCE (and don't override manual changes)
  useEffect(() => {
    console.log('🔍 AXIS APPLY DEBUG: useEffect triggered', {
      hasAutoAssigned: hasAutoAssignedRef.current,
      initialAssignments: initialAxisAssignments,
      currentAssignments: seriesAxisAssignment,
      seriesCount: processedSeries.length
    });
    
    if (hasAutoAssignedRef.current) {
      console.log('🔍 AXIS APPLY DEBUG: Already auto-assigned, skipping to preserve manual overrides');
      return;
    }
    
    if (Object.keys(initialAxisAssignments).length > 0) {
      console.log('🔍 AXIS APPLY DEBUG: Applying auto-assignments:', initialAxisAssignments);
      setSeriesAxisAssignment(initialAxisAssignments);
      hasAutoAssignedRef.current = true;
    } else if (processedSeries.length > 0 && Object.keys(seriesAxisAssignment).length === 0) {
      // If no auto-assignment needed, ensure all series have explicit axis assignments
      const defaultAssignments: {[key: string]: 'y' | 'y2'} = {};
      processedSeries.forEach((s) => {
        defaultAssignments[s.dataKey] = 'y'; // Default to left axis
      });
      console.log('🔍 AXIS APPLY DEBUG: Applying default assignments:', defaultAssignments);
      setSeriesAxisAssignment(defaultAssignments);
      hasAutoAssignedRef.current = true;
    }
  }, [initialAxisAssignments, processedSeries]); // Removed seriesAxisAssignment dependency to prevent loops

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (editingSeries && seriesInputRef.current) {
      seriesInputRef.current.focus();
      seriesInputRef.current.select();
    }
  }, [editingSeries]);

  // Helper function to get the actual trace color for a series
  const getSeriesColor = (s: any, index: number) => {
    if (s.dataKey === 'cpi-yoy') return '#ff0000';
    if (s.dataKey === 'unemployment-rate') return '#ff0000';
    return s.color || (index === 0 ? settings.colors.primary : settings.colors.secondary);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
  };

  const handleSeriesSubmit = (e: React.FormEvent, seriesKey: string) => {
    e.preventDefault();
    setEditingSeries(null);
  };

  const handleSettingsSave = (newSettings: ChartSettings) => {
    setSettings(newSettings);
  };

  // Convert data to Plotly format
  const plotlyData = useMemo(() => {
    if (processedData.length === 0 || processedSeries.length === 0) return [];

    const traces = processedSeries.map((s, index) => {
      const xData = processedData.map(d => d.date);
      const yData = processedData.map(d => d[s.dataKey] as number);
      
      // Debug logging for percentage/small value series
      if (s.dataKey === 'cpi-yoy' || s.dataKey === 'unemployment-rate' || s.name.includes('NFP') || s.name.includes('TCH')) {
        const validData = yData.filter(v => v != null && !isNaN(v));
        console.log('🔍 CPI DETAILED DEBUG: Data for CPI YOY Index:', {
          seriesName: s.name,
          dataKey: s.dataKey,
          assignedAxis: seriesAxisAssignment[s.dataKey],
          dataPoints: yData.slice(0, 10), // First 10 values
          datePoints: xData.slice(0, 10), // First 10 dates
          totalPoints: yData.length,
          validPoints: validData.length,
          minValue: validData.length > 0 ? Math.min(...validData) : 'NO DATA',
          maxValue: validData.length > 0 ? Math.max(...validData) : 'NO DATA',
          sampleValues: validData.slice(0, 15), // First 15 valid values
          allValidData: validData, // Show ALL valid data to see what's actually there
          rawProcessedData: processedData.slice(0, 5).map(d => ({ date: d.date, value: d[s.dataKey] }))
        });
        
        // Special debugging for unemployment rate scale issues
        if (s.dataKey === 'unemployment-rate') {
          console.log('🎯 UNEMPLOYMENT SCALE DEBUG:', {
            seriesName: s.name,
            assignedAxis: seriesAxisAssignment[s.dataKey],
            valueRange: validData.length > 0 ? {
              min: Math.min(...validData),
              max: Math.max(...validData),
              range: Math.max(...validData) - Math.min(...validData),
              average: validData.reduce((a, b) => a + b, 0) / validData.length
            } : 'NO DATA',
            allValues: validData, // Show every single unemployment value
            isSmallScale: validData.length > 0 && Math.max(...validData) < 100,
            axisAssignment: seriesAxisAssignment[s.dataKey],
            shouldBeVisible: validData.length > 0 && validData.some(v => v > 0)
          });
        }
      }
      
      const trace = {
        x: xData,
        y: yData,
      type: 'scatter' as const,
      mode: (s.dataKey === 'unemployment-rate' || s.dataKey === 'cpi-yoy') ? 'lines+markers' as const : 'lines' as const, // Add markers for small-scale data
      name: seriesNames[s.dataKey] || s.name,
      yaxis: seriesAxisAssignment[s.dataKey] || 'y', // Assign to primary or secondary axis
      line: {
        color: getSeriesColor(s, index),
        width: s.dataKey === 'cpi-yoy' ? 6 : // Extra thick for CPI
               s.dataKey === 'unemployment-rate' ? 6 : // Extra thick for unemployment
               2
      },
      marker: (s.dataKey === 'unemployment-rate' || s.dataKey === 'cpi-yoy') ? {
        size: 10, // Larger markers for small-scale data
        color: getSeriesColor(s, index),
        symbol: 'circle',
        line: { width: 1, color: '#ffffff' } // White border for visibility
      } : undefined, // Add visible markers for percentage data
      hovertemplate: `<b>%{fullData.name}</b><br>` +
                     `Date: %{x}<br>` +
                     `Value: %{y:,.0f}<br>` +
                     `<extra></extra>`,
              legendgroup: s.dataKey, // Group for legend management
        showlegend: true
      };
      
      // Debug logging for trace creation
      if (s.dataKey === 'cpi-yoy' || s.name.includes('NFP') || s.name.includes('TCH')) {
        const validData = trace.y.filter(v => v != null && !isNaN(v));
        console.log(`🔍 CPI TRACE VALUES: Creating trace for ${s.name}:`, {
          name: trace.name,
          yaxis: trace.yaxis,
          dataLength: trace.y.length,
          hasValidData: trace.y.some(v => v != null && !isNaN(v)),
          firstTenValues: trace.y.slice(0, 10),
          validDataCount: validData.length,
          minValue: validData.length > 0 ? Math.min(...validData) : 'NO DATA',
          maxValue: validData.length > 0 ? Math.max(...validData) : 'NO DATA',
          // Show actual numeric values to debug
          actualValues: validData.slice(0, 20).map(v => Number(v).toFixed(3))
        });
      } else {
        console.log(`🔍 TRACE DEBUG: Creating trace for ${s.name}:`, {
          name: trace.name,
          yaxis: trace.yaxis,
          dataLength: trace.y.length,
          hasValidData: trace.y.some(v => v != null && !isNaN(v)),
          firstFewValues: trace.y.slice(0, 5)
        });
      }
      
      return trace;
    });

    // Force both axes to exist by adding invisible traces when needed
    const hasLeftAxisData = traces.some(trace => !trace.yaxis || trace.yaxis === 'y');
    const hasRightAxisData = traces.some(trace => trace.yaxis === 'y2');

    console.log('🔍 INVISIBLE TRACE DEBUG:', {
      tracesCount: traces.length,
      hasLeftAxisData,
      hasRightAxisData,
      traceDetails: traces.map(t => ({ name: t.name, yaxis: t.yaxis, hasData: t.y.some(v => v != null && !isNaN(v)) }))
    });

    console.log('🔍 FINAL TRACES DEBUG:', {
      finalTracesCount: traces.length,
      finalTraceDetails: traces.map(t => ({ name: t.name, yaxis: t.yaxis, hasData: t.y.some(v => v != null && !isNaN(v)) }))
    });
    
    return traces;
  }, [processedData, processedSeries, seriesNames, settings.colors, seriesAxisAssignment]);

  // Check which axes have data to ensure proper visibility (excluding invisible traces)
  const hasLeftAxisData = plotlyData.some(trace => 
    (!trace.yaxis || trace.yaxis === 'y') && trace.name !== '' // Exclude invisible traces
  );
  const hasRightAxisData = plotlyData.some(trace => 
    trace.yaxis === 'y2' && trace.name !== '' // Exclude invisible traces
  );
  
  // Debug logging
  console.log('🔍 FINAL AXIS STATE:', {
    seriesAxisAssignment,
    hasLeftAxisData,
    hasRightAxisData,
    plotlyDataCount: plotlyData.length,
    plotlyData: plotlyData.map(d => ({ 
      name: d.name, 
      yaxis: d.yaxis, 
      pointCount: d.y?.length || 0,
      sampleY: d.y?.slice(0, 3) || [],
      yRange: d.y?.length > 0 ? [Math.min(...d.y.filter(v => v != null && !isNaN(v))), Math.max(...d.y.filter(v => v != null && !isNaN(v)))] : 'NO DATA',
      hasValidData: d.y?.some(v => v != null && !isNaN(v)) || false
    }))
  });

  // Custom tick formatting function
  const formatTick = (value: number): string => {
    const absValue = Math.abs(value);
    // For single or double digit numbers (1-99), show decimal
    if (absValue >= 1 && absValue < 100) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    // For everything else, no decimal
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Plotly layout configuration with responsive settings
  const plotlyLayout = useMemo(() => {
    // DEBUG: Log grid and axis settings first
    console.log('🔍 GRID DEBUG:', {
      showGrid: settings.showGrid,
      hasLeftAxisData,
      hasRightAxisData,
      leftAxisWillShowGrid: settings.showGrid,
      rightAxisWillShowGrid: false, // Always false to avoid overlap
      settingsObject: settings
    });
    
    return {
    title: {
      text: '',
      font: { size: responsiveSettings.titleSize }
    },
    xaxis: {
      title: { 
        text: settings.axisLabels.xAxis || '',
        font: { size: responsiveSettings.fontSize }
      },
      showgrid: settings.showGrid,
      gridcolor: '#f0f0f0',
      tickformat: responsiveSettings.dateFormat,
      tickangle: 0,
      tickfont: { size: responsiveSettings.fontSize },
      tickmode: 'auto',
      nticks: 6,
      showline: true,
      linewidth: 1,
      linecolor: '#d1d5db',
      mirror: true
    },
    yaxis: {
      title: { 
        text: hasLeftAxisData ? (settings.axisLabels.yAxis || '') : '',
        font: { size: responsiveSettings.fontSize }
      },
      showgrid: settings.showGrid, // Always show grid regardless of axis data
      gridcolor: '#f0f0f0',
      tickformat: ',.0f', // Default format
      tickformatstops: [
        { dtickrange: [null, 100], value: ',.1f' }, // 1-99: show decimal
        { dtickrange: [100, null], value: ',.0f' }  // 100+: no decimal
      ],
      side: 'left',
      nticks: responsiveSettings.nticks,
      tickfont: { size: responsiveSettings.fontSize },
      showline: true, // Always show the axis line for border
      linewidth: 1,
      linecolor: '#d1d5db',
      mirror: true, // Show on opposite side too for full border
      automargin: true,
      showticklabels: hasLeftAxisData, // Only show labels when there's data
      ticks: hasLeftAxisData ? 'outside' : '', // Only show ticks when there's data
      fixedrange: false,
      zeroline: false,
      // Force the axis to be visible and have a range even with no data
      visible: true,
      type: 'linear',
      autorange: hasLeftAxisData,
      range: hasLeftAxisData ? undefined : [0, 100] // Provide default range when no data
    },
    yaxis2: {
      title: { 
        text: hasRightAxisData ? (settings.axisLabels.yAxis || '') : '',
        font: { size: responsiveSettings.fontSize }
      },
      showgrid: false, // Avoid overlapping grids
      gridcolor: '#f0f0f0',
      tickformat: ',.1f', // Force decimal format for small values
      side: 'right',
      overlaying: 'y',
      nticks: responsiveSettings.nticks,
      tickfont: { size: responsiveSettings.fontSize },
      showline: true, // Always show the axis line for border
      linewidth: 1, // Normal line width
      linecolor: '#d1d5db', // Standard gray color like left axis
      mirror: false,
      automargin: true,
      showticklabels: hasRightAxisData, // Hide tick labels when no data
      ticks: hasRightAxisData ? 'outside' : '', // Hide ticks when no data
      fixedrange: false, // Allow interaction
      visible: true, // Force axis to be visible even without data
      type: 'linear',
      autorange: hasRightAxisData ? true : false,
      range: hasRightAxisData ? undefined : [0, 1] // Force a minimal range when no data
    },
    showlegend: false, // We'll use custom editable legend instead
    hovermode: settings.showTooltip ? ('closest' as const) : (false as const),
    dragmode: 'pan' as const,
    scrollZoom: true,
    margin: responsiveSettings.margin,
    autosize: true, // Re-enable autosize for proper container fitting
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Arial, sans-serif', size: responsiveSettings.fontSize }
  };
}, [settings, responsiveSettings, hasLeftAxisData, hasRightAxisData]);

  // Plotly configuration
  const plotlyConfig = useMemo(() => ({
    responsive: true, // Re-enable responsive for proper container fitting
    displayModeBar: false, // Hide the grey toolbar
    displaylogo: false,
    scrollZoom: true,
    doubleClick: 'autosize', // Re-enable autosize on double-click
    showTips: false, // Reduce clutter
    staticPlot: false,
    autosizable: true, // Re-enable automatic sizing
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 500,
      width: 700,
      scale: 1
    },
    plotlyServerURL: false, // Disable cloud features for performance
    editable: false
  } as any), []);

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

  const renderEmptyState = () => (
    <div className="chart-empty-state">
      <div className="empty-icon">📈</div>
      <h3>No Data Yet</h3>
      <p>Drag a data series from the Data Browser to visualize</p>
    </div>
  );

  return (
    <>
      <div className={`chart-container grid-${gridSize} ${isDropTarget ? 'drop-target' : ''}`}>
        <div className="chart-header">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} style={{ flex: 1 }}>
              <input
                ref={titleInputRef}
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="inline-edit-input title-edit"
              />
            </form>
          ) : (
            <h3 
              className="chart-title editable" 
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit"
            >
              {chartTitle}
            </h3>
          )}
          <div className="chart-actions">
            <button 
              className="chart-action" 
              title="Chart settings"
              onClick={() => setShowSettings(true)}
            >
              ⚙️
            </button>
            <button className="chart-action" onClick={() => onClose(id)} title="Close chart">✕</button>
          </div>
        </div>

        
        <div className={`chart-body ${processedData.length === 0 || processedSeries.length === 0 ? 'empty-state' : ''}`}>
          {processedData.length === 0 || processedSeries.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="plotly-chart-container">
                <Plot
                  key={`plot-${id}`}
                  data={plotlyData}
                  layout={plotlyLayout}
                  config={plotlyConfig}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
              {/* Inline Legend - Carousel System */}
              {settings.showLegend && processedSeries.length > 0 && (() => {
                const { hasOverflow, visibleItems, canScrollNext } = getLegendCarousel();
                console.log('Legend rendering:', { 
                  showLegend: settings.showLegend, 
                  seriesCount: processedSeries.length, 
                  hasOverflow, 
                  visibleItemsCount: visibleItems.length,
                  carouselOffset 
                });
                return (
                  <div className="chart-inline-legend">
                    <div 
                      className="legend-wrapper"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0px', // Reduced gap to bring button closer to legend
                        background: 'transparent',
                        padding: '8px 16px', // Added padding for breathing room
                        borderRadius: '0',
                        border: 'none',
                        minWidth: '360px' // Ensure adequate space for content
                      }}
                    >
                      {/* Container 1: Carousel viewport - shows only 2 items */}
                      <div 
                        className="legend-carousel-container"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px', // Generous spacing between legend items
                          overflow: 'hidden', // Hide overflow to maintain fixed width
                          justifyContent: 'flex-start',
                          transition: 'all 0.3s ease-in-out',
                          flexShrink: 0, // Prevent shrinking of legend items
                          width: '240px' // Fixed width to prevent button shifting
                        }}
                      >
                        {/* Only render the visible items */}
                        {visibleItems.map((s, index) => {
                          const originalIndex = processedSeries.findIndex(series => series.dataKey === s.dataKey);
                          return (
                            <div key={`${s.dataKey}-${index}`} className="legend-item">
                              <div 
                                className="legend-color" 
                                style={{ 
                                  backgroundColor: getSeriesColor(s, index) 
                                }}
                              ></div>
                              {editingSeries === s.dataKey ? (
                                <form onSubmit={(e) => handleSeriesSubmit(e, s.dataKey)} style={{ display: 'inline' }}>
                                  <input
                                    ref={seriesInputRef}
                                    type="text"
                                    value={seriesNames[s.dataKey] || s.name}
                                    onChange={(e) => setSeriesNames(prev => ({ ...prev, [s.dataKey]: e.target.value }))}
                                    onBlur={() => setEditingSeries(null)}
                                    className="inline-edit-input series-edit"
                                  />
                                </form>
                              ) : (
                                <span 
                                  className="legend-label editable"
                                  onClick={() => setEditingSeries(s.dataKey)}
                                  title={`${seriesNames[s.dataKey] || s.name} - Click to edit`}
                                >
                                  {seriesNames[s.dataKey] || s.name}
                                </span>
                              )}
                              <button
                                className="axis-toggle-btn"
                                onClick={() => {
                                  const newAxis = seriesAxisAssignment[s.dataKey] === 'y2' ? 'y' : 'y2';
                                  console.log(`🔍 MANUAL OVERRIDE: Moving ${s.name} to ${newAxis} axis`);
                                  setSeriesAxisAssignment(prev => ({
                                    ...prev,
                                    [s.dataKey]: newAxis
                                  }));
                                }}
                                title={`Switch to ${seriesAxisAssignment[s.dataKey] === 'y2' ? 'left' : 'right'} axis`}
                              >
                                {seriesAxisAssignment[s.dataKey] === 'y2' ? 'R' : 'L'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Container 2: Carousel "+" button */}
                      {canScrollNext && (
                        <button 
                          className="legend-carousel-next"
                          onClick={handleCarouselNext}
                          title="Click to see more series"
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            lineHeight: '1',
                            letterSpacing: '1px',
                            textIndent: '1px', // Shift just the text content left

                            width: '18px',
                            height: '18px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            boxShadow: 'none',
                            marginLeft: '6px' // Closer to the legend items
                          }}
                                                      onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                              // Removed scale transform to prevent centering shift
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                              // Removed scale transform to prevent centering shift
                            }}
                                                  >
                            <span style={{ transform: 'translateY(1px)', display: 'inline-block' }}>•••</span>
                          </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
      
      <ChartSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSettingsSave}
        chartType="line"
      />
    </>
  );
};

export default React.memo(LineChart); 