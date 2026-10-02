import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;

