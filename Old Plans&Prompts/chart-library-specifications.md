# Chart Library Application Specifications

## Project Overview
A program that takes Excel sheets containing Bloomberg data as input and provides a comprehensive chart library with data visualization and analysis capabilities.

## Core Requirements

### 1. Data Input & Storage
- **Source**: Excel sheets containing Bloomberg financial data
- **Backend Consideration**: Python backend to convert Excel sheets to SQL database
- **Status**: Open to alternative suggestions

### 2. Frontend Capabilities

#### 2.1 Chart Creation
- View data from chart library in frontend interface
- Drag and drop data series into charts
- Interactive chart building

#### 2.2 Data Manipulation Features
- **Resampling**: Change data frequency (specifics TBD)
- **Filtering**: Eliminate certain dates to create modified data series
- **Combining Series**: Multiple data series combined via different operations
- **Transformations**: 
  - Year-over-year changes
  - Basis point changes

#### 2.3 Analysis Tools
- Ad hoc analysis capabilities
- Lead/lag regression analysis over various time periods

## Development Approach
- **Previous**: Started with backend first
- **Current Plan**: Start with frontend first, then build backend to support frontend needs

---

## Questions to Address

### Frontend Architecture

1. **Technology Stack**
   - **Chosen**: React with TypeScript
   - **Note**: May need to adjust based on bank's technology policies and approval process
   - **Rationale**: Good balance of modern features, enterprise acceptance, and type safety

2. **Charting Library**
   - **Requirements**: 
     - Inline editing of titles and axes (click to edit)
     - Support for line charts (primary), bar charts, and scatter charts
     
       - **Chosen**: **Plotly.js** 
    - **React Package**: react-plotly.js
    - **Key Features to Utilize**:
      - Inline editing (editable: true)
      - Drag to zoom, double-click to reset
      - Hover data
      - Export to PNG/SVG
      - Responsive sizing

3. **UI/UX Design**
   - Layout preference: Split view with data series list and chart canvas?
   - Multiple charts simultaneously on screen?
   - Chart save/export functionality needed?
   - Any design mockups or references?

### Data Structure & Format

4. **Excel File Structure**
   - **Confirmed Structure**:
     - Data organized in columns
     - Date column adjacent to data series
     - Series name in header row above data
     - Multiple series can share same date column
     - Multiple Excel files with multiple tabs each
   - **Example Layouts**:
     ```
     Layout 1 (Each series has own date):
     | Date      | Series_A | Date      | Series_B |
     |-----------|----------|-----------|----------|
     | 2024-01-01| 100.5    | 2024-01-01| 200.3    |
     
     Layout 2 (Shared date column):
     | Date      | Series_A | Series_B | Series_C |
     |-----------|----------|----------|----------|
     | 2024-01-01| 100.5    | 200.3    | 150.7    |
     ```
       - **Data Detection & Organization**:
      - **Date Detection**: Auto-detect based on data format (parse for date patterns)
      - **Data Hierarchy**: FileName → TabName → SeriesName
      - **Series Identification**: Use series name from Excel header (row 1)
      - **Metadata**: Support optional metadata import (flexible schema)
    - **Import Behavior**:
      - Parse all Excel files in watched directory
      - Maintain file/tab structure for navigation
      - Allow drilling down to select specific series

5. **Data Volume & Performance**
   - **Data Characteristics**:
     - **Frequencies**: Daily, weekly, monthly, quarterly, yearly
     - **Historical Range**: Some series dating back to 1900s (~124 years)
     - **Estimated Data Points**: 
       - Daily series: ~31,000 points (1900-2024)
       - Weekly series: ~6,500 points
       - Monthly series: ~1,500 points
       - Quarterly series: ~500 points
       - Yearly series: ~124 points
   - **Performance Considerations**:
     - Need efficient storage for sparse time series (not all series have all dates)
     - Fast retrieval for different time ranges
     - Handle mixed-frequency data in same chart
     - Optimize for common operations (resampling, date filtering)
       - **Data Volume**: Will grow over time as new series are added
    - **Display Requirement**: Show data as-is, no automatic averaging
    - **Performance Reality Check**:
      - 30,000+ points can render but may cause:
        - Initial render delay (1-3 seconds)
        - Laggy pan/zoom on older machines
        - Large memory usage per chart
      - Modern browsers/Plotly can handle it, but UX may suffer
    - **Proposed Solutions**:
      - Indexed database for fast queries
      - Efficient data transfer (binary formats/compression)
      - Virtual scrolling for data lists
      - Progressive loading (load visible range first)
      - Optional "performance mode" toggle for future

6. **Update Frequency**
   - **Confirmed**: Spreadsheets will be refreshed occasionally
   - **Requirement**: Need to keep data "live" when refreshed
       - **Refresh Mechanism**: 
      - **Chosen**: Automatic file watching
      - **Behavior**: System monitors folder for Excel file changes
      - **Update Strategy**: Replace data when file changes detected
      - **No notifications** for changes (for now)
    - **Outstanding Questions**:
      - Which folder(s) to watch?
      - How to handle series that disappear in new version?
      - Should we track version history of data?

### Functionality Details

7. **Resampling Specifications**
   - Required frequencies? (Daily, Weekly, Monthly, Quarterly, Yearly?)
   - Aggregation methods? (Average, Sum, Last, First?)

8. **Data Combination Operations**
   - Arithmetic operations? (Add, Subtract, Multiply, Divide?)
   - Statistical operations? (Average, Weighted Average?)
   - Custom formulas needed?

9. **Filtering Requirements**
   - Date range filtering?
   - Value-based filtering?
   - Custom filter conditions?

10. **Year-over-Year Calculations**
    - Percentage change?
    - Absolute difference?
    - Rolling periods?

11. **Regression Analysis Features**
    - Visual output only? (scatter plots with trend lines)
    - Statistical metrics needed? (R², coefficients, p-values, confidence intervals)
    - Multiple regression support?
    - Time period selection interface?

### Technical Considerations

12. **Backend Architecture**
    - Stick with Python + SQL approach?
    - API design preferences? (REST, GraphQL?)
    - Authentication/authorization needed?

13. **Deployment & Environment**
    - Local application or web-based?
    - Multi-user support?
    - Desktop app considerations?

14. **Data Persistence**
    - Save custom charts/analysis?
    - User workspace/session management?
    - Export capabilities? (PDF, PNG, Excel?)

### Framework Portability Architecture

15. **Design Principles for Easy Framework Switching**
    - **Separate Business Logic**: Keep all data manipulation, calculations, and business rules in framework-agnostic TypeScript modules
    - **Abstract UI Components**: Create a thin wrapper layer for UI components
    - **Minimize Framework Dependencies**: Use standard browser APIs where possible
    - **State Management**: Use patterns that can be adapted to different frameworks

16. **Recommended Project Structure**
    ```
    src/
    ├── core/                  # Framework-agnostic business logic
    │   ├── models/           # TypeScript interfaces/types
    │   ├── services/         # Data manipulation, API calls
    │   ├── utils/            # Helper functions
    │   └── analysis/         # Statistical/regression logic
    ├── ui/                   # React-specific code
    │   ├── components/       # React components
    │   ├── hooks/            # React hooks
    │   └── containers/       # Connected components
    ├── state/                # State management (abstracted)
    └── api/                  # API communication layer
    ```

17. **Portability Guidelines**
    - Document all React-specific patterns used
    - Keep components focused on presentation
    - Use TypeScript interfaces for all data structures
    - Avoid deep React ecosystem dependencies where alternatives exist
    - Consider building abstraction layers for drag-and-drop and other complex UI features

---

## Next Steps
1. Answer the above questions to refine specifications
2. Create detailed frontend component checklist
3. Design API endpoints based on frontend needs
4. Plan database schema
5. Begin incremental implementation

## Development Phases (Proposed)
1. **Phase 0**: Architecture setup and core abstractions
   - Set up TypeScript project with portable structure
   - Create core data models and interfaces
   - Build framework-agnostic service layer
2. **Phase 1**: Basic frontend with mock data
   - Implement basic React UI following portability guidelines
   - Create abstract component wrappers
3. **Phase 2**: Chart creation and manipulation UI
   - Implement drag-and-drop with abstraction layer
   - Build chart components with minimal React coupling
4. **Phase 3**: Backend API development
   - Python backend with clear API contracts
   - Database schema implementation
5. **Phase 4**: Excel import and data processing
   - Excel parsing service
   - Data transformation pipeline
6. **Phase 5**: Advanced analysis features
   - Regression analysis implementation
   - Complex data manipulations
7. **Phase 6**: Polish and optimization
   - Performance tuning
   - Framework-specific optimizations documented 