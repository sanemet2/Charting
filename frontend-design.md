# Chart Library Frontend Design

## Overview
This document outlines the UI/UX design, component structure, and user workflows for the Chart Library application.

## Design Principles
1. **Clean & Professional** - Banking/financial industry appropriate
2. **Efficient Workflow** - Minimize clicks to create charts
3. **Discoverable** - Features should be intuitive
4. **Responsive** - Work well on different screen sizes
5. **Performance-First** - Handle large datasets smoothly

## Layout Structure

### Main Layout (Dual Sidebars)
```
+----------------------------------------------------------+
|                       Header Bar                          |
+----------+------------------------------------+-----------+
|          |                                    |           |
|  Charts  |                                    |    Data   |
|   Menu   |         Chart Canvas               |  Browser  |
|  (Left)  |                                    |  (Right)  |
|          |      - Active Chart(s)             |           |
|    📊    |      - Drag & Drop Zone            | Hidden ▶  |
|          |      - Chart Controls              |           |
|          |                                    | On Hover: |
| On Click:|                                    | Slides In |
| ▶ Expand |                                    |           |
+----------+------------------------------------+-----------+
|                      Status Bar                           |
+----------------------------------------------------------+
```

### Left Sidebar - Charts Menu
- **Default State**: Narrow bar (~60px) showing "Charts" vertically or chart icon
- **Expanded State**: Opens to ~250px width with chart library options
- **Content When Expanded**:
  - Saved chart templates
  - Recent charts
  - Chart categories/libraries
  - Quick chart creation buttons

### Right Sidebar - Data Browser  
- **Default State**: Hidden off-screen (transform: translateX(100%))
- **Hover State**: Slides in from right (transform: translateX(0))
- **Animation**: 300ms ease-out slide transition
- **Width**: ~300px when visible
- **Trigger Zone**: Right 20px of screen

## Core Components

### 1. Header Bar
- Application title/logo
- Global actions (Save workspace, Export, Settings)
- User info (if applicable)

### 2. Left Sidebar - Charts Menu
- **Collapsed View**:
  - Vertical "CHARTS" text or chart icon (📊)
  - Click to expand
- **Expanded View**:
  - **Saved Charts Library**
    - Personal saved charts
    - Team/shared charts
    - Templates
  - **Recent Charts**
    - Last 5-10 created charts
    - Quick re-open
  - **Chart Types** (Quick create)
    - Line Chart
    - Bar Chart  
    - Scatter Plot
    - Regression Analysis
  - **Chart Collections/Categories**
    - By asset class
    - By frequency
    - By analysis type

### 3. Data Browser Sidebar (Right Side)
- **Collapsed State (Default)**
  - Completely hidden off-screen
  - Small tab indicator on edge
- **Expanded State (On Hover)**
  - Slides in from right (300ms ease-out)
  - White background with shadow
  - Contains:
    - **File Explorer Tree**
      - Expandable hierarchy: File → Tab → Series
      - Drag items to chart canvas
      - Metadata preview on hover
    - **Search Box**
      - Filter series by name
      - Advanced filters (date range, frequency)
    - **Series Information**
      - Preview selected series details
      - Quick stats (count, range, frequency)
- **Pin Button**
  - Top of sidebar
  - Keeps sidebar visible without hover

### 3. Chart Canvas
- **Drag & Drop Zone**
  - Visual feedback during drag
  - "Drop here to create chart" placeholder
- **Active Charts**
  - Multiple charts in grid layout
  - Resize/reposition charts
- **Chart Toolbar**
  - Chart type selector
  - Zoom controls
  - Export options
  - Data manipulation tools

### 4. Data Manipulation Panel (Modal/Sidebar)
- Triggered by toolbar button
- Operations:
  - Resampling
  - Date filtering  
  - Combine series
  - Transformations (YoY, basis points)
  - Regression analysis

## User Workflows

### Workflow 1: Creating First Chart
1. User sees data browser with file tree
2. Expands file → tab to see available series
3. Drags series name to chart canvas
4. Chart appears with default settings
5. Click title/axes to edit inline

### Workflow 2: Adding Series to Existing Chart
1. With chart selected, drag additional series
2. Drop on existing chart
3. Series added with automatic color assignment
4. Legend updates

### Workflow 3: Data Transformation
1. Select chart or series
2. Click "Transform" in toolbar
3. Modal opens with options
4. Preview changes in real-time
5. Apply or cancel

## Component Hierarchy
```
App
├── Layout
│   ├── Header
│   ├── DataBrowser
│   │   ├── FileTree
│   │   │   ├── FileNode
│   │   │   ├── TabNode
│   │   │   └── SeriesNode
│   │   ├── SearchBar
│   │   └── SeriesInfo
│   ├── ChartCanvas
│   │   ├── DropZone
│   │   ├── ChartGrid
│   │   │   └── Chart
│   │   │       ├── PlotlyWrapper
│   │   │       └── ChartControls
│   │   └── ChartToolbar
│   └── StatusBar
└── Modals
    ├── DataTransformModal
    ├── RegressionModal
    └── ExportModal
```

## Visual Design

### Color Palette
- **Primary**: Professional blue (#0066CC)
- **Background**: Light gray (#F5F5F5)
- **Chart Canvas**: White (#FFFFFF)
- **Borders**: Light gray (#E0E0E0)
- **Success**: Green (#28A745)
- **Warning**: Orange (#FFC107)
- **Left Sidebar**: #F8F9FA (light gray)
- **Right Sidebar**: #FFFFFF (white) with box-shadow

### Typography
- **Font**: System fonts (San Francisco, Segoe UI, Roboto)
- **Headers**: 16-20px, semi-bold
- **Body**: 14px, regular
- **Small text**: 12px

### Spacing
- **Grid**: 8px base unit
- **Panel padding**: 16px
- **Component spacing**: 8-16px

## Interactive Elements

### Sidebar Interactions
- **Left Sidebar (Charts)**:
  - Click to toggle expand/collapse
  - Stays open until clicked again
  - Click on chart template/saved chart to load
  - Hover effects on menu items
- **Right Sidebar (Data)**:
  - **Hover Behavior**: 
    - Trigger zone: Right 20px of screen
    - Slide animation: translateX(0) with 300ms ease-out
    - Auto-hide: After mouse leaves for 500ms
  - **Pin/Unpin**: Click pin icon to keep visible
  - **Drag from Sidebar**: 
    - Drag series directly to chart area
    - Sidebar stays visible during drag

### Drag & Drop
- **Drag Preview**: Semi-transparent series name
- **Drop Zones**: Highlighted on drag start
- **Invalid Drop**: Red border feedback

### Chart Interactions
- **Inline Editing**: Click text to edit
- **Zoom**: Click and drag on chart
- **Pan**: Shift + drag
- **Reset**: Double-click

## Responsive Behavior
- **Desktop** (>1200px): Full split view
- **Tablet** (768-1200px): Collapsible data browser
- **Mobile** (<768px): Stacked layout (not primary use case)

## Next Steps
1. Create wireframe mockups
2. Build component prototypes
3. Test drag & drop interactions
4. Iterate based on usage

## Open Questions
- Should we support dark mode?
- How many charts visible at once?
- Keyboard shortcuts needed?
- Accessibility requirements? 