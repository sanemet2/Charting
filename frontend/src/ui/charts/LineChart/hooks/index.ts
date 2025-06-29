// Export all LineChart hooks from a single entry point

// 🎯 REFACTORED HOOKS (New Architecture)
export { useChartState } from './useChartState';
export { useChartActions } from './useChartActions';
export { useLegendCarousel } from './useLegendCarousel';
export { useSimpleResponsive } from './useSimpleResponsive';

// 🔄 EXISTING HOOKS (Legacy - can be gradually replaced)
export { useChartData } from './useChartData';
export { useAxisAssignment } from './useAxisAssignment';
export { useResponsiveSettings } from './useResponsiveSettings';
export { usePlotlyConfig } from './usePlotlyConfig';
export { useInlineEditing } from './useInlineEditing';
export { useLegend } from './useLegend';

// 🎉 REFACTORING STRATEGY: 
// 1. New components can use the new hooks immediately
// 2. Existing components can be migrated one piece at a time
// 3. Both architectures can coexist during transition 