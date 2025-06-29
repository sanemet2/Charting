import { useMemo } from 'react';
import { DataPoint, Series } from '../types';
import { ChartSettings } from '../../../components/ChartSettingsModal';
import { debug, debugCategories } from '../utils/debug';
import { measureText } from '../utils/measureText';

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

interface UsePlotlyConfigProps {
  processedData: DataPoint[];
  processedSeries: Series[];
  seriesNames: {[key: string]: string};
  settings: ChartSettings;
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  responsiveSettings: ResponsiveSettings;
}

interface UsePlotlyConfigReturn {
  plotlyData: any[];
  plotlyLayout: any;
  plotlyConfig: any;
  hasLeftAxisData: boolean;
  hasRightAxisData: boolean;
}

export const usePlotlyConfig = ({
  processedData,
  processedSeries,
  seriesNames,
  settings,
  seriesAxisAssignment,
  responsiveSettings
}: UsePlotlyConfigProps): UsePlotlyConfigReturn => {

  // Helper function to get the actual trace color for a series
  const getSeriesColor = (s: any, index: number) => {
    if (s.dataKey === 'cpi-yoy') return '#ff0000';
    if (s.dataKey === 'unemployment-rate') return '#ff0000';
    return s.color || (index === 0 ? settings.colors.primary : settings.colors.secondary);
  };

  // Convert data to Plotly format
  const plotlyData = useMemo(() => {
    if (processedData.length === 0 || processedSeries.length === 0) return [];

    const traces = processedSeries.map((s, index) => {
      const xData = processedData.map(d => d.date);
      const yData = processedData.map(d => d[s.dataKey] as number);
      
      const trace = {
        x: xData,
        y: yData,
        type: 'scatter' as const,
        mode: (s.dataKey === 'unemployment-rate' || s.dataKey === 'cpi-yoy') ? 'lines+markers' as const : 'lines' as const,
        name: seriesNames[s.dataKey] || s.name,
        yaxis: seriesAxisAssignment[s.dataKey] || 'y',
        line: {
          color: getSeriesColor(s, index),
          width: s.dataKey === 'cpi-yoy' ? 6 : 
                 s.dataKey === 'unemployment-rate' ? 6 : 
                 3
        },
        connectgaps: false,
        ...(s.dataKey === 'unemployment-rate' || s.dataKey === 'cpi-yoy' ? {
          marker: {
            size: 10,
            color: getSeriesColor(s, index),
            symbol: 'circle',
            line: { width: 1, color: '#ffffff' }
          }
        } : {}),
        hovertemplate: `<b>%{fullData.name}</b><br>` +
                       `Date: %{x}<br>` +
                       `Value: %{y:,.0f}<br>` +
                       `<extra></extra>`,
        legendgroup: s.dataKey,
        showlegend: false,
        visible: true
      };
      
      debug(debugCategories.PLOTLY_CONFIG, {
        message: `Trace creation for ${s.name}`,
        dataKey: s.dataKey,
        assignedAxis: seriesAxisAssignment[s.dataKey],
        finalTraceAxis: trace.yaxis,
        dataLength: trace.y.length
      });
      
      return trace;
    });

    // Force both axes to exist by adding invisible traces when needed
    const hasLeftAxisData = traces.some(trace => !trace.yaxis || trace.yaxis === 'y');
    const hasRightAxisData = traces.some(trace => trace.yaxis === 'y2');
    
    // If there is no data associated with the left axis we add an invisible
    // placeholder trace that is *explicitly* mapped to `y` so Plotly will still
    // render the axis line and grid. The trace is hidden from both the canvas
    // and the legend by using `visible: false` and an empty `name`. We rely on
    // the empty name so that the downstream `hasLeftAxisData` calculation (which
    // explicitly ignores traces whose `name` is an empty string) continues to
    // behave as before – i.e. the application logic still treats the axis as
    // having **no** real data series while Plotly believes an axis exists and
    // therefore draws it.
    if (!hasLeftAxisData) {
      traces.push({
        x: processedData.length > 0 ? [processedData[0].date] : [''],
        y: [0],
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y',
        line: { color: 'rgba(0,0,0,0)', width: 0 }, // fully transparent
        hovertemplate: '',
        legendgroup: '',
        connectgaps: false,
        showlegend: false,
        visible: false,
        name: '' // <-- Ensures downstream logic still marks hasLeftAxisData = false
      });
    }
    
    return traces;
  }, [processedData, processedSeries, seriesNames, settings.colors, seriesAxisAssignment]);

  // Check which axes have data to ensure proper visibility (excluding invisible traces)
  const hasLeftAxisData = plotlyData.some(trace => 
    (!trace.yaxis || trace.yaxis === 'y') && trace.name !== ''
  );
  const hasRightAxisData = plotlyData.some(trace => 
    trace.yaxis === 'y2' && trace.name !== ''
  );

  debug(debugCategories.PLOTLY_CONFIG, {
    message: 'Axis data debug',
    hasLeftAxisData,
    hasRightAxisData,
    plotlyDataCount: plotlyData.length
  });

  // 🔧 DYNAMIC MARGINS: Calculate margins based on axis label widths
  const dynamicMargins = useMemo(() => {
    const font = `${responsiveSettings.fontSize}px Arial, sans-serif`;
    const TICK_PADDING = 20; // Extra space for tick marks and general padding

    let leftMargin = responsiveSettings.margin.l;
    let rightMargin = responsiveSettings.margin.r;

    // Helper to format numbers with commas
    const formatter = new Intl.NumberFormat('en-US');

    // Calculate left margin
    if (hasLeftAxisData) {
      const leftTraces = plotlyData.filter(t => !t.yaxis || t.yaxis === 'y');
      const allLeftYValues = leftTraces.flatMap(t => t.y || []).filter(v => v !== null);
      if (allLeftYValues.length > 0) {
        const min = Math.min(...allLeftYValues);
        const max = Math.max(...allLeftYValues);
        // Find the value with the largest magnitude (absolute value) to estimate the widest label
        const widestLabelValue = Math.abs(min) > Math.abs(max) ? min : max;
        const widestLabelWidth = measureText(formatter.format(widestLabelValue), font);
        leftMargin = widestLabelWidth + TICK_PADDING;
      }
    }

    // Calculate right margin
    if (hasRightAxisData) {
      const rightTraces = plotlyData.filter(t => t.yaxis === 'y2');
      const allRightYValues = rightTraces.flatMap(t => t.y || []).filter(v => v !== null);
      if (allRightYValues.length > 0) {
        const min = Math.min(...allRightYValues);
        const max = Math.max(...allRightYValues);
        // Find the value with the largest magnitude (absolute value) to estimate the widest label
        const widestLabelValue = Math.abs(min) > Math.abs(max) ? min : max;
        const widestLabelWidth = measureText(formatter.format(widestLabelValue), font);
        rightMargin = widestLabelWidth + TICK_PADDING;
      }
    }
    
    debug(debugCategories.PLOTLY_CONFIG, {
      message: 'Dynamic margin calculation',
      leftMargin,
      rightMargin,
      font
    });

    return { l: leftMargin, r: rightMargin };
  }, [plotlyData, hasLeftAxisData, hasRightAxisData, responsiveSettings.fontSize]);

  // Calculate data range for right axis to sync gridlines when no left axis data
  const rightAxisDataRange = useMemo(() => {
    if (!hasRightAxisData || hasLeftAxisData) {
      debug(debugCategories.PLOTLY_CONFIG, { message: 'Right axis range - skipping calculation', hasRightAxisData, hasLeftAxisData });
      return undefined;
    }
    
    const rightAxisTraces = plotlyData.filter(trace => trace.yaxis === 'y2');
    if (rightAxisTraces.length === 0) {
      debug(debugCategories.PLOTLY_CONFIG, { message: 'Right axis range - no traces found' });
      return undefined;
    }
    
    const allYValues = rightAxisTraces.flatMap(trace => trace.y || []).filter(v => v != null && !isNaN(v));
    if (allYValues.length === 0) {
      debug(debugCategories.PLOTLY_CONFIG, { message: 'Right axis range - no valid Y values' });
      return undefined;
    }
    
    const min = Math.min(...allYValues);
    const max = Math.max(...allYValues);
    const padding = (max - min) * 0.1; // 10% padding
    const calculatedRange = [Math.max(0, min - padding), max + padding];
    
    debug(debugCategories.PLOTLY_CONFIG, {
      message: 'Right axis range calculated',
      min,
      max,
      calculatedRange
    });
    
    return calculatedRange;
  }, [plotlyData, hasLeftAxisData, hasRightAxisData]);

  // Plotly layout configuration with responsive settings
  const plotlyLayout = useMemo(() => {
    const leftAxisRange = hasLeftAxisData ? undefined : (rightAxisDataRange || [0, 100]);
    debug(debugCategories.PLOTLY_CONFIG, {
      message: 'Left axis range debug',
      hasLeftAxisData,
      hasRightAxisData,
      leftAxisRange
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
        showgrid: settings.showGrid,
        gridcolor: '#f0f0f0',
        tickformat: '~s',
        side: 'left',
        nticks: responsiveSettings.nticks,
        tickfont: { 
          size: responsiveSettings.fontSize,
          color: hasLeftAxisData ? '#000000' : 'rgba(0,0,0,0)'
        },
        showline: true,
        linewidth: 1,
        linecolor: '#d1d5db',
        mirror: true,
        automargin: false,
        showticklabels: hasLeftAxisData,
        ticks: hasLeftAxisData ? 'outside' : '',
        fixedrange: false,
        zeroline: false,
        visible: true,
        type: 'linear',
        autorange: hasLeftAxisData,
        range: leftAxisRange,
        domain: [0, 1],
        rangemode: 'tozero'
      },
      yaxis2: {
        title: { 
          text: hasRightAxisData ? (settings.axisLabels.yAxis || '') : '',
          font: { size: responsiveSettings.fontSize }
        },
        showgrid: false,
        gridcolor: '#f0f0f0',
        tickformat: '~s',
        side: 'right',
        overlaying: 'y',
        nticks: responsiveSettings.nticks,
        tickfont: { size: responsiveSettings.fontSize },
        showline: true,
        linewidth: 1,
        linecolor: '#d1d5db',
        mirror: false,
        automargin: false,
        showticklabels: hasRightAxisData,
        ticks: hasRightAxisData ? 'outside' : '',
        fixedrange: false,
        visible: true,
        type: 'linear',
        autorange: hasRightAxisData ? true : false,
        range: hasRightAxisData ? undefined : [0, 1],
        domain: [0, 1],
        rangemode: hasRightAxisData ? 'tozero' : 'normal'
      },
      hovermode: settings.showTooltip ? ('closest' as const) : (false as const),
      dragmode: 'pan' as const,
      scrollZoom: true,
      margin: {
        ...responsiveSettings.margin,
        l: dynamicMargins.l,
        r: dynamicMargins.r,
        b: Math.max(10, responsiveSettings.margin.b - 20) // Reduce bottom margin by 20px, minimum 10px
      },
      autosize: true,
      width: undefined,
      height: undefined,
      showlegend: false,
      uirevision: 'constant',
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Arial, sans-serif', size: responsiveSettings.fontSize }
    };
  }, [settings, responsiveSettings, hasLeftAxisData, hasRightAxisData, rightAxisDataRange, dynamicMargins]);

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
    useResizeHandler: true, // Ensure resize handling works

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

  return {
    plotlyData,
    plotlyLayout,
    plotlyConfig,
    hasLeftAxisData,
    hasRightAxisData
  };
}; 