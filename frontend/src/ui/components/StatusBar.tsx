// Import React library for component creation
import React from 'react';
// Import StatusBar-specific styles for component styling
import './StatusBar.css';

// Define StatusBar component function for status information display
const StatusBar: React.FC = () => {
  // Render StatusBar component JSX structure
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">Ready</span>
      </div>
      
      <div className="status-center">
        <span className="status-item">No data loaded</span>
      </div>
      
      <div className="status-right">
        <span className="status-item">Last updated: --</span>
      </div>
    </div>
  );
};

// Export StatusBar component as default module export
export default StatusBar; 