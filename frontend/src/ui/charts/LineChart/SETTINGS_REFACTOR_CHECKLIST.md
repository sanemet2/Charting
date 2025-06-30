# LineChart Settings Refactor Checklist

This document provides a step-by-step checklist to refactor the LineChart settings system to follow the established architecture guide. Each step should be completed and verified before moving to the next.

## 🎯 **Goals**
1. Move settings from local React state into central `useChartState`
2. Remove unused settings (legend, axis labels)
3. Add dynamic series color support
4. Ensure grid lines and tooltips work properly

---

## **Phase 1: Architecture Fix** ⚙️

### **Step A1: Move Settings to Central State**

#### **A1.1 - Add settings to ChartState interface**
- [ ] Open `frontend/src/ui/charts/LineChart/hooks/useChartState.ts`
- [ ] Add import: `import { ChartSettings } from '../../../components/ChartSettingsModal';`
- [ ] Add `settings: ChartSettings;` to the `ChartState` interface (around line 6-32)

#### **A1.2 - Add settings to initial state**
- [ ] In the same file, add settings to `initialState` object (around line 47-65)
- [ ] Use these default values:
```typescript
settings: {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  axisLabels: {
    xAxis: '',
    yAxis: ''
  },
  colors: {
    primary: '#6366f1',
    secondary: '#f43f5e'
  }
}
```

#### **A1.3 - Add settings action type**
- [ ] Add to `ChartAction` type union (around line 34-45):
```typescript
| { type: 'SET_SETTINGS'; payload: ChartSettings }
```

#### **A1.4 - Add settings reducer case**
- [ ] Add case to `chartReducer` function (around line 140-250):
```typescript
case 'SET_SETTINGS':
  return {
    ...state,
    settings: action.payload
  };
```

**✅ Verification A1:** 
- [ ] TypeScript compiles without errors
- [ ] No console errors when running the app
- [ ] **STOP HERE AND TEST** - Run `npm start` and verify app loads without errors

---

### **Step A2: Add Settings Actions**

#### **A2.1 - Add settings action creator**
- [ ] Open `frontend/src/ui/charts/LineChart/hooks/useChartActions.ts`
- [ ] Add import: `import { ChartSettings } from '../../../components/ChartSettingsModal';`
- [ ] Add this function to the returned object:
```typescript
setSettings: (settings: ChartSettings) => {
  dispatch({ type: 'SET_SETTINGS', payload: settings });
}
```

**✅ Verification A2:**
- [ ] TypeScript compiles without errors
- [ ] `useChartActions` exports the new `setSettings` function
- [ ] **STOP HERE AND TEST** - App still runs, no new errors in console

---

### **Step A3: Fix Settings Integration**

#### **A3.1 - Update LineChart component imports**
- [ ] Open `frontend/src/ui/charts/LineChart.tsx`
- [ ] Remove this import if it exists: `import ChartSettingsModal, { ChartSettings } from '../components/ChartSettingsModal';`
- [ ] Add this import: `import ChartSettingsModal from '../components/ChartSettingsModal';`

#### **A3.2 - Remove local settings state**
- [ ] In `LineChart.tsx`, find and remove these lines (around line 65-66):
```typescript
const [showSettings, setShowSettings] = React.useState(false);
const [settings, setSettings] = React.useState<ChartSettings>(defaultSettings);
```
- [ ] Replace with:
```typescript
const [showSettings, setShowSettings] = React.useState(false);
```

#### **A3.3 - Remove defaultSettings constant**
- [ ] Remove the entire `defaultSettings` constant (around line 15-25)

#### **A3.4 - Fix usePlotlyConfig call**
- [ ] Find the `usePlotlyConfig` call (around line 56-62)
- [ ] Change `settings: defaultSettings,` to `settings: state.settings,`

#### **A3.5 - Update settings save handler**
- [ ] Find `handleSettingsSave` function (around line 132-134)
- [ ] Replace with:
```typescript
const handleSettingsSave = (newSettings: ChartSettings) => {
  actions.setSettings(newSettings);
};
```

#### **A3.6 - Update ChartSettingsModal props**
- [ ] Find the `<ChartSettingsModal>` component (around line 283-289)
- [ ] Change `settings={settings}` to `settings={state.settings}`

**✅ Verification A3:**
- [ ] TypeScript compiles without errors
- [ ] App runs without console errors
- [ ] Settings modal opens when clicking gear icon
- [ ] Settings modal shows current values
- [ ] **CRITICAL TEST**: Toggle "Show Grid Lines" and verify grid appears/disappears on chart
- [ ] **STOP HERE AND TEST** - Settings should now be fully working! Grid toggle is the key test.

---

## **Phase 2: UI Cleanup** 🧹

### **Step B1: Remove Show Legend Option**

#### **B1.1 - Update ChartSettings interface**
- [ ] Open `frontend/src/ui/components/ChartSettingsModal.tsx`
- [ ] Remove `showLegend: boolean;` from `ChartSettings` interface (around line 8)

#### **B1.2 - Remove legend checkbox from modal**
- [ ] In the same file, find and remove the entire legend checkbox section (around line 105-112):
```typescript
<label className="checkbox-label">
  <input
    type="checkbox"
    checked={localSettings.showLegend}
    onChange={(e) => setLocalSettings({ ...localSettings, showLegend: e.target.checked })}
  />
  <span>Show Legend</span>
</label>
```

#### **B1.3 - Update initial state**
- [ ] Go back to `useChartState.ts`
- [ ] Remove `showLegend: true,` from the settings object in `initialState`

**✅ Verification B1:**
- [ ] TypeScript compiles without errors
- [ ] Settings modal opens without legend option
- [ ] Chart legend still shows (controlled by separate logic)

---

### **Step B2: Remove Axis Labels Section**

#### **B2.1 - Update ChartSettings interface**
- [ ] In `ChartSettingsModal.tsx`, remove the entire `axisLabels` property:
```typescript
axisLabels: {
  xAxis: string;
  yAxis: string;
};
```

#### **B2.2 - Remove axis labels section from modal**
- [ ] Remove the entire "Axis Labels" section (around line 122-147):
```typescript
{/* Axis Labels */}
<div className="settings-section">
  <h3>Axis Labels</h3>
  
  <div className="input-group">
    <label>X-Axis Label</label>
    <input
      type="text"
      value={localSettings.axisLabels.xAxis}
      onChange={(e) => handleAxisLabelChange('xAxis', e.target.value)}
      placeholder="Enter X-axis label"
      className="settings-input"
    />
  </div>

  <div className="input-group">
    <label>Y-Axis Label</label>
    <input
      type="text"
      value={localSettings.axisLabels.yAxis}
      onChange={(e) => handleAxisLabelChange('yAxis', e.target.value)}
      placeholder="Enter Y-axis label"
      className="settings-input"
    />
  </div>
</div>
```

#### **B2.3 - Remove handleAxisLabelChange function**
- [ ] Remove the `handleAxisLabelChange` function (around line 70-77)

#### **B2.4 - Update initial state**
- [ ] In `useChartState.ts`, remove `axisLabels` from settings in `initialState`

#### **B2.5 - Update usePlotlyConfig**
- [ ] Open `frontend/src/ui/charts/LineChart/hooks/usePlotlyConfig.ts`
- [ ] Find all references to `settings.axisLabels.yAxis` and replace with empty string `''`

**✅ Verification B2:**
- [ ] TypeScript compiles without errors
- [ ] Settings modal opens without axis labels section
- [ ] Chart still renders properly

---

## **Phase 3: Core Functionality Verification** ✅

### **Step B4: Verify Show Grid Lines**
- [ ] Open the chart in browser
- [ ] Click settings gear icon
- [ ] Toggle "Show Grid Lines" ON → verify grid lines appear
- [ ] Toggle "Show Grid Lines" OFF → verify grid lines disappear
- [ ] **Expected behavior**: Grid should show/hide immediately

### **Step B5: Verify Show Tooltips**
- [ ] With tooltips ON: hover over chart lines → should see tooltip
- [ ] Turn tooltips OFF in settings → hover over chart lines → no tooltip
- [ ] Turn tooltips back ON → tooltips should work again
- [ ] **Expected behavior**: Tooltips show/hide based on setting

**✅ Verification Phase 3:**
- [ ] Both grid lines and tooltips respond correctly to settings
- [ ] Settings persist when reopening the modal
- [ ] No console errors during testing

---

## **Phase 4: Dynamic Series Colors** 🎨

### **Step B3: Expand Colors for Multiple Series**

#### **B3.1 - Update ChartSettings interface**
- [ ] In `ChartSettingsModal.tsx`, change colors property:
```typescript
// FROM:
colors: {
  primary: string;
  secondary: string;
};

// TO:
colors: { [seriesId: string]: string };
```

#### **B3.2 - Add series prop to modal**
- [ ] Add `processedSeries: Series[]` to `ChartSettingsModalProps` interface
- [ ] Import `Series` type: `import { Series } from '../../charts/LineChart/types';`

#### **B3.3 - Update modal component**
- [ ] Replace the entire Colors section with dynamic color pickers:
```typescript
{/* Colors */}
<div className="settings-section">
  <h3>Series Colors</h3>
  
  {processedSeries.map((series, index) => (
    <div key={series.dataKey} className="color-group">
      <label>{seriesNames[series.dataKey] || series.name}</label>
      <div className="color-input-wrapper">
        <input
          type="color"
          value={localSettings.colors[series.dataKey] || '#6366f1'}
          onChange={(e) => handleSeriesColorChange(series.dataKey, e.target.value)}
          className="color-picker"
        />
        <input
          type="text"
          value={localSettings.colors[series.dataKey] || '#6366f1'}
          onChange={(e) => handleSeriesColorChange(series.dataKey, e.target.value)}
          className="color-text"
        />
      </div>
    </div>
  ))}
</div>
```

#### **B3.4 - Add color change handler**
- [ ] Replace `handleColorChange` with:
```typescript
const handleSeriesColorChange = (seriesId: string, color: string) => {
  setLocalSettings({
    ...localSettings,
    colors: {
      ...localSettings.colors,
      [seriesId]: color
    }
  });
};
```

#### **B3.5 - Update LineChart modal call**
- [ ] In `LineChart.tsx`, add props to `<ChartSettingsModal>`:
```typescript
<ChartSettingsModal
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  settings={state.settings}
  onSave={handleSettingsSave}
  chartType="line"
  processedSeries={state.processedSeries}
  seriesNames={state.seriesNames}
/>
```

#### **B3.6 - Update usePlotlyConfig color logic**
- [ ] In `usePlotlyConfig.ts`, update `getSeriesColor` function:
```typescript
const getSeriesColor = (s: any, index: number) => {
  return settings.colors[s.dataKey] || s.color || ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'][index % 5];
};
```

#### **B3.7 - Initialize colors for new series**
- [ ] In `useChartState.ts`, update the `PROCESS_DATA` case to initialize colors:
```typescript
// Initialize series colors
const newColors = { ...state.settings.colors };
const defaultColors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
processedSeries.forEach((series, index) => {
  if (!newColors[series.dataKey]) {
    newColors[series.dataKey] = defaultColors[index % defaultColors.length];
  }
});

return {
  ...state,
  processedData,
  processedSeries,
  seriesAxisAssignment: newAxisAssignments,
  seriesNames: newSeriesNames,
  settings: {
    ...state.settings,
    colors: newColors
  }
};
```

**✅ Verification B3:**
- [ ] Settings modal shows one color picker per data series
- [ ] Color changes immediately affect the chart
- [ ] New series get default colors automatically
- [ ] Color settings persist when reopening modal

---

## **Final Verification** 🎉

### **Complete System Test**
- [ ] Load chart with multiple data series
- [ ] Open settings modal
- [ ] Verify only these options appear:
  - [ ] Show Grid Lines (checkbox)
  - [ ] Show Tooltips (checkbox)  
  - [ ] Series Colors (one color picker per series)
- [ ] Test all settings work:
  - [ ] Grid toggle affects chart immediately
  - [ ] Tooltip toggle affects hover behavior
  - [ ] Color changes affect chart immediately
- [ ] Close and reopen modal → all settings persist
- [ ] No console errors throughout testing

### **Architecture Compliance Check**
- [ ] Settings stored in central `useChartState` ✅
- [ ] Settings changed via `useChartActions` ✅
- [ ] No direct hook-to-hook communication ✅
- [ ] Follows unidirectional data flow ✅

---

## **Troubleshooting** 🔧

### **Common Issues**

**TypeScript Errors:**
- Ensure all imports are correct
- Check that interfaces match across files
- Verify action types are properly defined

**Settings Not Working:**
- Check that `state.settings` is passed to `usePlotlyConfig`
- Verify reducer case is handling `SET_SETTINGS` correctly
- Ensure `actions.setSettings` is called in save handler

**Colors Not Showing:**
- Check that `processedSeries` prop is passed to modal
- Verify color initialization in `PROCESS_DATA` case
- Ensure `getSeriesColor` function uses new color structure

**Grid/Tooltips Not Responding:**
- Check `settings.showGrid` and `settings.showTooltip` in `usePlotlyConfig`
- Verify Plotly layout uses these settings correctly
- Check for any hardcoded values overriding settings

---

*This checklist follows the LineChart Architecture Guide principles of centralized state, explicit actions, and independent hooks. Each step builds upon the previous one to create a robust, maintainable settings system.* 