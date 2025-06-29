import React, { useRef, useLayoutEffect } from 'react';
import { Series } from '../types';

interface ChartLegendProps {
  // Data
  processedSeries: Series[];
  seriesNames: { [key: string]: string };
  seriesAxisAssignment: { [key: string]: 'y' | 'y2' };

  // State
  editingSeries: string | null;

  // Handlers
  setSeriesNames: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  setEditingSeries: React.Dispatch<React.SetStateAction<string | null>>;
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{ [key: string]: 'y' | 'y2' }>>;
  handleCarouselNext: () => void;
  onHeightChange: (height: number) => void;
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
  handleCarouselNext,
  onHeightChange,
  onDeleteSeries,
  seriesInputRef,
  visibleItems,
  canScrollNext,
  legendStyle,
  settings,
}) => {
  const legendRef = useRef<HTMLDivElement>(null);
  const [editingValue, setEditingValue] = React.useState('');

  useLayoutEffect(() => {
    if (legendRef.current) {
      onHeightChange(legendRef.current.offsetHeight);
    }
  });

  const gridSettings = {
    '1x1': { gap: '16px', itemGap: '6px', colorSize: '12px', buttonSize: '20px', carouselSize: '22px' },
    '2x2': { gap: '12px', itemGap: '5px', colorSize: '10px', buttonSize: '18px', carouselSize: '20px' },
    '3x3': { gap: '12px', itemGap: '4px', colorSize: '10px', buttonSize: '18px', carouselSize: '20px' },
    '4x4': { gap: '10px', itemGap: '4px', colorSize: '8px', buttonSize: '16px', carouselSize: '18px' },
    '5x5': { gap: '8px', itemGap: '3px', colorSize: '8px', buttonSize: '16px', carouselSize: '18px' }
  };

  const fontSize = typeof legendStyle.fontSize === 'string' ? parseInt(legendStyle.fontSize) : (typeof legendStyle.fontSize === 'number' ? legendStyle.fontSize : 11);
  const currentGridSize = fontSize >= 14 ? '1x1' : fontSize >= 12 ? '2x2' : fontSize >= 11 ? '3x3' : fontSize >= 10 ? '4x4' : '5x5';
  const adaptive = gridSettings[currentGridSize as keyof typeof gridSettings];

  const handleEditStart = (seriesKey: string, currentName: string) => {
    setEditingValue(currentName);
    setEditingSeries(seriesKey);
  };

  const handleEditSubmit = (e: React.FormEvent, seriesKey: string) => {
    e.preventDefault();
    setSeriesNames(prev => ({ ...prev, [seriesKey]: editingValue }));
    setEditingSeries(null);
  };

  const handleEditCancel = () => {
    setEditingSeries(null);
    setEditingValue('');
  };

  return (
    <div className="chart-legend" style={legendStyle} ref={legendRef}>
      <div
        className="legend-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: adaptive.gap,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {visibleItems.map((s) => (
          <div key={s.dataKey} className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: adaptive.itemGap, flexShrink: 0 }}>
            <div
              className="legend-color"
              style={{
                width: adaptive.colorSize,
                height: adaptive.colorSize,
                backgroundColor: s.color || settings.colors.primary,
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            {editingSeries === s.dataKey ? (
              <form onSubmit={(e) => handleEditSubmit(e, s.dataKey)} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  ref={seriesInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={handleEditCancel}
                  onKeyDown={(e) => { if (e.key === 'Escape') handleEditCancel(); }}
                  style={{ border: '1px solid #6366f1', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontFamily: 'inherit', outline: 'none', width: '100px' }}
                />
              </form>
            ) : (
              <span
                onClick={() => handleEditStart(s.dataKey, seriesNames[s.dataKey] || s.name)}
                title={`${seriesNames[s.dataKey] || s.name} - Click to edit`}
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}
              >
                {seriesNames[s.dataKey] || s.name}
              </span>
            )}
            <button
              onClick={() => {
                const newAxis = seriesAxisAssignment[s.dataKey] === 'y2' ? 'y' : 'y2';
                setSeriesAxisAssignment(prev => ({ ...prev, [s.dataKey]: newAxis }));
              }}
              title={`Switch to ${seriesAxisAssignment[s.dataKey] === 'y2' ? 'left' : 'right'} axis`}
              style={{
                background: 'transparent', color: '#000000', border: '1px solid #000000', borderRadius: '4px',
                padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
                minWidth: adaptive.buttonSize, height: adaptive.buttonSize, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >
              {seriesAxisAssignment[s.dataKey] === 'y2' ? 'R' : 'L'}
            </button>
          </div>
        ))}
        {canScrollNext && (
          <button
            onClick={handleCarouselNext}
            title="Click to see more series"
            style={{
              background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '10px', fontWeight: 'bold',
              width: adaptive.carouselSize, height: adaptive.carouselSize, border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0
            }}
          >
            •••
          </button>
        )}
      </div>
    </div>
  );
}; 