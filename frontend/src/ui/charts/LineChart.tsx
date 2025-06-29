import React, { useState, useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import './ChartStyles.css';
import ChartSettingsModal, { ChartSettings } from '../components/ChartSettingsModal';
import { DataSeries } from '../../core/models/DataTypes';
import { useChartData, useAxisAssignment, useResponsiveSettings, usePlotlyConfig, useInlineEditing, useLegend } from './LineChart/hooks';
import { ChartLegend } from './LineChart/components';
import { DataPoint, Series, LineChartProps } from './LineChart/types';
import { debug, debugCategories } from './LineChart/utils/debug';

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
  gridSize = '3x3',
  onDeleteSeries
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChartSettings>(defaultSettings);
  
  // Container ref for responsive behavior
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 REFACTORED: Title editing logic extracted to useInlineEditing hook
  const { chartTitle, setChartTitle, isEditingTitle, setIsEditingTitle, titleInputRef, handleTitleSubmit } = useInlineEditing({
    initialTitle: 'Line Chart'
  });

  // 🎯 REFACTORED: Responsive settings logic extracted to useResponsiveSettings hook
  const { responsiveSettings, containerDimensions, isNarrow, isVerySmall, isDimensionsStable } = useResponsiveSettings({ 
    gridSize, 
    containerRef 
  });

  // 🎯 REFACTORED: Data processing extracted to useChartData hook
  const { processedData, processedSeries } = useChartData({
    data,
    series,
    dataSeries,
    gridSize
  });

  // 🎯 REFACTORED: Axis assignment logic extracted to useAxisAssignment hook
  const { seriesAxisAssignment, setSeriesAxisAssignment } = useAxisAssignment({
    processedSeries
  });

  // 🔧 DEBUG: Plotly event handlers to understand pan end behavior
  const handlePlotlyRelayout = (eventData: any) => {
    debug(debugCategories.PLOTLY_CONFIG, {
      message: '🚨 PLOTLY RELAYOUT EVENT (Pan End?)',
      eventData: Object.keys(eventData),
      hasXAxisRange: !!eventData['xaxis.range[0]'],
      hasYAxisRange: !!eventData['yaxis.range[0]'],
      gridSize,
      timestamp: Date.now()
    });
  };

  const handlePlotlyRedraw = () => {
    debug(debugCategories.PLOTLY_CONFIG, {
      message: '🚨 PLOTLY REDRAW EVENT',
      gridSize,
      timestamp: Date.now()
    });
  };

  // 🎯 REFACTORED: Legend logic extracted to useLegend hook
  const legendData = useLegend({
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
  });

  // 🎯 REFACTORED: Plotly configuration logic extracted to usePlotlyConfig hook
  const { plotlyData, plotlyLayout, plotlyConfig, hasLeftAxisData, hasRightAxisData } = usePlotlyConfig({
    processedData,
    processedSeries,
    seriesNames: legendData.seriesNames,
    settings,
    seriesAxisAssignment,
    responsiveSettings
  });

  // 🔧 FIX: Stable Plot revision - moved to top level to follow Rules of Hooks
  const plotRevision = useMemo(() => {
    // Only update revision when layout actually changes
    const stableKey = `${gridSize}-${responsiveSettings.fontSize}-${containerDimensions.width}x${containerDimensions.height}`;
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < stableKey.length; i++) {
      hash = ((hash << 5) - hash) + stableKey.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }, [gridSize, responsiveSettings.fontSize, containerDimensions.width, containerDimensions.height]);

  const actualLegendHeight = isDimensionsStable && legendData.shouldShowLegend ? legendData.legendHeight : 0;
  
  debug(debugCategories.CHART_DATA, {
    message: 'CSS application debug',
    gridSize,
    containerDimensions,
    isDimensionsStable,
    shouldShowLegend: legendData.shouldShowLegend,
    actualLegendHeight
  });

  const handleSettingsSave = (newSettings: ChartSettings) => {
    setSettings(newSettings);
  };

  // 🎯 REFACTORED: All title editing and series management functions moved to respective hooks

  const renderEmptyState = () => (
    <div className="chart-empty-state">
      <div className="empty-icon">📈</div>
      <h3>No Data Yet</h3>
      <p>Drag a data series from the Data Browser to visualize</p>
    </div>
  );

  return (
    <>
      <div 
        ref={containerRef}
        className={`chart-container grid-${gridSize} ${isDropTarget ? 'drop-target' : ''}`}
      >
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

        
        <div className={`chart-body ${processedData.length === 0 || processedSeries.length === 0 ? 'empty-state' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          // 🔧 FIX: Only set CSS custom property when dimensions are stable
          '--legend-height': `${actualLegendHeight}px`,
          minHeight: 0
        } as React.CSSProperties}>
          {processedData.length === 0 || processedSeries.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="plotly-chart-container" style={{ 
                width: '100%', 
                // 🔧 FIX: Wait for stable dimensions before applying legend space
                height: isDimensionsStable && legendData.shouldShowLegend ? 
                  'calc(100% - var(--legend-height))' : 
                  '100%', // Use full height until dimensions stabilize
                minHeight: containerDimensions.height > 0 && containerDimensions.height < 200 ? '120px' : '150px',
                overflow: 'hidden',
                // 🔧 DEBUG: Add visual indicator for timing issues
                transition: 'height 0.1s ease-out' // Smooth transition when height changes
              }}>
                <Plot
                  key={`plot-${id}-${JSON.stringify(seriesAxisAssignment)}`}
                  data={plotlyData}
                  layout={plotlyLayout}
                  config={plotlyConfig}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                  revision={plotRevision}
                  onRelayout={handlePlotlyRelayout}
                  onRedraw={handlePlotlyRedraw}
                />
              </div>
              {/* New Legend Component - Below Chart */}
              {legendData.shouldShowLegend && isDimensionsStable && (() => {
                const { visibleItems, canScrollNext } = legendData.getLegendCarousel();
                return (
                  <ChartLegend
                    processedSeries={processedSeries}
                    seriesNames={legendData.seriesNames}
                    seriesAxisAssignment={seriesAxisAssignment}
                    editingSeries={legendData.editingSeries}
                    setSeriesNames={legendData.setSeriesNames}
                    setEditingSeries={legendData.setEditingSeries}
                    setSeriesAxisAssignment={setSeriesAxisAssignment}
                    handleSeriesSubmit={legendData.handleSeriesSubmit}
                    handleCarouselNext={legendData.handleCarouselNext}
                    seriesInputRef={legendData.seriesInputRef}
                    visibleItems={visibleItems}
                    canScrollNext={canScrollNext}
                    onDeleteSeries={onDeleteSeries}
                    legendStyle={{
                      ...legendData.legendStyle,
                      // 🔧 FIX: Add transition for smooth appearance after font changes
                      opacity: isDimensionsStable ? 1 : 0,
                      transition: 'opacity 0.2s ease-in'
                    }}
                    settings={settings}
                    isNarrow={isNarrow}
                    isVerySmall={isVerySmall}
                    containerDimensions={containerDimensions}
                  />
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