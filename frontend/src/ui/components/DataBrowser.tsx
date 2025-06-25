// Import React library with hooks for component functionality
import React, { useState, useEffect, useRef } from 'react';
// Import mock data service for data operations
import { mockDataService } from '../../core/services/MockDataService';
// Import data type interfaces for type definitions
import { DataStructure, ExcelFile, ExcelTab, DataSeries } from '../../core/models/DataTypes';
// Import DataBrowser-specific styles for component styling
import './DataBrowser.css';

// Define DataBrowserProps interface for component properties
interface DataBrowserProps {
  // Define isPinned property for sidebar state
  isPinned: boolean;
  // Define onPinToggle property as function for pin state changes
  onPinToggle: () => void;
}

// Define SeriesItemProps interface for series item component
interface SeriesItemProps {
  // Define series property for data series information
  series: DataSeries;
}



const SeriesItem: React.FC<SeriesItemProps> = ({ series }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Set the series data to be transferred
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'data-series',
      series: series
    }));
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
  };

  return (
    <div 
      className="tree-node series-node"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <span className="tree-icon">📊</span>
      <span className="tree-label">{series.name}</span>
      <span className="series-info">{series.frequency} • {series.dataPoints.length} pts</span>
    </div>
  );
};



const DataBrowser: React.FC<DataBrowserProps> = ({ isPinned, onPinToggle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [dataStructure, setDataStructure] = useState<DataStructure | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load mock data
    const data = mockDataService.getData();
    setDataStructure(data);
    
    // Expand first file by default
    if (data.files.length > 0) {
      setExpandedNodes(prev => {
        if (prev.size === 0) {
          return new Set([data.files[0].id]);
        }
        return prev;
      });
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const results = mockDataService.searchSeries(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };



  const renderSearchResults = () => {
    if (isSearching) {
      return <div className="search-loading">Searching...</div>;
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return <div className="search-no-results">No series found for "{searchQuery}"</div>;
    }

    return (
      <div className="search-results">
        {searchResults.map((result, index) => (
          <div key={index} className="search-result-item">
            <SeriesItem 
              series={result.series} 
            />
            <div className="search-result-path">
              {result.file} → {result.tab}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFileTree = () => {
    if (!dataStructure) {
      return <div className="data-loading">Loading data...</div>;
    }

    return dataStructure.files.map(file => (
      <div key={file.id} className="tree-node">
        <div 
          className="tree-node-header"
          onClick={() => toggleNode(file.id)}
        >
          <span className="tree-toggle">
            {expandedNodes.has(file.id) ? '▼' : '▶'}
          </span>
          <span className="tree-icon">📁</span>
          <span className="tree-label">{file.name}</span>
          <span className="file-info">{file.size}</span>
        </div>
        
        {expandedNodes.has(file.id) && (
          <div className="tree-children">
            {file.tabs.map(tab => (
              <div key={tab.id} className="tree-node">
                <div 
                  className="tree-node-header"
                  onClick={() => toggleNode(tab.id)}
                >
                  <span className="tree-toggle">
                    {expandedNodes.has(tab.id) ? '▼' : '▶'}
                  </span>
                  <span className="tree-icon">📋</span>
                  <span className="tree-label">{tab.name}</span>
                  <span className="series-count">({tab.series.length})</span>
                </div>
                
                {expandedNodes.has(tab.id) && (
                  <div className="tree-children">
                    {tab.series.map(series => (
                      <SeriesItem
                        key={series.id}
                        series={series}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const isVisible = isPinned || isHovered;

  return (
    <>
      {/* Hover trigger zone */}
      <div 
        className="data-browser-trigger"
        onMouseEnter={() => setIsHovered(true)}
      />
      
      <div 
        className={`data-browser ${isVisible ? 'visible' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="data-browser-header">
          <h2>Data Browser</h2>
          <button 
            className={`pin-button ${isPinned ? 'pinned' : ''}`}
            onClick={onPinToggle}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            📌
          </button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search data series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery.trim() && (
            <button 
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="file-tree">
          {searchQuery.trim() ? renderSearchResults() : renderFileTree()}
        </div>
        
      </div>
      

    </>
  );
};

// Export DataBrowser component with React.memo for performance optimization
export default React.memo(DataBrowser); 