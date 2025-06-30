// Import React library with useState and useEffect hooks for state management
import React, { useState, useEffect } from 'react';
// Import ChartSettingsModal-specific styles for component styling
import './ChartSettingsModal.css';
import { Series } from '../charts/LineChart/types';

// Define ChartSettings interface for chart configuration data
export interface ChartSettings {
  // Define showGrid property for grid line visibility
  showGrid: boolean;
  // Define showTooltip property for tooltip visibility
  showTooltip: boolean;
  // Define colors property for dynamic series colors
  colors: { [seriesId: string]: string };
}

// Define ChartSettingsModalProps interface for component properties
interface ChartSettingsModalProps {
  // Define isOpen property for modal visibility state
  isOpen: boolean;
  // Define onClose property as function for modal closing
  onClose: () => void;
  // Define settings property for current chart configuration
  settings: ChartSettings;
  // Define onSave property as function for settings persistence
  onSave: (settings: ChartSettings) => void;
  // Define chartType property with specific chart type options
  chartType: 'line' | 'bar';
  // Define processedSeries property for dynamic color pickers
  processedSeries: Series[];
  // Define seriesNames property for series display names
  seriesNames: { [key: string]: string };
}

const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  chartType,
  processedSeries,
  seriesNames
}) => {
  const [localSettings, setLocalSettings] = useState<ChartSettings>(settings);

  // Sync local settings with props when settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleSeriesColorChange = (seriesId: string, color: string) => {
    setLocalSettings({
      ...localSettings,
      colors: {
        ...localSettings.colors,
        [seriesId]: color
      }
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <h2>Chart Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {/* Display Options */}
          <div className="settings-section">
            <h3>Display Options</h3>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.showGrid}
                onChange={(e) => setLocalSettings({ ...localSettings, showGrid: e.target.checked })}
              />
              <span>Show Grid Lines</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.showTooltip}
                onChange={(e) => setLocalSettings({ ...localSettings, showTooltip: e.target.checked })}
              />
              <span>Show Tooltips</span>
            </label>
          </div>

          {/* Series Colors */}
          <div className="settings-section">
            <h3>Series Colors</h3>
            
            {processedSeries.map((series, index) => (
              <div key={series.dataKey} className="color-group">
                <label>{seriesNames[series.dataKey] || series.name}</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={localSettings.colors[series.dataKey] || '#6366f1'}
                    onChange={(e) => handleSeriesColorChange(series.dataKey, e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={localSettings.colors[series.dataKey] || '#6366f1'}
                    onChange={(e) => handleSeriesColorChange(series.dataKey, e.target.value)}
                    className="color-text"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </>
  );
};

// Export ChartSettingsModal component as default module export
export default ChartSettingsModal; 