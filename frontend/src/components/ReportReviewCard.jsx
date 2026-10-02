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

  const getSeverityBadge = (rating) => {
    const num = Number(rating);
    if (num >= 4.5) return <span className="badge badge-hazard-severe">🔥 Severe Hazard ({rating}/5)</span>;
    if (num >= 3.5) return <span className="badge badge-hazard-high">⚠️ High Hazard ({rating}/5)</span>;
    if (num >= 2.0) return <span className="badge badge-hazard-medium">⚡ Moderate Hazard ({rating}/5)</span>;
    return <span className="badge badge-hazard-low">🛡️ Low Hazard ({rating}/5)</span>;
  };

  return (
    <article className="card" style={{ marginBottom: '1.75rem', overflow: 'hidden' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        padding: '1.5rem'
      }}>
        {/* Left Column: Image & Submission Time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '190px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-subtle)'
          }}>
            <img
              src={getPhotoUrl(report.photo)}
              alt={report.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20dy%3D%225%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
              }}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>Submitted:</strong> {formattedDate || 'N/A'}
          </div>
        </div>

        {/* Right Column: Place Details & Moderation Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              {report.name}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-warning">Pending Review</span>
              {getSeverityBadge(report.rating)}
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <span style={{ color: 'var(--primary-blue)' }}>📍</span>
            <span><strong>Location:</strong> {report.address}, {report.district}, {report.state}</span>
          </div>

          <div style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
            <strong>Problem Statement:</strong> {report.description}
          </div>

          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            marginTop: 'auto'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.2rem' }}>
              Citizen Reporter Information:
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {report.reporter_name || 'Anonymous / Unregistered'} &bull; {report.reporter_email || 'No email provided'} {report.reporter_phone ? `&bull; 📞 ${report.reporter_phone}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onReject(report.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : '✕ Reject Report'}
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => onAccept(report.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : '✓ Accept & Publish'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ReportReviewCard;

