import React, { useState, useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import './ChartStyles.css';
import ChartSettingsModal, { ChartSettings } from '../components/ChartSettingsModal';
import { DataSeries } from '../../core/models/DataTypes';
import { useChartData, useAxisAssignment, useResponsiveSettings, usePlotlyConfig, useSeriesManagement, useInlineEditing } from './LineChart/hooks';
import { DataPoint, Series, LineChartProps } from './LineChart/types';

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
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChartSettings>(defaultSettings);

  // 🎯 REFACTORED: Title editing logic extracted to useInlineEditing hook
  const { chartTitle, setChartTitle, isEditingTitle, setIsEditingTitle, titleInputRef, handleTitleSubmit } = useInlineEditing({
    initialTitle: 'Line Chart'
  });

  // 🎯 REFACTORED: Responsive settings logic extracted to useResponsiveSettings hook
  const { responsiveSettings } = useResponsiveSettings({ gridSize });

  // 🎯 REFACTORED: Data processing extracted to useChartData hook
  const { processedData, processedSeries } = useChartData({
    data,
    series,
    dataSeries,
    gridSize
  });

  // 🎯 REFACTORED: Axis assignment logic extracted to useAxisAssignment hook
  const { seriesAxisAssignment, setSeriesAxisAssignment } = useAxisAssignment({
    processedSeries,
    processedData
  });

  // 🎯 REFACTORED: Series management logic extracted to useSeriesManagement hook
  const { 
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
  } = useSeriesManagement({
    processedSeries,
    gridSize
  });

  // 🎯 REFACTORED: Plotly configuration logic extracted to usePlotlyConfig hook
  const { plotlyData, plotlyLayout, plotlyConfig, hasLeftAxisData, hasRightAxisData } = usePlotlyConfig({
    processedData,
    processedSeries,
    seriesNames,
    settings,
    seriesAxisAssignment,
    responsiveSettings
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
              <div className="plotly-chart-container" style={{ width: '100%', height: 'calc(100% - 40px)', minHeight: '250px' }}>
                <Plot
                  key={`plot-${id}-${JSON.stringify(seriesAxisAssignment)}`}
                  data={plotlyData}
                  layout={plotlyLayout}
                  config={plotlyConfig}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                  revision={Date.now()}
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
                  <div className="chart-inline-legend" style={{ position: 'absolute', bottom: '10px', width: '100%', zIndex: 10 }}>
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