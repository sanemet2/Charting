import { useState, useRef, useEffect, useMemo } from 'react';
import { DataPoint, Series } from '../types';
import { debug, debugCategories } from '../utils/debug';

interface UseAxisAssignmentProps {
  processedSeries: Series[];
  processedData: DataPoint[];
  gridSize: string;
}

interface UseAxisAssignmentReturn {
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{[key: string]: 'y' | 'y2'}>>;
}

export const useAxisAssignment = ({
  processedSeries,
  processedData,
  gridSize
}: UseAxisAssignmentProps): UseAxisAssignmentReturn => {
  
  const [seriesAxisAssignment, setSeriesAxisAssignment] = useState<{[key: string]: 'y' | 'y2'}>({});
  
  // Track if we've done initial auto-assignment AND the grid size it was done for
  const hasAutoAssignedRef = useRef(false);
  const lastGridSizeRef = useRef<string>(gridSize);
  
  // 🔧 FIX: Reset assignment when grid size changes significantly
  useEffect(() => {
    if (lastGridSizeRef.current !== gridSize) {
      debug(debugCategories.AXIS_ASSIGNMENT, {
        message: 'Grid size changed, resetting axis assignment',
        from: lastGridSizeRef.current,
        to: gridSize
      });
      hasAutoAssignedRef.current = false;
      lastGridSizeRef.current = gridSize;
    }
  }, [gridSize]);

  // 🎯 SIMPLIFIED: Basic axis assignment with smart defaults
  const initialAxisAssignments = useMemo((): {[key: string]: 'y' | 'y2'} => {
    // Don't run assignment if we already have manual assignments for this grid size
    if (hasAutoAssignedRef.current && lastGridSizeRef.current === gridSize) {
      debug(debugCategories.AXIS_ASSIGNMENT, { message: 'Already assigned for this grid size, preserving manual overrides' });
      return {};
    }
    
    if (processedSeries.length === 0) {
      return {};
    }
    
    // Simple default: all series start on left axis
    // Users can manually switch via legend if needed
    const defaultAssignments = Object.fromEntries(
      processedSeries.map(s => [s.dataKey, 'y' as const])
    );
    
    debug(debugCategories.AXIS_ASSIGNMENT, { 
      message: 'Simple assignment - all series to left axis',
      seriesCount: processedSeries.length 
    });
    
    return defaultAssignments;
  }, [processedSeries, gridSize]);
  
  // Apply initial axis assignments ONLY ONCE per grid size (and don't override manual changes)
  useEffect(() => {
    debug(debugCategories.AXIS_ASSIGNMENT, {
      message: 'Apply effect triggered',
      hasAutoAssigned: hasAutoAssignedRef.current,
      seriesCount: processedSeries.length
    });
    
    if (hasAutoAssignedRef.current && lastGridSizeRef.current === gridSize) {
      debug(debugCategories.AXIS_ASSIGNMENT, { message: 'Already auto-assigned, preserving manual overrides' });
      return;
    }
    
    if (processedSeries.length > 0) {
      if (Object.keys(initialAxisAssignments).length > 0) {
        debug(debugCategories.AXIS_ASSIGNMENT, { message: 'Applying auto-assignments', assignmentCount: Object.keys(initialAxisAssignments).length });
        setSeriesAxisAssignment(initialAxisAssignments);
      } else {
        const defaultAssignments = Object.fromEntries(
          processedSeries.map(s => [s.dataKey, 'y' as const])
        );
        debug(debugCategories.AXIS_ASSIGNMENT, { message: 'Applying default assignments', assignmentCount: Object.keys(defaultAssignments).length });
        setSeriesAxisAssignment(defaultAssignments as {[key: string]: 'y' | 'y2'});
      }
      hasAutoAssignedRef.current = true;
      lastGridSizeRef.current = gridSize;
    }
  }, [initialAxisAssignments, processedSeries, gridSize]);

  return {
    seriesAxisAssignment,
    setSeriesAxisAssignment
  };
}; 