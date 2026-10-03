import React from 'react';
import { IconFileText } from './Icons';

const EmptyState = ({ 
  icon = <IconFileText size={36} color="var(--text-muted)" />, 
  title = 'No Records Found', 
  message = 'There is currently no data to display for this selection.',
  actionButton = null 
}) => {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p style={{ maxWidth: '440px', margin: '0 auto 1.25rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
        {message}
      </p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default EmptyState;


