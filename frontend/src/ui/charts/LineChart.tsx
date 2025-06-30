import React, { useRef, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import './ChartStyles.css';
import ChartSettingsModal from '../components/ChartSettingsModal';
import { useChartState, useChartActions, useSimpleResponsive, useLegendCarousel, usePlotlyConfig } from './LineChart/hooks';
import { ChartLegend } from './LineChart/components';
import { LineChartProps, DataPoint, Series } from './LineChart/types';
import { DataSeries } from '../../core/models/DataTypes';
// import { debug, debugCategories } from './LineChart/utils/debug'; // Temporarily remove all logging

// Stabilize empty array references to prevent re-renders
const EMPTY_DATA: DataPoint[] = [];
const EMPTY_SERIES: Series[] = [];
const EMPTY_DATA_SERIES: DataSeries[] = [];

const LineChart: React.FC<LineChartProps> = ({
  id,
  onClose,
  data = EMPTY_DATA,
  series = EMPTY_SERIES,
  dataSeries = EMPTY_DATA_SERIES,
  isDropTarget = false,
  gridSize = '3x3',
  onDeleteSeries
}) => {
  // --- 1. Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // --- 2. State & Custom Hooks (MUST BE CALLED UNCONDITIONALLY) ---
  const { state, dispatch } = useChartState({ data, series, dataSeries, gridSize });
  const actions = useChartActions(dispatch);
  const responsive = useSimpleResponsive({ containerRef, gridSize });

  const carousel = useLegendCarousel({
    processedSeries: state.processedSeries,
    seriesNames: state.seriesNames,
    carouselOffset: state.carouselOffset,
    containerWidth: responsive.containerDimensions.width,
    fontSize: responsive.responsiveSettings.fontSize
  });

  const { plotlyData, plotlyLayout, plotlyConfig } = usePlotlyConfig({
    processedData: state.processedData,
    processedSeries: state.processedSeries,
    seriesNames: state.seriesNames,
    settings: state.settings,
    seriesAxisAssignment: state.seriesAxisAssignment,
    responsiveSettings: responsive.responsiveSettings
  });

  const [showSettings, setShowSettings] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState('');
  
  // --- 3. Effects (MUST BE CALLED UNCONDITIONALLY) ---
  useEffect(() => {
    actions.setContainerDimensions(
      responsive.containerDimensions.width,
      responsive.containerDimensions.height
    );
    actions.setDimensionsStable(responsive.isDimensionsStable);
  }, [responsive.containerDimensions, responsive.isDimensionsStable, actions]);

  useEffect(() => {
    actions.setRawData(data, series, dataSeries);
  }, [data, series, dataSeries, actions]);

  useEffect(() => {
    actions.setGridSize(gridSize);
  }, [gridSize, actions]);

  useEffect(() => {
    if (state.isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [state.isEditingTitle]);

  // --- 4. Callbacks & Memoized Values (MUST BE CALLED UNCONDITIONALLY) ---
  const handleTitleClick = () => {
    setEditingTitle(state.chartTitle);
    actions.setEditingTitle(true);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setChartTitle(editingTitle);
    actions.setEditingTitle(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    actions.setEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      actions.setEditingTitle(false);
    }
  };

  const handleCarouselNext = () => {
    const totalItems = state.processedSeries.length;
    const maxVisible = carousel.maxVisibleItems;
    const maxOffset = totalItems > maxVisible ? totalItems - maxVisible : 0;
    
    let nextOffset = state.carouselOffset + 1;
    if (nextOffset > maxOffset) {
      nextOffset = 0;
    }
    
    actions.setCarouselOffset(nextOffset);
  };

  const handleSettingsSave = (newSettings: any) => {
    actions.setSettings(newSettings);
  };

  const setSeriesNames = React.useCallback((updater: React.SetStateAction<{ [key: string]: string }>) => {
    const newNames = typeof updater === 'function' ? updater(state.seriesNames) : updater;
    Object.entries(newNames).forEach(([key, name]) => {
      if (name !== state.seriesNames[key]) {
        actions.updateSeriesName(key, name);
      }
    });
  }, [state.seriesNames, actions]);

  const setEditingSeries = React.useCallback((updater: React.SetStateAction<string | null>) => {
    const newValue = typeof updater === 'function' ? updater(state.editingSeries) : updater;
    actions.setEditingSeries(newValue);
  }, [state.editingSeries, actions]);

  const setSeriesAxisAssignment = React.useCallback((updater: React.SetStateAction<{ [key: string]: 'y' | 'y2' }>) => {
    const newAssignment = typeof updater === 'function' ? updater(state.seriesAxisAssignment) : updater;
    Object.entries(newAssignment).forEach(([key, axis]) => {
      if (axis !== state.seriesAxisAssignment[key]) {
        actions.toggleSeriesAxis(key, state.seriesAxisAssignment[key]);
      }
    });
  }, [state.seriesAxisAssignment, actions]);

  const plotRevision = useMemo(() => {
    const stableKey = `${gridSize}-${responsive.responsiveSettings.fontSize}-${responsive.containerDimensions.width}x${responsive.containerDimensions.height}`;
    let hash = 0;
    for (let i = 0; i < stableKey.length; i++) {
      hash = ((hash << 5) - hash) + stableKey.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [gridSize, responsive.responsiveSettings.fontSize, responsive.containerDimensions.width, responsive.containerDimensions.height]);

  // --- 5. Conditional Renders (AFTER ALL HOOKS) ---
  if (!responsive.isDimensionsStable || responsive.containerDimensions.width === 0) {
    return <div ref={containerRef} className={`chart-container grid-${gridSize}`} style={{ minHeight: 150 }} />;
  }
  
  if (state.processedSeries.length === 0) {
    return (
      <div ref={containerRef} className={`chart-container grid-${gridSize} ${isDropTarget ? 'drop-target' : ''}`}>
        <div className="chart-empty-state">
          <div className="empty-icon">📈</div>
          <h3>No Data Yet</h3>
          <p>Drag a data series from the Data Browser to visualize</p>
        </div>
      </div>
    );
  }

  // --- 6. Final Render ---
  const actualLegendHeight = responsive.isDimensionsStable && state.shouldShowLegend ? state.legendHeight : 0;
  
  return (
    <>
      <div
        ref={containerRef}
        className={`chart-container grid-${gridSize} ${isDropTarget ? 'drop-target' : ''}`}
      >
        <div className="chart-header">
          {state.isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} style={{ flex: 1 }}>
              <input
                ref={titleInputRef}
                type="text"
                value={editingTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="inline-edit-input title-.edit"
              />
            </form>
          ) : (
            <h3
              className="chart-title editable"
              onClick={handleTitleClick}
              title="Click to edit"
            >
              {state.chartTitle}
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
            {onClose && (
              <button
                className="chart-action"
                title="Close chart"
                onClick={() => onClose(id)}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="chart-content" style={{ height: `calc(100% - ${actualLegendHeight}px)` }}>
          <Plot
            data={plotlyData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: '100%' }}
            revision={plotRevision}
          />
        </div>

        {state.shouldShowLegend && (
          <div 
            className="chart-legend-container" 
            style={{ 
              height: state.legendHeight,
              position: 'relative',
              zIndex: 10,
              bottom: '5px'
            }}
          >
            <ChartLegend
              processedSeries={state.processedSeries}
              seriesNames={state.seriesNames}
              seriesAxisAssignment={state.seriesAxisAssignment}
              editingSeries={state.editingSeries}
              setSeriesNames={setSeriesNames}
              setEditingSeries={setEditingSeries}
              setSeriesAxisAssignment={setSeriesAxisAssignment}
              handleCarouselNext={handleCarouselNext}
              onHeightChange={actions.setLegendHeight}
              onDeleteSeries={onDeleteSeries}
              seriesInputRef={carousel.seriesInputRef}
              visibleItems={carousel.visibleItems}
              canScrollNext={carousel.canScrollNext}
              legendStyle={{
                fontSize: responsive.responsiveSettings.fontSize,
                justifyContent: carousel.canScrollNext ? 'space-between' : 'center'
              }}
              settings={state.settings}
              isNarrow={responsive.isNarrow}
              isVerySmall={responsive.isVerySmall}
              containerDimensions={responsive.containerDimensions}
            />
          </div>
        )}
      </div>
      <ChartSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={state.settings}
        onSave={handleSettingsSave}
        chartType="line"
        processedSeries={state.processedSeries}
        seriesNames={state.seriesNames}
      />
    </>
  );
};

export default LineChart; 