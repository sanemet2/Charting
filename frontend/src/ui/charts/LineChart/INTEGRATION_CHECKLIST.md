# LineChart Full Integration Checklist

## 🎯 **Integration Strategy**

We'll replace the existing LineChart.tsx with the new architecture while carefully tracking what can be deleted and when.

## 📋 **Pre-Integration Checklist**

### **✅ New Architecture Files (Already Created)**
- [x] `useChartState.ts` - Central state management
- [x] `useChartActions.ts` - Action creators
- [x] `useLegendCarousel.ts` - Focused carousel logic
- [x] `useSimpleResponsive.ts` - Simplified responsive logic
- [x] `SimpleLineChart.tsx` - Example component

### **📁 Current Files to Track for Deletion**
- [ ] `useChartData.ts` - **DELETE AFTER**: Data processing moved to useChartState
- [ ] `useAxisAssignment.ts` - **DELETE AFTER**: Axis logic moved to useChartState
- [ ] `useLegend.ts` - **DELETE AFTER**: Legend logic split between useChartState + useLegendCarousel
- [ ] `useResponsiveSettings.ts` - **DELETE AFTER**: Replaced by useSimpleResponsive
- [ ] `useInlineEditing.ts` - **DELETE AFTER**: Title editing moved to useChartState

### **📁 Files to Keep**
- [x] `usePlotlyConfig.ts` - **KEEP**: Will be updated to read from new state
- [x] `ChartLegend.tsx` - **KEEP**: Will be updated to use new props
- [x] `debug.ts` - **KEEP**: Utility functions still needed
- [x] `measureText.ts` - **KEEP**: Utility functions still needed

## 🔄 **Integration Steps**

### **Step 1: Backup Current Implementation**
- [ ] Create backup of current `LineChart.tsx` as `LineChart.backup.tsx`
- [ ] Commit current state to git before starting

### **Step 2: Update LineChart.tsx to Use New Architecture**
- [ ] Replace hook imports with new architecture hooks
- [ ] Replace state management with `useChartState` + `useChartActions`
- [ ] Update responsive logic to use `useSimpleResponsive`
- [ ] Update legend logic to use `useLegendCarousel`
- [ ] Keep `usePlotlyConfig` but update its inputs

### **Step 3: Update Supporting Components**
- [ ] Update `ChartLegend.tsx` to work with new state structure
- [ ] Update `usePlotlyConfig.ts` to read from new state format

### **Step 4: Test Integration**
- [ ] Verify chart renders correctly
- [ ] Test title editing functionality
- [ ] Test legend carousel functionality
- [ ] Test responsive behavior
- [ ] Test axis assignment functionality
- [ ] Test data processing with different grid sizes

### **Step 5: Clean Up Old Files (Only After Testing)**
- [ ] Delete `useChartData.ts` - Logic moved to `useChartState.ts`
- [ ] Delete `useAxisAssignment.ts` - Logic moved to `useChartState.ts`
- [ ] Delete `useLegend.ts` - Logic split between `useChartState.ts` + `useLegendCarousel.ts`
- [ ] Delete `useResponsiveSettings.ts` - Replaced by `useSimpleResponsive.ts`
- [ ] Delete `useInlineEditing.ts` - Logic moved to `useChartState.ts`
- [ ] Delete `SimpleLineChart.tsx` - Example no longer needed
- [ ] Update `hooks/index.ts` to remove deleted hook exports

## 📊 **File Tracking Matrix**

| Old File | New Location | Status | Can Delete After |
|----------|-------------|--------|------------------|
| `useChartData.ts` | `useChartState.ts` | ⏳ Pending | Step 2 complete |
| `useAxisAssignment.ts` | `useChartState.ts` | ⏳ Pending | Step 2 complete |
| `useLegend.ts` | `useChartState.ts` + `useLegendCarousel.ts` | ⏳ Pending | Step 2 complete |
| `useResponsiveSettings.ts` | `useSimpleResponsive.ts` | ⏳ Pending | Step 2 complete |
| `useInlineEditing.ts` | `useChartState.ts` | ⏳ Pending | Step 2 complete |
| `usePlotlyConfig.ts` | Updated to use new state | ⏳ Keep & Update | Never |
| `ChartLegend.tsx` | Updated to use new props | ⏳ Keep & Update | Never |

## 🧪 **Testing Checklist**

### **Functionality Tests**
- [ ] Chart renders with data
- [ ] Empty state displays correctly
- [ ] Title editing works (click to edit, submit, cancel)
- [ ] Series names can be edited in legend
- [ ] Axis assignment toggles work (L/R buttons)
- [ ] Legend carousel scrolls correctly
- [ ] Responsive behavior works across grid sizes
- [ ] Data sampling works correctly for different frequencies
- [ ] Chart settings modal still works
- [ ] Chart close button works

### **Performance Tests**
- [ ] Large datasets (30K+ points) render without lag
- [ ] Grid size changes are smooth
- [ ] Legend doesn't cause layout shifts
- [ ] No memory leaks during component unmount

### **Edge Cases**
- [ ] No data series
- [ ] Single data series
- [ ] Very long series names
- [ ] Container resize events
- [ ] Rapid grid size changes

## 🚨 **Rollback Plan**

If integration fails:
1. **Restore backup**: Copy `LineChart.backup.tsx` back to `LineChart.tsx`
2. **Revert hook exports**: Restore old exports in `hooks/index.ts`
3. **Keep new files**: Don't delete new architecture files (for future attempt)

## 📈 **Success Criteria**

Integration is successful when:
- [ ] All existing functionality works exactly as before
- [ ] No performance regressions
- [ ] All tests pass
- [ ] Code is cleaner and more maintainable
- [ ] Old files can be safely deleted

## 🎯 **Post-Integration Benefits**

After successful integration:
- ✅ **Stable architecture** - No more cascading dependencies
- ✅ **Easier feature development** - Work on isolated pieces
- ✅ **Better testing** - Pure functions and focused hooks
- ✅ **Cleaner codebase** - ~5 fewer hook files
- ✅ **Future-proof** - Easy to add new features

---

**Ready to proceed with full integration?** 
This checklist will help us track every step and ensure we can safely delete old files without breaking anything. 