// Import React library for component creation
import React from 'react';
// Import ReactDOM client for DOM rendering
import ReactDOM from 'react-dom/client';
// Import global styles for application styling
import './index.css';
// Import App component for application root
import App from './App';
// Import performance reporting utility
import reportWebVitals from './reportWebVitals';

// Create React root from DOM element with 'root' id
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Render App component wrapped in StrictMode for development checks
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Configure performance measurement for application analytics
// Pass function to log results or send to analytics endpoint
// Reference documentation at https://bit.ly/CRA-vitals
reportWebVitals();
