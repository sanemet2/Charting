import { useMemo } from 'react';

interface ResponsiveSettings {
  fontSize: number;
  titleSize: number;
  margin: {
    l: number;
    r: number;
    t: number;
    b: number;
  };
  nticks: number;
  dateFormat: string;
  sampleRate: number;
}

interface UseResponsiveSettingsProps {
  gridSize: string;
}

interface UseResponsiveSettingsReturn {
  responsiveSettings: ResponsiveSettings;
}

export const useResponsiveSettings = ({
  gridSize
}: UseResponsiveSettingsProps): UseResponsiveSettingsReturn => {
  
  // Comprehensive responsive system based on grid size
  const getResponsiveSettings = (gridSize: string): ResponsiveSettings => {
    const settings = {
      '1x1': { 
        fontSize: 16, titleSize: 18, margin: { l: 80, r: 80, t: 20, b: 80 },
        nticks: 10, dateFormat: '%b %Y', sampleRate: 2
      },
      '2x2': { 
        fontSize: 14, titleSize: 16, margin: { l: 60, r: 60, t: 12, b: 70 },
        nticks: 8, dateFormat: '%b %Y', sampleRate: 3
      },
      '3x3': { 
        fontSize: 12, titleSize: 14, margin: { l: 50, r: 50, t: 10, b: 65 },
        nticks: 6, dateFormat: '%b %y', sampleRate: 5
      },
      '4x4': { 
        fontSize: 10, titleSize: 12, margin: { l: 40, r: 40, t: 8, b: 60 },
        nticks: 5, dateFormat: '%b %y', sampleRate: 7
      },
      '5x5': { 
        fontSize: 8, titleSize: 10, margin: { l: 35, r: 35, t: 8, b: 55 },
        nticks: 4, dateFormat: '%b %y', sampleRate: 10
      }
    };
    return settings[gridSize as keyof typeof settings] || settings['3x3'];
  };

  const responsiveSettings = useMemo(() => getResponsiveSettings(gridSize), [gridSize]);

  return {
    responsiveSettings
  };
}; 