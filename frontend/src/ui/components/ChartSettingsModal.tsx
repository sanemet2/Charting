// Import React library with useState hook for state management
import React, { useState } from 'react';
// Import ChartSettingsModal-specific styles for component styling
import './ChartSettingsModal.css';

// Define ChartSettings interface for chart configuration data
export interface ChartSettings {
  // Define showGrid property for grid line visibility
  showGrid: boolean;
  // Define showLegend property for legend visibility
  showLegend: boolean;
  // Define showTooltip property for tooltip visibility
  showTooltip: boolean;
  // Define showDots property for data point visibility
  showDots: boolean;
  // Define chartAnimation property for animation enablement
  chartAnimation: boolean;
  // Define axisLabels property for axis label configuration
  axisLabels: {
    // Define xAxis property for X-axis label text
    xAxis: string;
    // Define yAxis property for Y-axis label text
    yAxis: string;
  };
  // Define colors property for chart color scheme
  colors: {
    // Define primary property for primary color value
    primary: string;
    // Define secondary property for secondary color value
    secondary: string;
  };
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
}

const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave,
  chartType 
}) => {
  const [localSettings, setLocalSettings] = useState<ChartSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleColorChange = (colorKey: 'primary' | 'secondary', value: string) => {
    setLocalSettings({
      ...localSettings,
      colors: {
        ...localSettings.colors,
        [colorKey]: value
      }
    });
  };

  const handleAxisLabelChange = (axis: 'xAxis' | 'yAxis', value: string) => {
    setLocalSettings({
      ...localSettings,
      axisLabels: {
        ...localSettings.axisLabels,
        [axis]: value
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
                checked={localSettings.showLegend}
                onChange={(e) => setLocalSettings({ ...localSettings, showLegend: e.target.checked })}
              />
              <span>Show Legend</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.showTooltip}
                onChange={(e) => setLocalSettings({ ...localSettings, showTooltip: e.target.checked })}
              />
              <span>Show Tooltips</span>
            </label>

            {chartType === 'line' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localSettings.showDots}
                  onChange={(e) => setLocalSettings({ ...localSettings, showDots: e.target.checked })}
                />
                <span>Show Data Points</span>
              </label>
            )}

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={localSettings.chartAnimation}
                onChange={(e) => setLocalSettings({ ...localSettings, chartAnimation: e.target.checked })}
              />
              <span>Enable Animations</span>
            </label>
          </div>

          {/* Axis Labels */}
          <div className="settings-section">
            <h3>Axis Labels</h3>
            
            <div className="input-group">
              <label>X-Axis Label</label>
              <input
                type="text"
                value={localSettings.axisLabels.xAxis}
                onChange={(e) => handleAxisLabelChange('xAxis', e.target.value)}
                placeholder="Enter X-axis label"
                className="settings-input"
              />
            </div>

            <div className="input-group">
              <label>Y-Axis Label</label>
              <input
                type="text"
                value={localSettings.axisLabels.yAxis}
                onChange={(e) => handleAxisLabelChange('yAxis', e.target.value)}
                placeholder="Enter Y-axis label"
                className="settings-input"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="settings-section">
            <h3>Colors</h3>
            
            <div className="color-group">
              <label>Primary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={localSettings.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={localSettings.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>

            <div className="color-group">
              <label>Secondary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={localSettings.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={localSettings.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="color-text"
                />
              </div>
            </div>
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