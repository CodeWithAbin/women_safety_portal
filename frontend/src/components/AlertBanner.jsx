import React from 'react';

const AlertBanner = ({ type = 'info', message, onDismiss }) => {
  if (!message) return null;

  const alertClass = `alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'}`;
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : type === 'warning' ? '🔔' : 'ℹ️';

  return (
    <div className={alertClass} role="alert">
      <span>{icon}</span>
      <div style={{ flex: 1 }}>{message}</div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit', fontWeight: 'bold' }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
