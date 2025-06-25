// Import React library with useState hook for state management
import React, { useState } from 'react';
// Import ChartCanvas-specific styles for component styling
import './ChartCanvas.css';
// Import chart components for data visualization
import { LineChart } from '../charts';
// Import GridSize type from Header component
import { GridSize } from './Header';
// Import DataSeries interface from core models
import { DataSeries } from '../../core/models/DataTypes';

// Define Chart interface for chart data structure
export interface Chart {
  // Define id property as string for chart identification
  id: string;
  // Define type property with specific chart type options
  type: 'line';
  // Define optional dataSeries property for chart data
  dataSeries?: DataSeries[];
}

// Define ChartCanvasProps interface for component properties
interface ChartCanvasProps {
  // Define charts property as Chart array for display
  charts: Chart[];
  // Define onRemoveChart property as function for chart deletion
  onRemoveChart: (id: string) => void;
  // Define onUpdateChart property as function for chart modification
  onUpdateChart: (id: string, updates: Partial<Chart>) => void;
  // Define optional activeLibraryName property for library display
  activeLibraryName?: string;
  // Define hasLibraries property for conditional rendering
  hasLibraries: boolean;
  // Define gridSize property for layout configuration
  gridSize: GridSize;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({ 
  charts, 
  onRemoveChart, 
  onUpdateChart,
  activeLibraryName, 
  hasLibraries, 
  gridSize 
}) => {
  const [dragOverChart, setDragOverChart] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only hide drag feedback if we're leaving the canvas entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverCanvas(false);
      setDragOverChart(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    setDragOverChart(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'data-series') {
        console.log('Dropped series on canvas:', data.series);
        // For now, just log - we'll implement chart creation later
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleChartDragOver = (e: React.DragEvent, chartId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverChart(chartId);
  };

  const handleChartDragLeave = (e: React.DragEvent, chartId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're not moving to a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverChart(null);
    }
  };

  const handleChartDrop = (e: React.DragEvent, chartId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverChart(null);
    setIsDragOverCanvas(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'data-series') {
        const chart = charts.find(c => c.id === chartId);
        if (chart) {
          const existingSeries = chart.dataSeries || [];
          const newSeries = [...existingSeries, data.series];
          onUpdateChart(chartId, { dataSeries: newSeries });
          console.log(`Added series to chart ${chartId}:`, data.series);
        }
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const renderChart = (chart: Chart) => {
    const isDropTarget = dragOverChart === chart.id;
    const shouldAnimate = charts.length <= 3; // Disable animations when >3 charts
    
    switch (chart.type) {
      case 'line':
        return (
          <LineChart 
            key={chart.id} 
            id={chart.id} 
            onClose={onRemoveChart}
            dataSeries={chart.dataSeries}
            isDropTarget={isDropTarget}
            forceDisableAnimation={!shouldAnimate}
            gridSize={gridSize}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`chart-canvas ${isDragOverCanvas ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!hasLibraries ? (
        <div className="empty-canvas">
          <div className="empty-icon">📚</div>
          <h2>Welcome to Chart Library</h2>
          <p>Create your first library to start organizing your charts</p>
          <p className="hint">Click the + button in the sidebar to create a library</p>
        </div>
      ) : !activeLibraryName ? (
        <div className="empty-canvas">
          <div className="empty-icon">📁</div>
          <h2>Select a library</h2>
          <p>Choose a library from the sidebar to view or create charts</p>
        </div>
      ) : charts.length === 0 ? (
        <div className="empty-canvas">
          <div className="empty-icon">📊</div>
          <h2>No charts in {activeLibraryName}</h2>
          <p>Click "+ New Chart" in the header to create your first chart</p>
          <p className="hint">Or drag data series from the Data Browser to create charts</p>
        </div>
      ) : (
        <div className="chart-content">
          <div className={`charts-grid grid-${gridSize}`}>
            {charts.map(chart => (
              <div 
                key={chart.id} 
                className={`chart-wrapper ${dragOverChart === chart.id ? 'drop-target' : ''}`}
                onDragOver={(e) => handleChartDragOver(e, chart.id)}
                onDragLeave={(e) => handleChartDragLeave(e, chart.id)}
                onDrop={(e) => handleChartDrop(e, chart.id)}
              >
                {renderChart(chart)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export ChartCanvas component as default module export
export default ChartCanvas; 