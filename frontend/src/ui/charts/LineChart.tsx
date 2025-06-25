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
  forceDisableAnimation?: boolean;
  gridSize?: string;
}

const defaultSettings: ChartSettings = {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  showDots: true,
  chartAnimation: true,
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
  forceDisableAnimation = false,
  gridSize = '3x3'
}) => {
  const [chartTitle, setChartTitle] = useState('Line Chart');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [seriesNames, setSeriesNames] = useState<{[key: string]: string}>({});
  const [editingSeries, setEditingSeries] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChartSettings>(defaultSettings);
  const [seriesAxisAssignment, setSeriesAxisAssignment] = useState<{[key: string]: 'y' | 'y2'}>({});
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedSeriesNamesRef = useRef(false);

  // Custom hook for grid resize handling - forces Plotly re-render on grid changes
  const useGridResize = (gridSize: string) => {
    const [resizeKey, setResizeKey] = useState(0);
    useEffect(() => {
      const timer = setTimeout(() => {
        setResizeKey(prev => prev + 1);
      }, 150); // Small delay to let CSS grid settle
      return () => clearTimeout(timer);
    }, [gridSize]);
    return resizeKey;
  };

  const resizeKey = useGridResize(gridSize);

  // Convert DataSeries to chart format
  const processedData = useMemo(() => {
    if (dataSeries.length === 0) return data;
    
    // Find all unique dates across all series
    const allDates = new Set<string>();
    dataSeries.forEach(series => {
      series.dataPoints.forEach(point => allDates.add(point.date));
    });
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    
    // Sample data to reduce density (every 5th point for better performance)
    const sampledDates = sortedDates.filter((_, index) => index % 5 === 0);
    
    // Create merged data structure
    return sampledDates.map(date => {
      const point: DataPoint = { date };
      dataSeries.forEach(series => {
        const dataPoint = series.dataPoints.find(dp => dp.date === date);
        if (dataPoint) {
          point[series.id] = dataPoint.value;
        }
      });
      return point;
    });
  }, [dataSeries, data]);

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
    if (processedSeries.length <= 1 || processedData.length === 0) return {};
    
    const seriesRanges = processedSeries.map(s => {
      const values = processedData.map(d => d[s.dataKey] as number).filter(v => v != null);
      if (values.length === 0) return { dataKey: s.dataKey, min: 0, max: 0, range: 0 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { dataKey: s.dataKey, min, max, range: max - min };
    });

    // If series have very different scales (one range is 10x larger than another), auto-assign to different axes
    const shouldAutoAssign = seriesRanges.some((range1, i) => 
      seriesRanges.some((range2, j) => 
        i !== j && range1.range > 0 && range2.range > 0 && 
        (range1.range / range2.range > 10 || range2.range / range1.range > 10)
      )
    );

    if (shouldAutoAssign) {
      const assignment: {[key: string]: 'y' | 'y2'} = {};
      seriesRanges.forEach((range, index) => {
        assignment[range.dataKey] = index % 2 === 0 ? 'y' : 'y2';
      });
      return assignment;
    }
    return {};
  }, [processedSeries, processedData]);
  
  // Apply initial axis assignments ONLY ONCE
  useEffect(() => {
    if (hasAutoAssignedRef.current) return;
    
    if (Object.keys(initialAxisAssignments).length > 0) {
      setSeriesAxisAssignment(initialAxisAssignments);
      hasAutoAssignedRef.current = true;
    }
  }, [initialAxisAssignments]);

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

    return processedSeries.map((s, index) => ({
      x: processedData.map(d => d.date),
      y: processedData.map(d => d[s.dataKey] as number),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: seriesNames[s.dataKey] || s.name,
      yaxis: seriesAxisAssignment[s.dataKey] || 'y', // Assign to primary or secondary axis
      line: {
        color: s.color || (index === 0 ? settings.colors.primary : settings.colors.secondary),
        width: 2
      },
      hovertemplate: `<b>%{fullData.name}</b><br>` +
                     `Date: %{x}<br>` +
                     `Value: %{y:,.0f}<br>` +
                     `<extra></extra>`
    }));
  }, [processedData, processedSeries, seriesNames, settings.colors, seriesAxisAssignment]);

  // Plotly layout configuration
  const plotlyLayout = useMemo(() => ({
    title: {
      text: '',
      font: { size: 16 }
    },
    xaxis: {
      title: { text: settings.axisLabels.xAxis || '' },
      showgrid: settings.showGrid,
      gridcolor: '#f0f0f0',
      tickformat: '%b %y', // Short month + 2-digit year (e.g., "Jan 20")
      tickangle: 0
    },
    yaxis: {
      title: { text: settings.axisLabels.yAxis || '' },
      showgrid: settings.showGrid,
      gridcolor: '#f0f0f0',
      tickformat: ',.0f',
      side: 'left'
    },
    yaxis2: {
      title: { text: settings.axisLabels.yAxis || '' },
      showgrid: false, // Avoid overlapping grids
      gridcolor: '#f0f0f0',
      tickformat: ',.0f',
      side: 'right',
      overlaying: 'y'
    },
    showlegend: false, // We'll use custom editable legend instead
    hovermode: settings.showTooltip ? ('closest' as const) : (false as const),
    dragmode: 'pan' as const,
    scrollZoom: true,
    margin: { l: 50, r: 50, t: 10, b: 45 },
    autosize: true,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Arial, sans-serif', size: 12 }
  }), [settings]);

  // Plotly configuration
  const plotlyConfig = useMemo(() => ({
    responsive: true,
    displayModeBar: false, // Hide the grey toolbar
    displaylogo: false,
    scrollZoom: true,
    doubleClick: 'reset+autosize', // Better auto-sizing behavior
    showTips: false // Reduce clutter
  } as any), []);

  const renderEmptyState = () => (
    <div className="chart-empty-state">
      <div className="empty-icon">📈</div>
      <h3>No Data Yet</h3>
      <p>Drag a data series from the Data Browser to visualize</p>
    </div>
  );

  return (
    <>
      <div className={`chart-container ${isDropTarget ? 'drop-target' : ''}`}>
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
        {/* Separate Legend Container - Outside Chart Area */}
        {settings.showLegend && processedData.length > 0 && processedSeries.length > 0 && (
          <div className="chart-legend-container">
            <div className="editable-legend">
              {processedSeries.map((s, index) => (
                <div key={`${s.dataKey}-${index}`} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ 
                      backgroundColor: s.color || (index === 0 ? settings.colors.primary : settings.colors.secondary) 
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
                      title="Click to edit series name"
                    >
                      {seriesNames[s.dataKey] || s.name}
                    </span>
                  )}
                  <button
                    className="axis-toggle-btn"
                    onClick={() => setSeriesAxisAssignment(prev => ({
                      ...prev,
                      [s.dataKey]: prev[s.dataKey] === 'y2' ? 'y' : 'y2'
                    }))}
                    title={`Switch to ${seriesAxisAssignment[s.dataKey] === 'y2' ? 'left' : 'right'} axis`}
                  >
                    {seriesAxisAssignment[s.dataKey] === 'y2' ? 'R' : 'L'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className={`chart-body ${processedData.length === 0 || processedSeries.length === 0 ? 'empty-state' : ''}`}>
          {processedData.length === 0 || processedSeries.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="plotly-chart-container">
              <Plot
                key={`plot-${id}-${resizeKey}`}
                data={plotlyData}
                layout={plotlyLayout}
                config={plotlyConfig}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
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