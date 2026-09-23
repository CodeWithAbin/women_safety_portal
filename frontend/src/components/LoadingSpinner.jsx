import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
