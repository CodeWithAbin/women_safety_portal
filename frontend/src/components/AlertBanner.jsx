import React from 'react';
import {
  IconAlertCircle,
  IconCheckCircle,
  IconAlertTriangle,
  IconInfo
} from './Icons';

const AlertBanner = ({ type = 'info', message, onDismiss }) => {
  if (!message) return null;

  const alertClass = `alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'}`;
  
  const renderIcon = () => {
    switch (type) {
      case 'error':
        return <IconAlertCircle size={18} />;
      case 'success':
        return <IconCheckCircle size={18} />;
      case 'warning':
        return <IconAlertTriangle size={18} />;
      default:
        return <IconInfo size={18} />;
    }
  };

  return (
    <div className={alertClass} role="alert" aria-live="polite">
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
        {renderIcon()}
      </span>
      <div style={{ flex: 1, fontWeight: 500, fontSize: '0.92rem' }}>{message}</div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.15rem',
            color: 'inherit',
            fontWeight: 700,
            lineHeight: 1,
            padding: '0 0.25rem',
            opacity: 0.75
          }}
          aria-label="Dismiss alert notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;

