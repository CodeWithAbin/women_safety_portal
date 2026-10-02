import React, { useEffect } from 'react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  loading = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="modal-container">
        <div className="modal-header">
          <h3 id="confirm-modal-title" className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel} disabled={loading} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.55 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button 
            type="button"
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

