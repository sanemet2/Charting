import React, { useState } from 'react';
import './Layout.css';
import ChartsSidebar, { Library } from './ChartsSidebar';
import DataBrowser from './DataBrowser';
import ChartCanvas, { Chart } from './ChartCanvas';
import Header, { GridSize } from './Header';
import StatusBar from './StatusBar';

// Define EnhancedChart interface extending Chart with library association
export interface EnhancedChart extends Chart {
  // Define libraryId property as string for chart organization
  libraryId: string;
}

// Define Layout component function for application structure
const Layout: React.FC = () => {
  // Initialize isDataBrowserPinned state with false for browser visibility
  const [isDataBrowserPinned, setIsDataBrowserPinned] = useState(false);
  // Initialize charts state with empty array for chart collection
  const [charts, setCharts] = useState<EnhancedChart[]>([]);
  // Initialize libraries state with empty array for library collection
  const [libraries, setLibraries] = useState<Library[]>([]);
  // Initialize activeLibraryId state with null for library selection
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  // Initialize gridSize state with '3x3' for chart layout configuration
  const [gridSize, setGridSize] = useState<GridSize>('3x3');

  // Define handleAddChart function for creating new charts
  const handleAddChart = (type: 'line') => {
    // Check if activeLibraryId exists before creating chart
    if (!activeLibraryId) {
      // Alert user to select library if none is active
      alert('Please select or create a library first');
      // Exit function early if no library selected
      return;
    }
    
    // Create newChart object with unique id and type
    const newChart: EnhancedChart = {
      // Generate unique id using current timestamp
      id: `chart-${Date.now()}`,
      // Set chart type from parameter
      type,
      // Associate chart with active library
      libraryId: activeLibraryId
    };
    // Update charts state by adding newChart to existing array
    setCharts([...charts, newChart]);
  };

  // Define handleRemoveChart function for deleting charts
  const handleRemoveChart = (id: string) => {
    // Update charts state by filtering out chart with matching id
    setCharts(charts.filter(chart => chart.id !== id));
  };

  // Define handleUpdateChart function for modifying existing charts
  const handleUpdateChart = (id: string, updates: Partial<Chart>) => {
    // Update charts state using previous state callback
    setCharts(prevCharts =>
      // Map through charts to find and update matching chart
      prevCharts.map(chart =>
        // Apply updates to chart with matching id, otherwise return unchanged
        chart.id === id ? { ...chart, ...updates } : chart
      )
    );
  };

  // Define handleAddLibrary function for creating new libraries
  const handleAddLibrary = (name: string) => {
    // Define icons array with emoji options for library display
    const icons = ['📈', '📊', '💹', '📉', '💰', '🏦', '💵', '📌'];
    // Select random icon from icons array using Math.random
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    
    // Create newLibrary object with unique id and properties
    const newLibrary: Library = {
      // Generate unique id using current timestamp
      id: `library-${Date.now()}`,
      // Set library name from parameter
      name,
      // Assign randomly selected icon
      icon: randomIcon
    };
    
    // Update libraries state by adding newLibrary to existing array
    setLibraries([...libraries, newLibrary]);
    
    // Set activeLibraryId to newLibrary id for auto-selection
    setActiveLibraryId(newLibrary.id);
  };

  // Define handleLibrarySelect function for changing active library
  const handleLibrarySelect = (id: string) => {
    // Update activeLibraryId state with selected library id
    setActiveLibraryId(id);
  };

  // Define handleDeleteLibrary function for removing libraries
  const handleDeleteLibrary = (id: string) => {
    // Update libraries state by filtering out library with matching id
    setLibraries(libraries.filter(lib => lib.id !== id));
    
    // Update charts state by removing charts associated with deleted library
    setCharts(charts.filter(chart => chart.libraryId !== id));
    
    // Check if deleted library was the active library
    if (activeLibraryId === id) {
      // Clear activeLibraryId if deleted library was active
      setActiveLibraryId(null);
    }
  };

  // Define getChartCount function for counting charts per library
  const getChartCount = (libraryId: string) => {
    // Return count of charts matching the libraryId
    return charts.filter(chart => chart.libraryId === libraryId).length;
  };

  // Calculate activeLibraryCharts by filtering charts for active library
  const activeLibraryCharts = activeLibraryId 
    // Filter charts by activeLibraryId if library is selected
    ? charts.filter(chart => chart.libraryId === activeLibraryId)
    // Return empty array if no library is selected
    : [];

  // Render Layout component JSX structure
  return (
    <div className="app-layout">
      <ChartsSidebar 
        isExpanded={true}
        onToggle={() => {}}
        libraries={libraries}
        activeLibraryId={activeLibraryId}
        onLibrarySelect={handleLibrarySelect}
        onAddLibrary={handleAddLibrary}
        onDeleteLibrary={handleDeleteLibrary}
        getChartCount={getChartCount}
      />
      <div className="main-section">
        <Header 
          onAddChart={handleAddChart}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
        />
        <div className="content-area">
          <ChartCanvas 
            charts={activeLibraryCharts} 
            onRemoveChart={handleRemoveChart}
            onUpdateChart={handleUpdateChart}
            activeLibraryName={activeLibraryId ? libraries.find(lib => lib.id === activeLibraryId)?.name : undefined}
            hasLibraries={libraries.length > 0}
            gridSize={gridSize}
          />
          <DataBrowser 
            isPinned={isDataBrowserPinned}
            onPinToggle={() => setIsDataBrowserPinned(!isDataBrowserPinned)}
          />
        </div>
      </div>
    </div>
  );
};

// Export Layout component as default module export
export default Layout; 