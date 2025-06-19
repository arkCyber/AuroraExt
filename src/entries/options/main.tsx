// Import React and ReactDOM for rendering
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the main application component
import IndexOption from './App';

// Import global styles including animations
import '../../styles/animations.css';

// Create root element and render the application
// Using StrictMode for additional development checks
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IndexOption />
  </React.StrictMode>,
);
