import { useState, useRef, useEffect, useMemo } from 'react';
import { DataPoint, Series } from '../types';

interface UseAxisAssignmentProps {
  processedSeries: Series[];
  processedData: DataPoint[];
}

interface UseAxisAssignmentReturn {
  seriesAxisAssignment: {[key: string]: 'y' | 'y2'};
  setSeriesAxisAssignment: React.Dispatch<React.SetStateAction<{[key: string]: 'y' | 'y2'}>>;
}

export const useAxisAssignment = ({
  processedSeries,
  processedData
}: UseAxisAssignmentProps): UseAxisAssignmentReturn => {
  
  const [seriesAxisAssignment, setSeriesAxisAssignment] = useState<{[key: string]: 'y' | 'y2'}>({});
  
  // Track if we've done initial auto-assignment
  const hasAutoAssignedRef = useRef(false);
  
  // Compute initial axis assignments based on scale differences
  const initialAxisAssignments = useMemo((): {[key: string]: 'y' | 'y2'} => {
    // Don't run auto-assignment if we already have manual assignments
    if (hasAutoAssignedRef.current) {
      console.log('🔍 AUTO-ASSIGN DEBUG: Already assigned, skipping to preserve manual overrides');
      return {};
    }
    
    if (processedSeries.length <= 1 || processedData.length === 0) {
      console.log('🔍 AUTO-ASSIGN DEBUG: Single series or no data - defaulting to left axis', {
        seriesCount: processedSeries.length,
        dataCount: processedData.length
      });
      // 🔧 FIX: Always assign single series to LEFT axis
      if (processedSeries.length === 1) {
        return { [processedSeries[0].dataKey]: 'y' };
      }
      return {};
    }
    
    const seriesRanges = processedSeries.map(s => {
      const values = processedData.map(d => d[s.dataKey] as number).filter(v => v != null);
      if (values.length === 0) return { dataKey: s.dataKey, name: s.name, min: 0, max: 0, range: 0 };
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { dataKey: s.dataKey, name: s.name, min, max, range: max - min };
    });

    console.log('🔍 AUTO-ASSIGN DEBUG: Series ranges calculated:', seriesRanges);

    // 🔧 FIX: More conservative auto-assignment - only split if scales are VERY different (50x ratio)
    const shouldAutoAssign = seriesRanges.some((range1, i) => 
      seriesRanges.some((range2, j) => {
        if (i !== j && range1.range > 0 && range2.range > 0) {
          const ratio1 = range1.range / range2.range;
          const ratio2 = range2.range / range1.range;
          const shouldAssign = ratio1 > 50 || ratio2 > 50; // 🔧 Changed from 10x to 50x
          console.log(`🔍 AUTO-ASSIGN DEBUG: Comparing ${range1.name} vs ${range2.name}:`, {
            range1: range1.range,
            range2: range2.range,
            ratio1: ratio1.toFixed(2),
            ratio2: ratio2.toFixed(2),
            shouldAssign
          });
          return shouldAssign;
        }
        return false;
      })
    );

    console.log('🔍 AUTO-ASSIGN DEBUG: Should auto-assign?', shouldAutoAssign);

    if (shouldAutoAssign) {
      const assignment: {[key: string]: 'y' | 'y2'} = {};
      
      // Smart scale-based grouping algorithm
      // Step 1: Sort series by range size
      const sortedRanges = [...seriesRanges].sort((a, b) => b.range - a.range);
      console.log('🔍 SMART-ASSIGN DEBUG: Sorted by range:', sortedRanges.map(r => ({ 
        name: r.name, 
        range: r.range, 
        min: r.min, 
        max: r.max 
      })));
      
      // Step 2: Group series with similar scales (within 10x of each other)
      const groups: typeof seriesRanges[] = [];
      
      sortedRanges.forEach(range => {
        // Find a group where this series fits (within 10x range)
        let assignedToGroup = false;
        for (const group of groups) {
          const groupRepresentative = group[0];
          const ratio1 = range.range / groupRepresentative.range;
          const ratio2 = groupRepresentative.range / range.range;
          
          // If ranges are within 10x of each other, add to this group (relaxed from 3x back to 10x)
          if (ratio1 <= 10 && ratio2 <= 10) {
            group.push(range);
            assignedToGroup = true;
            console.log(`🔍 SMART-ASSIGN DEBUG: Added ${range.name} to group with ${groupRepresentative.name} (ratio: ${ratio1.toFixed(2)})`);
            break;
          }
        }
        
        // If no suitable group found, create new group
        if (!assignedToGroup) {
          groups.push([range]);
          console.log(`🔍 SMART-ASSIGN DEBUG: Created new group for ${range.name}`);
        }
      });
      
      console.log('🔍 SMART-ASSIGN DEBUG: Final groups:', groups.map((group, i) => ({
        groupIndex: i,
        axis: i % 2 === 0 ? 'y' : 'y2',
        series: group.map(r => ({ name: r.name, range: r.range }))
      })));
      
      // 🔧 FIX: Ensure first group (largest scales) goes to LEFT axis
      groups.forEach((group, groupIndex) => {
        const axis = groupIndex === 0 ? 'y' : 'y2'; // First group always gets left axis
        group.forEach(range => {
          assignment[range.dataKey] = axis;
        });
      });
      
      console.log('🔍 SMART-ASSIGN DEBUG: Final assignment:', assignment);
      return assignment;
    }
    
    console.log('🔍 AUTO-ASSIGN DEBUG: No auto-assignment needed - defaulting all to left axis');
    // 🔧 FIX: Default all series to left axis when no auto-assignment needed
    const defaultAssignments = Object.fromEntries(
      processedSeries.map(s => [s.dataKey, 'y' as const])
    );
    console.log('🔍 AXIS APPLY DEBUG: Applying default assignments:', defaultAssignments);
    // @ts-ignore - TypeScript incorrectly infers Object.fromEntries type
    setSeriesAxisAssignment(defaultAssignments as {[key: string]: 'y' | 'y2'});
    hasAutoAssignedRef.current = true;

    return defaultAssignments;
  }, [processedSeries, processedData]);
  
  // Apply initial axis assignments ONLY ONCE (and don't override manual changes)
  useEffect(() => {
    console.log('🔍 AXIS APPLY DEBUG: useEffect triggered', {
      hasAutoAssigned: hasAutoAssignedRef.current,
      initialAssignments: initialAxisAssignments,
      currentAssignments: seriesAxisAssignment,
      seriesCount: processedSeries.length
    });
    
    if (hasAutoAssignedRef.current) {
      console.log('🔍 AXIS APPLY DEBUG: Already auto-assigned, skipping to preserve manual overrides');
      return;
    }
    
    if (Object.keys(initialAxisAssignments).length > 0) {
      console.log('🔍 AXIS APPLY DEBUG: Applying auto-assignments:', initialAxisAssignments);
      setSeriesAxisAssignment(initialAxisAssignments);
      hasAutoAssignedRef.current = true;
    } else if (processedSeries.length > 0 && Object.keys(seriesAxisAssignment).length === 0) {
      // If no auto-assignment needed, ensure all series have explicit axis assignments
      const defaultAssignments = Object.fromEntries(
        processedSeries.map(s => [s.dataKey, 'y' as const])
      );
      console.log('🔍 AXIS APPLY DEBUG: Applying default assignments:', defaultAssignments);
      setSeriesAxisAssignment(defaultAssignments as {[key: string]: 'y' | 'y2'});
      hasAutoAssignedRef.current = true;
    }
  }, [initialAxisAssignments, processedSeries]); // Removed seriesAxisAssignment dependency to prevent loops

  return {
    seriesAxisAssignment,
    setSeriesAxisAssignment
  };
}; 