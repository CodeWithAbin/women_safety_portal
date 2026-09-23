import React from 'react';
import { getPhotoUrl } from '../services/api';

const ReportReviewCard = ({ report, onAccept, onReject, processingId }) => {
  const isProcessing = processingId === report.id;

  const formattedDate = report.created_at
    ? new Date(report.created_at).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
        <div>
          <img
            src={getPhotoUrl(report.photo)}
            alt={report.name}
            style={{
              width: '100%',
              height: '180px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
            loading="lazy"
          />
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Submitted:</strong> {formattedDate || 'N/A'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-navy)' }}>{report.name}</h3>
            <span className="badge badge-warning">Pending Review</span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            📍 <strong>Location:</strong> {report.address}, {report.district}, {report.state}
          </p>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <strong>Hazard Severity:</strong> {report.rating}/5 &bull; <strong>Description:</strong> {report.description}
          </p>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginTop: 'auto' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>Reporter Info: </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {report.reporter_name || 'Anonymous / Unregistered'} &bull; {report.reporter_email || 'N/A'} {report.reporter_phone ? `(${report.reporter_phone})` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onReject(report.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject Report'}
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() => onAccept(report.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Accept & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewCard;
