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
    if (isNaN(num)) return <span className="badge badge-info">Initial Rating: Unrated</span>;
    if (num >= 4.5) return <span className="badge badge-hazard-severe">🔥 Critical ({rating}/5)</span>;
    if (num >= 3.5) return <span className="badge badge-hazard-high">⚠️ High ({rating}/5)</span>;
    if (num >= 2.0) return <span className="badge badge-hazard-medium">⚡ Moderate ({rating}/5)</span>;
    return <span className="badge badge-hazard-low">🛡️ Low ({rating}/5)</span>;
  };

  return (
    <article className="card" style={{ marginBottom: '1.75rem', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }} aria-label={`Pending Report: ${report.name}`}>
      
      {/* Card Top Banner / Identification Header */}
      <div style={{
        padding: '0.85rem 1.4rem',
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 700, color: '#92400e' }}>
          <span>⏳</span> Moderation Item #{report.id}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-warning">Pending Review</span>
          <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
            Initial Reporter Assessment:
          </span>
          {getSeverityBadge(report.rating)}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        padding: 'clamp(1rem, 3vw, 1.5rem)'
      }}>
        {/* Left Section: Evidence Photo & Submission Timestamp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '220px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-subtle)'
          }}>
            <img
              src={getPhotoUrl(report.photo)}
              alt={report.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20dy%3D%225%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
              }}
            />
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span>📅</span>
            <span><strong>Submitted:</strong> {formattedDate || 'Date unavailable'}</span>
          </div>
        </div>

        {/* Right Section: Report Details, Citizen Details & Moderation Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.35rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
              {report.name}
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', wordBreak: 'break-word' }}>
              <span style={{ color: 'var(--primary-blue)', flexShrink: 0 }}>📍</span>
              <span><strong>Location:</strong> {report.address}, {report.district}, {report.state}</span>
            </div>
          </div>

          <div style={{
            fontSize: '0.92rem',
            color: 'var(--text-body)',
            lineHeight: 1.55,
            backgroundColor: '#f8fafc',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Reported Problem Statement:
            </div>
            {report.description}
          </div>

          {/* Citizen Reporter Info Box */}
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            marginTop: 'auto',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              Citizen Reporter Information
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
              <strong>{report.reporter_name || 'Anonymous Citizen'}</strong> &bull; {report.reporter_email || 'No email recorded'} {report.reporter_phone ? `&bull; 📞 ${report.reporter_phone}` : ''}
            </div>
          </div>

          {/* Moderation Decision Actions */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-light)',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onReject(report.id)}
              disabled={isProcessing}
              style={{ minWidth: '120px' }}
            >
              {isProcessing ? 'Processing...' : '✕ Reject Report'}
            </button>

            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => onAccept(report.id)}
              disabled={isProcessing}
              style={{ minWidth: '150px' }}
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

