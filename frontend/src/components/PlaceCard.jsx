import React from 'react';
import { getPhotoUrl } from '../services/api';

const PlaceCard = ({ place, onEdit, onDelete, isAdmin = false }) => {
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
          <h3 className="place-card-title">{place.name}</h3>
          {getRatingBadge(numRating)}
        </div>

        <p className="place-card-address">
          <span>📍</span> {place.address}, {place.district}, {place.state}
        </p>

        {/* Community Safety Rating Display */}
        <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-sm, 4px)', border: '1px solid var(--border-light, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-navy, #0f172a)' }}>
            ⭐ Community Safety Rating: <strong>{communityRating} / 5</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            Based on {ratingCount} community rating{ratingCount > 1 ? 's' : ''}
          </div>
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
