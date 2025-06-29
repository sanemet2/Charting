// Export all LineChart hooks from a single entry point

// 🎯 NEW ARCHITECTURE: State-first hooks
export { useChartState } from './useChartState';
export { useChartActions } from './useChartActions';
export { useLegendCarousel } from './useLegendCarousel';
export { useSimpleResponsive } from './useSimpleResponsive';

// 🎯 KEEP: Plotly configuration hook (updated to use new state)
export { usePlotlyConfig } from './usePlotlyConfig';

// 🎯 OLD ARCHITECTURE: These will be deleted after integration
// export { useChartData } from './useChartData';
// export { useAxisAssignment } from './useAxisAssignment';
// export { useLegend } from './useLegend';
// export { useResponsiveSettings } from './useResponsiveSettings';
// export { useInlineEditing } from './useInlineEditing';

// 🎉 REFACTORING STRATEGY: 
// 1. New components can use the new hooks immediately
// 2. Existing components can be migrated one piece at a time
// 3. Both architectures can coexist during transition 