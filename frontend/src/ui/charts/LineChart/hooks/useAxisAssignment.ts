import { useState, useEffect } from 'react';
import { DataPoint, Series } from '../types';
import { debug, debugCategories } from '../utils/debug';

interface UseAxisAssignmentProps {
  processedSeries: Series[];
}

interface UseAxisAssignmentReturn {
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{[key: string]: 'y' | 'y2'}>>;
}

export const useAxisAssignment = ({
  processedSeries
}: UseAxisAssignmentProps): UseAxisAssignmentReturn => {
  
  const [seriesAxisAssignment, setSeriesAxisAssignment] = useState<{[key: string]: 'y' | 'y2'}>({});

  useEffect(() => {
    debug(debugCategories.AXIS_ASSIGNMENT, { 
      message: "Syncing axis assignments with processed series",
      currentAssignments: seriesAxisAssignment,
      processedSeriesCount: processedSeries.length
    });

    const newAssignments = { ...seriesAxisAssignment };
    let needsUpdate = false;

    // Remove assignments for series that no longer exist
    for (const seriesId in newAssignments) {
      if (!processedSeries.some(s => s.dataKey === seriesId)) {
        delete newAssignments[seriesId];
        needsUpdate = true;
        debug(debugCategories.AXIS_ASSIGNMENT, { message: `Series ${seriesId} removed, deleting assignment` });
      }
    }

    // Add default assignment for new series
    processedSeries.forEach(series => {
      if (!newAssignments[series.dataKey]) {
        newAssignments[series.dataKey] = 'y'; // Default to left axis
        needsUpdate = true;
        debug(debugCategories.AXIS_ASSIGNMENT, { message: `Series ${series.dataKey} is new, assigning to left axis` });
      }
    });

    if (needsUpdate) {
      debug(debugCategories.AXIS_ASSIGNMENT, { message: "Updating axis assignments state", newAssignments });
      setSeriesAxisAssignment(newAssignments);
    }
  }, [processedSeries]);

  return {
    seriesAxisAssignment,
    setSeriesAxisAssignment
  };
}; 