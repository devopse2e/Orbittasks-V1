// src/components/LoadingSpinner.js

import React from 'react';
import '../styles/LoadingSpinner.css';

function LoadingSpinner({ message = 'Loading your todos...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" role="status" aria-label="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
