import React, { useState } from 'react';
import { getPhotoUrl, placeService } from '../services/api';

const PlaceCard = ({ place, onEdit, onDelete, isAdmin = false, onSupportSuccess }) => {
  const [supportCount, setSupportCount] = useState(place.support_count != null ? place.support_count : 0);
  const [hasSupported, setHasSupported] = useState(place.has_supported === true);
  const [supporting, setSupporting] = useState(false);

  const communityRating = place.community_rating != null
    ? Number(place.community_rating).toFixed(1)
    : place.rating != null
      ? Number(place.rating).toFixed(1)
      : 'N/A';

  const ratingCount = place.rating_count || 1;
  const numRating = Number(communityRating);

  const getRatingBadge = (score) => {
    if (isNaN(score)) return null;
    if (score >= 4) return <span className="badge badge-danger">Hazard Level: High ({score}/5)</span>;
    if (score >= 2.5) return <span className="badge badge-warning">Hazard Level: Medium ({score}/5)</span>;
    return <span className="badge badge-info">Hazard Level: Low ({score}/5)</span>;
  };

  const formattedDate = place.created_at
    ? new Date(place.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  const handleSupportClick = async () => {
    if (hasSupported || supporting || isAdmin) return;
    setSupporting(true);
    try {
      const res = await placeService.supportPlace(place.id);
      if (res.success) {
        setHasSupported(true);
        if (res.data?.support_count != null) {
          setSupportCount(res.data.support_count);
        } else {
          setSupportCount((prev) => prev + 1);
        }
        if (onSupportSuccess) {
          onSupportSuccess(place.id);
        }
      }
    } catch (err) {
      console.error('Failed to support report:', err);
    } finally {
      setSupporting(false);
    }
  };

  return (
    <div className="card place-card">
      <img
        src={getPhotoUrl(place.photo)}
        alt={place.name}
        className="place-card-image"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
        }}
      />
      <div className="place-card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 className="place-card-title">🚨 {place.name}</h3>
          {getRatingBadge(numRating)}
        </div>

        <p className="place-card-address">
          <span>📍</span> {place.address}, {place.district}, {place.state}
        </p>

        {/* Feature 1 — Community Safety Rating for physical location */}
        <div style={{
          margin: '0.4rem 0',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--bg-subtle, #f8fafc)',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px solid var(--border-light, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem'
        }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-navy, #0f172a)' }}>
            ⭐ Community Safety Rating: <strong>{communityRating} / 5</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            Based on {ratingCount} community rating{ratingCount > 1 ? 's' : ''}
          </div>
        </div>

        {/* Feature 2 — Community Problem Report Support */}
        <div style={{
          margin: '0.4rem 0 0.6rem 0',
          padding: '0.55rem 0.75rem',
          backgroundColor: '#fdf2f8',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px solid #fbcfe8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9d174d', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>👍</span>
            <span>{supportCount} {supportCount === 1 ? 'person supports' : 'people support'} this report</span>
          </div>

          {!isAdmin && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleSupportClick}
              disabled={supporting || hasSupported}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                borderRadius: '4px',
                cursor: hasSupported ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: hasSupported ? '#dcfce7' : 'var(--primary-pink, #ec4899)',
                color: hasSupported ? '#15803d' : '#ffffff',
                border: hasSupported ? '1px solid #86efac' : 'none',
                boxShadow: hasSupported ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {supporting ? 'Supporting...' : hasSupported ? '✓ Supported' : '👍 I Support This Report'}
            </button>
          )}
        </div>

        <p className="place-card-desc">{place.description}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {formattedDate && <span>Reported: {formattedDate}</span>}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onEdit(place)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(place)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
