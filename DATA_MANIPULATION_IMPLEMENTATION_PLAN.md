# 📊 Data Manipulation Feature Implementation Plan

## 🎯 Design Decisions Summary

Based on our planning discussion, here are the finalized design decisions:

✅ **Modal Layout**: One big modal with vertical sections (like settings)  
✅ **Button**: Calculator icon (🧮) next to settings button  
✅ **Series Display**: No visual distinction - treat derived series like regular series  
✅ **Auto-Naming**: Descriptive format ("SPX Index YoY %") with full rename capability  
✅ **Modal Actions**: Simple [Cancel] [Apply] buttons  
✅ **Data Approach**: Manipulate existing series (destructive with undo)  
✅ **Scope**: Individual series selection and transformation  

---

## 🚀 Phase 1: Core UI Structure

### 1.1 Add Data Manipulation Button ✅ **COMPLETED**
- [x] Add calculator button (🧮) to chart header next to settings in `LineChart.tsx`
- [x] Add `showManipulation` state to component state
- [x] Style button consistently with existing chart actions using same CSS classes
- [x] Add tooltip: "Data manipulation tools"

**Files to modify:**
- `frontend/src/ui/charts/LineChart.tsx`

**🔍 CRITICAL CHECKPOINT 1.1:** ✅ **PASSED**
```bash
# Verify button appears and works
npm start
# Navigate to chart with data
# ✅ Calculator button (🧮) appears next to settings button
# ✅ Button has consistent styling with settings button
# ✅ Clicking button shows console.log("Data manipulation clicked!")
# ✅ No console errors
```
**Verification Date:** 2025-06-30 - All tests passed successfully!

### 1.2 Create DataManipulationModal Component
- [ ] Create `DataManipulationModal.tsx` in `frontend/src/ui/components/`
- [ ] Create `DataManipulationModal.css` for styling
- [ ] Implement modal structure with vertical sections:
  - **Year-over-Year Operations** section
  - **Mathematical Operations** section  
  - **Lead/Lag Operations** section
- [ ] Add [Cancel] [Apply] footer buttons
- [ ] Use same styling patterns as `ChartSettingsModal`
- [ ] Add modal backdrop and close functionality

**Files to create:**
- `frontend/src/ui/components/DataManipulationModal.tsx`
- `frontend/src/ui/components/DataManipulationModal.css`

**Files to modify:**
- `frontend/src/ui/components/index.ts` (export new component)

### 1.3 Build Operation Sections (UI Only)
- [ ] **YoY Section**: 
  - Series selector dropdown
  - Frequency dropdown (Year-over-Year, Quarter-over-Quarter, Month-over-Month)
  - Calculation type dropdown (Percentage Change, Basis Point Change)
- [ ] **Math Section**: 
  - Primary series selector dropdown
  - Operation dropdown (Add, Subtract, Multiply, Divide)
  - Secondary series selector dropdown
- [ ] **Lead/Lag Section**: 
  - Series selector dropdown
  - Direction radio buttons (Lead/Lag)
  - Period input field with unit selector (days/months/years)

**UI Components needed:**
- Dropdown components for series selection
- Form controls for each operation type
- Input validation styling

**🔍 CRITICAL CHECKPOINT 1.3:**
```bash
# Verify complete modal UI works
npm start
# Navigate to chart with data, click calculator button
# ✅ Modal opens with all three sections visible
# ✅ All dropdowns populate with actual series names
# ✅ All form controls are functional (can select/type)
# ✅ Cancel button closes modal
# ✅ Apply button shows console.log("Apply clicked with:", formData)
# ✅ Modal styling matches ChartSettingsModal
```

---

## 🚀 Phase 2: State Management Integration

### 2.1 Extend Chart State
- [ ] Add manipulation modal state to `ChartState` interface in `useChartState.ts`:
  ```typescript
  // Manipulation State
  showManipulationModal: boolean;
  manipulationHistory: ManipulationOperation[];
  currentOperation: ManipulationOperation | null;
  ```
- [ ] Add transformation history for undo functionality
- [ ] Add current operation state tracking

**Files to modify:**
- `frontend/src/ui/charts/LineChart/hooks/useChartState.ts`

### 2.2 Add Chart Actions
- [ ] Add manipulation modal actions to `useChartActions.ts`:
  ```typescript
  setManipulationModal: (show: boolean) => void;
  applyManipulation: (operation: ManipulationOperation) => void;
  undoLastManipulation: () => void;
  resetSeriesToOriginal: (seriesId: string) => void;
  ```
- [ ] Add series transformation actions
- [ ] Add undo/reset actions

**Files to modify:**
- `frontend/src/ui/charts/LineChart/hooks/useChartActions.ts`

### 2.3 Update State Reducer
- [ ] Add manipulation action types to `ChartAction` union type
- [ ] Add manipulation action handlers to `chartReducer`:
  ```typescript
  | { type: 'SET_MANIPULATION_MODAL'; payload: boolean }
  | { type: 'APPLY_MANIPULATION'; payload: ManipulationOperation }
  | { type: 'UNDO_MANIPULATION' }
  | { type: 'RESET_SERIES'; payload: string }
  ```
- [ ] Implement undo/history management
- [ ] Handle series name updates after transformations

**Files to modify:**
- `frontend/src/ui/charts/LineChart/hooks/useChartState.ts`

**🔍 CRITICAL CHECKPOINT 2.3:**
```bash
# Verify state management integration works
npm start
# Open browser dev tools console
# Navigate to chart, click calculator button
# ✅ Modal opens (state management working)
# ✅ Console shows: "Chart state updated: showManipulationModal: true"
# ✅ Close modal, console shows: "Chart state updated: showManipulationModal: false"
# ✅ No TypeScript compilation errors
# ✅ All existing chart functionality still works normally
```

---

## 🚀 Phase 3: Data Manipulation Logic

### 3.1 Create Type Definitions
- [ ] Create `DataManipulationTypes.ts` with interfaces:
  ```typescript
  interface ManipulationOperation {
    id: string;
    type: 'yoy' | 'math' | 'leadlag';
    targetSeriesId: string;
    parameters: YoYParams | MathParams | LeadLagParams;
    timestamp: string;
    resultName: string;
  }
  
  interface YoYParams {
    frequency: 'year' | 'quarter' | 'month';
    calculationType: 'percentage' | 'basisPoints';
  }
  
  interface MathParams {
    operation: 'add' | 'subtract' | 'multiply' | 'divide';
    secondarySeriesId: string;
  }
  
  interface LeadLagParams {
    direction: 'lead' | 'lag';
    periods: number;
    unit: 'days' | 'months' | 'years';
  }
  ```

**Files to create:**
- `frontend/src/ui/charts/LineChart/types/DataManipulationTypes.ts`

### 3.2 Create Utility Functions
- [ ] Create `dataManipulationUtils.ts` with pure functions:
  ```typescript
  calculateYearOverYear(data: DataPoint[], params: YoYParams): DataPoint[]
  performMathOperation(primaryData: DataPoint[], secondaryData: DataPoint[], operation: string): DataPoint[]
  applyLeadLag(data: DataPoint[], params: LeadLagParams): DataPoint[]
  generateTransformedName(originalName: string, operation: ManipulationOperation): string
  validateOperation(operation: ManipulationOperation, availableSeries: Series[]): boolean
  ```

**Files to create:**
- `frontend/src/ui/charts/LineChart/utils/dataManipulationUtils.ts`

**🔍 CRITICAL CHECKPOINT 3.2:**
```bash
# Verify utility functions work correctly
node -e "
const utils = require('./frontend/src/ui/charts/LineChart/utils/dataManipulationUtils.ts');
// Test YoY calculation
const testData = [{date:'2023-01-01',value:100},{date:'2024-01-01',value:110}];
const result = utils.calculateYearOverYear(testData, {frequency:'year',calculationType:'percentage'});
console.log('YoY Test Result:', result);
// Expected: [{date:'2024-01-01',value:10}] (10% increase)
"
# ✅ YoY calculation returns correct percentage
# ✅ Math operations work correctly
# ✅ Lead/lag operations shift data properly
# ✅ Name generation creates descriptive names
# ✅ All functions are pure (no side effects)
```

### 3.3 Wire Up Operations
- [ ] Connect YoY operations to actual calculations
- [ ] Connect math operations to actual calculations
- [ ] Connect lead/lag operations to actual calculations
- [ ] Add input validation and error handling
- [ ] Integrate with existing data processing pipeline in `useChartState.ts`

**Files to modify:**
- `frontend/src/ui/charts/LineChart/hooks/useChartState.ts` (integrate with `processChartData`)

### 3.4 Add Undo/Reset Functionality
- [ ] Implement operation history tracking
- [ ] Add "Reset to Original" functionality
- [ ] Add operation indicators in UI
- [ ] Store original data for reset capability

**🔍 CRITICAL CHECKPOINT 3.4 (END-TO-END):**
```bash
# Verify complete data manipulation workflow
npm start
# Navigate to chart with data (e.g., SPX Index, AAPL)
# Test YoY Operation:
# 1. Click calculator button → ✅ Modal opens
# 2. Select "SPX Index" → ✅ Series populates
# 3. Select "Year-over-Year" → ✅ Frequency set
# 4. Select "Percentage Change" → ✅ Type set
# 5. Click Apply → ✅ Chart updates, series name becomes "SPX Index YoY %"
# 6. Verify data looks correct (% changes year-over-year)
# Test Math Operation:
# 7. Click calculator again → ✅ Modal opens
# 8. Select "AAPL" + "SPX Index" → ✅ Both series selected
# 9. Click Apply → ✅ Chart shows combined series "AAPL + SPX Index"
# Test Undo:
# 10. Check console for undo options → ✅ Can reset any series to original
# ✅ All operations work end-to-end
# ✅ Chart renders correctly after each operation
# ✅ No data corruption or console errors
```

---

## 🏗️ Architecture Compliance

Following the established LineChart architecture patterns:

**State-First Design**: All manipulation state will live in central `ChartState`  
**Action Pattern**: New manipulation actions will follow existing action patterns  
**Hook Independence**: New hooks will communicate only through central state  
**Golden Rule**: No direct hook-to-hook dependencies

### Architecture Integration Points:
- `useChartState` - Holds manipulation state and history
- `useChartActions` - Provides manipulation action creators
- `usePlotlyConfig` - Renders manipulated data (no changes needed)
- New utility functions remain pure and testable

---

## 🎨 UI Mockup

```
┌─ Data Manipulation ─────────────────────┐
│                                     [✕] │
├─────────────────────────────────────────┤
│ Year-over-Year Operations               │
│ ┌─────────────────────────────────────┐ │
│ │ Series: [SPX Index ▼]               │ │
│ │ Frequency: [Year-over-Year ▼]       │ │
│ │ Type: [Percentage Change ▼]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Mathematical Operations                 │
│ ┌─────────────────────────────────────┐ │
│ │ Primary: [SPX Index ▼]              │ │
│ │ Operation: [Add ▼]                  │ │
│ │ Secondary: [AAPL ▼]                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Lead/Lag Operations                     │
│ ┌─────────────────────────────────────┐ │
│ │ Series: [SPX Index ▼]               │ │
│ │ Direction: [Lead ▼]                 │ │
│ │ Periods: [3] months                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                    [Cancel] [Apply]     │
└─────────────────────────────────────────┘
```

---

## 📁 File Structure

```
frontend/src/ui/
├── components/
│   ├── DataManipulationModal.tsx        # NEW
│   ├── DataManipulationModal.css        # NEW
│   └── index.ts                         # MODIFIED
├── charts/LineChart/
│   ├── hooks/
│   │   ├── useChartState.ts            # MODIFIED
│   │   └── useChartActions.ts          # MODIFIED
│   ├── types/
│   │   ├── index.ts                    # MODIFIED
│   │   └── DataManipulationTypes.ts    # NEW
│   ├── utils/
│   │   ├── index.ts                    # MODIFIED
│   │   └── dataManipulationUtils.ts    # NEW
│   └── LineChart.tsx                   # MODIFIED
```

---

## 🧪 Testing Strategy

### Phase 1 Testing:
- [ ] Modal opens/closes correctly
- [ ] Button styling matches existing patterns
- [ ] All form controls render properly

### Phase 2 Testing:
- [ ] State updates correctly
- [ ] Actions dispatch properly
- [ ] No console errors in browser

### Phase 3 Testing:
- [ ] Mathematical operations produce correct results
- [ ] YoY calculations are accurate
- [ ] Lead/lag operations work correctly
- [ ] Undo functionality works
- [ ] Error handling for invalid operations

---

## 🚀 Implementation Order

**Phase 1: UI Foundation**
1. **Start with 1.1** → CHECKPOINT 1.1 ✅ **COMPLETED**
2. **Build 1.2-1.3** → CHECKPOINT 1.3 ⏳ **IN PROGRESS**

**Phase 2: State Integration** 
3. **Complete 2.1-2.3** → CHECKPOINT 2.3 ✅

**Phase 3: Logic & Testing**
4. **Build 3.1-3.2** → CHECKPOINT 3.2 ✅  
5. **Complete 3.3-3.4** → CHECKPOINT 3.4 ✅

**🎯 Each checkpoint must pass before proceeding to the next phase!**

---

## 📝 Notes

- Keep all operations pure functions for testability
- Follow existing naming conventions
- Use TypeScript strictly for type safety
- Maintain backward compatibility with existing charts
- Consider performance for large datasets
- Plan for future extensibility (more operation types)

---

**Ready to start implementation? Begin with Phase 1.1 - adding the calculator button to the chart header!** 