// Import React library with useState hook for state management
import React, { useState } from 'react';
// Import ChartsSidebar-specific styles for component styling
import './ChartsSidebar.css';

// Define Library interface for library data structure
export interface Library {
  // Define id property as string for library identification
  id: string;
  // Define name property as string for library display label
  name: string;
  // Define icon property as string for library visual representation
  icon: string;
}

// Define ChartsSidebarProps interface for component properties
interface ChartsSidebarProps {
  // Define isExpanded property for sidebar state
  isExpanded: boolean;
  // Define onToggle property as function for sidebar expansion
  onToggle: () => void;
  // Define libraries property as Library array for display
  libraries: Library[];
  // Define activeLibraryId property for current selection
  activeLibraryId: string | null;
  // Define onLibrarySelect property as function for library selection
  onLibrarySelect: (id: string) => void;
  // Define onAddLibrary property as function for library creation
  onAddLibrary: (name: string) => void;
  // Define onDeleteLibrary property as function for library removal
  onDeleteLibrary: (id: string) => void;
  // Define getChartCount property as function for chart counting
  getChartCount: (libraryId: string) => number;
}

// Define LibraryItemProps interface for library item component
interface LibraryItemProps {
  // Define library property for library data
  library: Library;
  // Define isActive property for selection state
  isActive: boolean;
  // Define onSelect property as function for selection handling
  onSelect: () => void;
  // Define onDelete property as function for deletion handling
  onDelete: (id: string) => void;
  // Define chartCount property for chart quantity display
  chartCount: number;
}

const LibraryItem: React.FC<LibraryItemProps> = ({ library, isActive, onSelect, onDelete, chartCount }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (chartCount === 0) {
      // Simple confirmation for empty libraries
      if (window.confirm(`Delete library "${library.name}"?`)) {
        onDelete(library.id);
      }
    } else {
      // Show enhanced confirmation for non-empty libraries
      setShowDeleteConfirm(true);
    }
    setShowMenu(false);
  };

  const handleConfirmDelete = () => {
    if (confirmName === library.name) {
      onDelete(library.id);
      setShowDeleteConfirm(false);
      setConfirmName('');
    }
  };

  return (
    <>
      <li 
        className={`library-item ${isActive ? 'active' : ''}`}
        onClick={onSelect}
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
        <span className="library-icon">{library.icon}</span>
        <span className="library-name">{library.name}</span>
        {showMenu && (
          <div className="library-menu">
            <button 
              className="library-menu-btn"
              onClick={handleDelete}
              title="Delete library"
            >
              ⋮
            </button>
          </div>
        )}
      </li>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Library</h3>
            <p className="warning">
              ⚠️ This library contains <strong>{chartCount} chart{chartCount !== 1 ? 's' : ''}</strong>.
            </p>
            <p>To confirm deletion, type the library name: <strong>{library.name}</strong></p>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Type library name..."
              autoFocus
            />
            <div className="dialog-actions">
              <button 
                className="btn-delete"
                onClick={handleConfirmDelete}
                disabled={confirmName !== library.name}
              >
                Delete Library
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ChartsSidebar: React.FC<ChartsSidebarProps> = ({ 
  isExpanded, 
  onToggle, 
  libraries, 
  activeLibraryId, 
  onLibrarySelect,
  onAddLibrary,
  onDeleteLibrary,
  getChartCount
}) => {
  const [showNewLibraryInput, setShowNewLibraryInput] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');

  const handleAddLibrary = () => {
    if (newLibraryName.trim()) {
      onAddLibrary(newLibraryName.trim());
      setNewLibraryName('');
      setShowNewLibraryInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLibrary();
    } else if (e.key === 'Escape') {
      setNewLibraryName('');
      setShowNewLibraryInput(false);
    }
  };

  return (
    <div className="charts-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">📊</span>
          <span className="logo-text">Chart Library</span>
        </div>
      </div>
      
      <div className="sidebar-content">
        <div className="libraries-header">
          <h3>My Libraries</h3>
          <button 
            className="add-library-btn"
            onClick={() => setShowNewLibraryInput(true)}
            title="Create new library"
          >
            +
          </button>
        </div>

        {showNewLibraryInput && (
          <div className="new-library-input-container">
            <input
              type="text"
              className="new-library-input"
              placeholder="Library name..."
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              onKeyDown={handleKeyPress}
              autoFocus
            />
            <div className="new-library-actions">
              <button 
                className="new-library-btn save"
                onClick={handleAddLibrary}
              >
                ✓
              </button>
              <button 
                className="new-library-btn cancel"
                onClick={() => {
                  setNewLibraryName('');
                  setShowNewLibraryInput(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <ul className="libraries-list">
          {libraries.map(library => (
            <LibraryItem
              key={library.id}
              library={library}
              isActive={activeLibraryId === library.id}
              onSelect={() => onLibrarySelect(library.id)}
              onDelete={onDeleteLibrary}
              chartCount={getChartCount(library.id)}
            />
          ))}
        </ul>

        {libraries.length === 0 && !showNewLibraryInput && (
          <div className="empty-libraries">
            <p>No libraries yet</p>
            <p className="hint">Click + to create your first library</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Export ChartsSidebar component as default module export
export default ChartsSidebar; 