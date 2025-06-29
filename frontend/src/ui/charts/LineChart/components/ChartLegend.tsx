import React from 'react';
import { Series } from '../types';

interface ChartLegendProps {
  // Data
  processedSeries: Series[];
  seriesNames: {[key: string]: string};
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  
  // State
  editingSeries: string | null;
  
  // Handlers
  setSeriesNames: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  setEditingSeries: React.Dispatch<React.SetStateAction<string | null>>;
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{[key: string]: 'y' | 'y2'}>>;
  handleSeriesSubmit: (e: React.FormEvent, seriesKey: string) => void;
  handleCarouselNext: () => void;
  onDeleteSeries?: (seriesId: string) => void;
  
  // Refs
  seriesInputRef: React.RefObject<HTMLInputElement | null>;
  
  // Carousel data
  visibleItems: Series[];
  canScrollNext: boolean;
  
  // Styling
  legendStyle: React.CSSProperties;
  settings: {
    colors: {
      primary: string;
      secondary: string;
    };
  };
  
  // Container awareness
  isNarrow?: boolean;
  isVerySmall?: boolean;
  containerDimensions?: { width: number; height: number };
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  processedSeries,
  seriesNames,
  seriesAxisAssignment,
  editingSeries,
  setSeriesNames,
  setEditingSeries,
  setSeriesAxisAssignment,
  handleSeriesSubmit,
  handleCarouselNext,
  onDeleteSeries,
  seriesInputRef,
  visibleItems,
  canScrollNext,
  legendStyle,
  settings,
  isNarrow = false,
  isVerySmall = false,
  containerDimensions = { width: 0, height: 0 }
}) => {
  // 🔧 FIX: Grid-based responsive styling (no container dependencies)
  const gridSettings = {
    '1x1': { gap: '16px', itemGap: '6px', colorSize: '12px', buttonSize: '20px', carouselSize: '22px' },
    '2x2': { gap: '12px', itemGap: '5px', colorSize: '10px', buttonSize: '18px', carouselSize: '20px' },
    '3x3': { gap: '12px', itemGap: '4px', colorSize: '10px', buttonSize: '18px', carouselSize: '20px' },
    '4x4': { gap: '10px', itemGap: '4px', colorSize: '8px', buttonSize: '16px', carouselSize: '18px' },
    '5x5': { gap: '8px', itemGap: '3px', colorSize: '8px', buttonSize: '16px', carouselSize: '18px' }
  };
  
  // Use fontSize to determine grid size (simplified approach)
  const fontSize = typeof legendStyle.fontSize === 'string' ? 
    parseInt(legendStyle.fontSize) : 
    (typeof legendStyle.fontSize === 'number' ? legendStyle.fontSize : 11);
  
  const currentGridSize = fontSize >= 14 ? '1x1' :
                         fontSize >= 12 ? '2x2' :
                         fontSize >= 11 ? '3x3' :
                         fontSize >= 10 ? '4x4' : '5x5';
  
  const adaptive = gridSettings[currentGridSize as keyof typeof gridSettings];

  return (
    <div className="chart-legend" style={legendStyle}>
      <div className="legend-content" style={{
        display: 'flex',
        alignItems: 'center',
        gap: adaptive.gap,
        justifyContent: 'inherit',
        width: '100%',
        height: '100%'
      }}>
        {/* Legend Items */}
        {visibleItems.map((s, index) => (
          <div key={`${s.dataKey}-${index}`} className="legend-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: adaptive.itemGap
          }}>
            {/* Color indicator */}
            <div 
              className="legend-color" 
              style={{ 
                width: adaptive.colorSize,
                height: adaptive.colorSize,
                backgroundColor: s.color || (index === 0 ? settings.colors.primary : settings.colors.secondary),
                borderRadius: '2px'
              }}
            />
            
            {/* Series name (editable) */}
            {editingSeries === s.dataKey ? (
              <form onSubmit={(e) => handleSeriesSubmit(e, s.dataKey)} style={{ display: 'inline' }}>
                <input
                  ref={seriesInputRef}
                  type="text"
                  value={seriesNames[s.dataKey] || s.name}
                  onChange={(e) => setSeriesNames(prev => ({ ...prev, [s.dataKey]: e.target.value }))}
                  onBlur={() => setEditingSeries(null)}
                  style={{
                    border: '1px solid #6366f1',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
                {onDeleteSeries && (
                  <button
                    type="button"
                    onMouseDown={() => onDeleteSeries(s.id)}
                    title="Remove series"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '0 4px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </form>
            ) : (
              <span 
                onClick={() => setEditingSeries(s.dataKey)}
                title={`${seriesNames[s.dataKey] || s.name} - Click to edit`}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {seriesNames[s.dataKey] || s.name}
              </span>
            )}
            
            {/* Axis toggle button */}
            <button
              onClick={() => {
                const newAxis = seriesAxisAssignment[s.dataKey] === 'y2' ? 'y' : 'y2';
                setSeriesAxisAssignment(prev => ({
                  ...prev,
                  [s.dataKey]: newAxis
                }));
              }}
              title={`Switch to ${seriesAxisAssignment[s.dataKey] === 'y2' ? 'left' : 'right'} axis`}
              style={{
                background: 'transparent',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: adaptive.buttonSize,
                height: adaptive.buttonSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {seriesAxisAssignment[s.dataKey] === 'y2' ? 'R' : 'L'}
            </button>
          </div>
        ))}
        
        {/* Carousel button */}
        {canScrollNext && (
          <button 
            onClick={handleCarouselNext}
            title="Click to see more series"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              fontSize: '10px',
              fontWeight: 'bold',
              width: adaptive.carouselSize,
              height: adaptive.carouselSize,
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
          >
            •••
          </button>
        )}
      </div>
    </div>
  );
}; 