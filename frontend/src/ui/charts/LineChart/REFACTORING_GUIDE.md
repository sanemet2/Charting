# LineChart Refactoring Guide

## 🎯 **Problem Solved**

**Before**: Cascading dependencies made it hard to work on individual features
```
useChartData → useAxisAssignment → useLegend → usePlotlyConfig
     ↓              ↓                ↓              ↓
  Changes here ripple through everything below
```

**After**: Independent hooks that read from central state
```
useChartState (Central State)
     ↓
├── useLegendCarousel (Independent)
├── useSimpleResponsive (Independent)  
├── usePlotlyConfig (Independent)
└── useChartActions (Independent)
```

## 🏗️ **New Architecture Benefits**

### **1. Stability**
- **Single source of truth** eliminates timing issues
- **Pure functions** for data processing (easier to test)
- **Predictable state updates** via reducer pattern

### **2. Incremental Development**
- **Work on one piece at a time** without breaking others
- **Independent hooks** can be developed/tested separately
- **Gradual migration** - old and new can coexist

### **3. Easier Debugging**
- **Centralized state** makes debugging simpler
- **Action-based updates** are easier to trace
- **Pure functions** can be tested in isolation

## 🔄 **Migration Strategy**

### **Phase 1: Add New Hooks (✅ Done)**
- ✅ `useChartState` - Central state management
- ✅ `useChartActions` - Action creators
- ✅ `useLegendCarousel` - Carousel logic only
- ✅ `useSimpleResponsive` - Container dimensions only

### **Phase 2: Migrate One Feature at a Time**

#### **Option A: Start Fresh (Recommended for new features)**
```tsx
// Use the new architecture from scratch
const MyNewChart = () => {
  const { state, dispatch } = useChartState(props);
  const actions = useChartActions(dispatch);
  const responsive = useSimpleResponsive({ containerRef, gridSize });
  
  // Much simpler!
};
```

#### **Option B: Gradual Migration (For existing components)**
```tsx
// Replace one hook at a time
const LineChart = () => {
  // NEW: Central state
  const { state, dispatch } = useChartState(props);
  const actions = useChartActions(dispatch);
  
  // OLD: Keep existing hooks temporarily
  const { plotlyData, plotlyLayout } = usePlotlyConfig({
    processedData: state.processedData, // Read from new state
    processedSeries: state.processedSeries,
    // ... other props
  });
  
  // Gradually replace old hooks with new ones
};
```

## 🛠️ **How to Work on Individual Features**

### **Working on Legend Carousel**
```tsx
// Only need to focus on carousel logic
const carousel = useLegendCarousel({
  processedSeries: state.processedSeries,
  seriesNames: state.seriesNames,
  carouselOffset: state.carouselOffset,
  containerWidth: responsive.containerDimensions.width,
  fontSize: responsive.responsiveSettings.fontSize
});

// Test carousel independently
const TestCarousel = () => {
  const mockState = { /* test data */ };
  const carousel = useLegendCarousel(mockState);
  return <div>{/* test carousel rendering */}</div>;
};
```

### **Working on Responsive Behavior**
```tsx
// Only need to focus on responsive logic
const responsive = useSimpleResponsive({ containerRef, gridSize });

// Test responsive independently
const TestResponsive = () => {
  const containerRef = useRef(null);
  const responsive = useSimpleResponsive({ containerRef, gridSize: '3x3' });
  return <div ref={containerRef}>{/* test responsive behavior */}</div>;
};
```

### **Working on Data Processing**
```tsx
// Pure functions can be tested without React
import { processChartData } from './useChartState';

// Test data processing independently
const testData = { /* mock state */ };
const result = processChartData(testData);
expect(result.processedData).toEqual(/* expected result */);
```

## 📋 **Step-by-Step Migration Checklist**

### **For New Features**
- [ ] Use `useChartState` for state management
- [ ] Use `useChartActions` for state updates
- [ ] Use focused hooks (`useLegendCarousel`, `useSimpleResponsive`)
- [ ] Write tests for individual hooks
- [ ] No need to touch existing code

### **For Existing Features**
- [ ] Identify the feature you want to work on
- [ ] Replace the relevant old hook with new focused hook
- [ ] Update state reads to use `state.propertyName`
- [ ] Update state writes to use `actions.actionName()`
- [ ] Test the feature independently
- [ ] Gradually migrate other features

## 🧪 **Testing Strategy**

### **Unit Tests for Pure Functions**
```tsx
// Test data processing logic
describe('processChartData', () => {
  it('should sample daily data correctly', () => {
    const mockState = { /* test data */ };
    const result = processChartData(mockState);
    expect(result.processedData.length).toBe(expectedLength);
  });
});
```

### **Hook Tests**
```tsx
// Test hooks independently
describe('useLegendCarousel', () => {
  it('should calculate visible items correctly', () => {
    const { result } = renderHook(() => useLegendCarousel(mockProps));
    expect(result.current.visibleItems.length).toBe(2);
  });
});
```

### **Integration Tests**
```tsx
// Test component with new architecture
describe('SimpleLineChart', () => {
  it('should render with new hooks', () => {
    render(<SimpleLineChart {...mockProps} />);
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
  });
});
```

## 🎯 **Next Steps**

1. **Try the new architecture** with a simple feature first
2. **Migrate one hook at a time** from your existing component
3. **Write tests** for each piece as you migrate
4. **Keep both architectures** until migration is complete
5. **Remove old hooks** once everything is migrated

## 💡 **Pro Tips**

- **Start with the simplest feature** (like title editing)
- **Test each piece independently** before integrating
- **Use the example component** as a reference
- **Don't migrate everything at once** - be incremental
- **Keep the old code** until you're confident in the new version

The new architecture makes your LineChart much more maintainable and allows you to work on individual features without fear of breaking everything else! 🚀 