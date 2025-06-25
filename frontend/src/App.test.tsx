// Import React library for component testing
import React from 'react';
// Import render and screen utilities from testing library
import { render, screen } from '@testing-library/react';
// Import App component for testing functionality
import App from './App';

// Define test case for App component rendering
test('renders learn react link', () => {
  // Render App component into virtual DOM
  render(<App />);
  // Query DOM for element containing "learn react" text
  const linkElement = screen.getByText(/learn react/i);
  // Assert that linkElement exists in document
  expect(linkElement).toBeInTheDocument();
});
