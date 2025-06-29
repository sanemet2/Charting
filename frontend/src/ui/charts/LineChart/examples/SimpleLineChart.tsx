import React, { useRef } from 'react';
import Plot from 'react-plotly.js';
import { useChartState, useChartActions, useLegendCarousel, useSimpleResponsive } from '../hooks';
import { LineChartProps } from '../types';

/**
 * Example of using the new refactored architecture
 * This shows how much simpler it is to work with individual pieces
 */
const SimpleLineChart: React.FC<LineChartProps> = ({ 
  id, 
  onClose, 
  data = [], 
  series = [], 
  dataSeries = [],
  gridSize = '3x3'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 🎯 STEP 1: Get central state and actions
  const { state, dispatch } = useChartState({ data, series, dataSeries, gridSize });
  const actions = useChartActions(dispatch);

  // 🎯 STEP 2: Get responsive data (independent)
  const responsive = useSimpleResponsive({ containerRef, gridSize });

  // 🎯 STEP 3: Get legend carousel data (independent)
  const carousel = useLegendCarousel({
    processedSeries: state.processedSeries,
    seriesNames: state.seriesNames,
    carouselOffset: state.carouselOffset,
    containerWidth: responsive.containerDimensions.width,
    fontSize: responsive.responsiveSettings.fontSize
  });

  // 🎯 STEP 4: Update state when responsive data changes
  React.useEffect(() => {
    actions.setContainerDimensions(
      responsive.containerDimensions.width, 
      responsive.containerDimensions.height
    );
    actions.setDimensionsStable(responsive.isDimensionsStable);
  }, [responsive.containerDimensions, responsive.isDimensionsStable, actions]);

  // 🎯 STEP 5: Simple event handlers
  const handleTitleClick = () => actions.setEditingTitle(true);
  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setEditingTitle(false);
  };
  const handleSeriesAxisToggle = (seriesKey: string) => {
    actions.toggleSeriesAxis(seriesKey, state.seriesAxisAssignment[seriesKey]);
  };

  // 🎯 STEP 6: Render (much cleaner!)
  return (
    <div ref={containerRef} className={`chart-container grid-${gridSize}`}>
      {/* Title Section */}
      <div className="chart-header">
        {state.isEditingTitle ? (
          <form onSubmit={handleTitleSubmit}>
            <input
              value={state.chartTitle}
              onChange={(e) => actions.setChartTitle(e.target.value)}
              onBlur={() => actions.setEditingTitle(false)}
            />
          </form>
        ) : (
          <h3 onClick={handleTitleClick}>{state.chartTitle}</h3>
        )}
        <button onClick={() => onClose(id)}>✕</button>
      </div>

      {/* Chart Section */}
      <div className="chart-body">
        {state.processedData.length > 0 ? (
          <div className="plotly-container">
            <Plot
              data={[]} // TODO: Add plotly data generation
              layout={{}} // TODO: Add plotly layout generation
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div className="empty-state">No data to display</div>
        )}

        {/* Legend Section */}
        {state.shouldShowLegend && responsive.isDimensionsStable && (
          <div className="legend" style={responsive.responsiveSettings}>
            {carousel.visibleItems.map((series) => (
              <div key={series.dataKey} className="legend-item">
                <div 
                  className="color-indicator" 
                  style={{ backgroundColor: series.color }} 
                />
                <span>{state.seriesNames[series.dataKey] || series.name}</span>
                <button onClick={() => handleSeriesAxisToggle(series.dataKey)}>
                  {state.seriesAxisAssignment[series.dataKey] === 'y2' ? 'R' : 'L'}
                </button>
              </div>
            ))}
            {carousel.canScrollNext && (
              <button onClick={() => actions.setCarouselOffset(state.carouselOffset + 1)}>
                →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleLineChart; 