import React from 'react';

const EmptyState = ({ 
  icon = '📍', 
  title = 'No Records Found', 
  message = 'There is currently no data to display for this selection.',
  actionButton = null 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p style={{ maxWidth: '450px', margin: '0 auto 1.25rem' }}>{message}</p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
