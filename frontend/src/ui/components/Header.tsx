// Import React library with hooks for component functionality
import React, { useState, useRef, useEffect } from 'react';
// Import Header-specific styles for component styling
import './Header.css';

// Define GridSize type with specific grid layout options
type GridSize = '1x1' | '2x2' | '3x3' | '4x4' | '5x5';

// Define HeaderProps interface for component properties
interface HeaderProps {
  // Define onAddChart property as function for chart creation
  onAddChart: (type: 'line') => void;
  // Define gridSize property for current grid configuration
  gridSize: GridSize;
  // Define onGridSizeChange property as function for grid updates
  onGridSizeChange: (size: GridSize) => void;
}

// Define Header component function with props destructuring
const Header: React.FC<HeaderProps> = ({ 
  onAddChart, 
  gridSize, 
  onGridSizeChange
}) => {
  // Initialize showNewChartMenu state with false for dropdown visibility
  const [showNewChartMenu, setShowNewChartMenu] = useState(false);
  // Initialize showGridMenu state with false for grid dropdown visibility
  const [showGridMenu, setShowGridMenu] = useState(false);
  // Create dropdownRef for chart dropdown DOM element reference
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Create gridDropdownRef for grid dropdown DOM element reference
  const gridDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNewChartMenu(false);
      }
      if (gridDropdownRef.current && !gridDropdownRef.current.contains(event.target as Node)) {
        setShowGridMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewChart = (chartType: 'line') => {
    onAddChart(chartType);
    setShowNewChartMenu(false);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <input 
          type="search" 
          placeholder="Search charts..." 
          className="header-search"
        />
      </div>
      
      <div className="header-center">
        {/* Space for any center controls */}
      </div>
      
      <div className="header-right">
        <div className="grid-dropdown" ref={gridDropdownRef}>
          <button 
            className="header-button"
            onClick={() => setShowGridMenu(!showGridMenu)}
            title={`Current grid: ${gridSize.charAt(0)} across`}
          >
            <span>⊞</span>
          </button>
          {showGridMenu && (
            <div className="dropdown-menu">
              <button 
                className={`dropdown-item ${gridSize === '1x1' ? 'active' : ''}`}
                onClick={() => {
                  onGridSizeChange('1x1');
                  setShowGridMenu(false);
                }}
              >
                <span className="dropdown-icon">●</span>
                <span>1 Across</span>
              </button>
              <button 
                className={`dropdown-item ${gridSize === '2x2' ? 'active' : ''}`}
                onClick={() => {
                  onGridSizeChange('2x2');
                  setShowGridMenu(false);
                }}
              >
                <span className="dropdown-icon">••</span>
                <span>2 Across</span>
              </button>
              <button 
                className={`dropdown-item ${gridSize === '3x3' ? 'active' : ''}`}
                onClick={() => {
                  onGridSizeChange('3x3');
                  setShowGridMenu(false);
                }}
              >
                <span className="dropdown-icon">•••</span>
                <span>3 Across</span>
              </button>
              <button 
                className={`dropdown-item ${gridSize === '4x4' ? 'active' : ''}`}
                onClick={() => {
                  onGridSizeChange('4x4');
                  setShowGridMenu(false);
                }}
              >
                <span className="dropdown-icon">••••</span>
                <span>4 Across</span>
              </button>
              <button 
                className={`dropdown-item ${gridSize === '5x5' ? 'active' : ''}`}
                onClick={() => {
                  onGridSizeChange('5x5');
                  setShowGridMenu(false);
                }}
              >
                <span className="dropdown-icon">•••••</span>
                <span>5 Across</span>
              </button>
            </div>
          )}
        </div>
        <div className="new-chart-dropdown" ref={dropdownRef}>
          <button 
            className="header-button primary"
            onClick={() => setShowNewChartMenu(!showNewChartMenu)}
          >
            <span>➕ New Chart</span>
          </button>
          {showNewChartMenu && (
            <div className="dropdown-menu">
              <button 
                className="dropdown-item" 
                onClick={() => handleNewChart('line')}
              >
                <span className="dropdown-icon">📈</span>
                <span>Line Chart</span>
              </button>
            </div>
          )}
        </div>
        <div className="user-avatar">
          <span>👤</span>
        </div>
      </div>
    </header>
  );
};

// Export Header component as default module export
export default Header;
// Export GridSize type for external use
export type { GridSize }; 