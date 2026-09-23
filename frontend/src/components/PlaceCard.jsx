import React from 'react';
import { getPhotoUrl } from '../services/api';

const PlaceCard = ({ place, onEdit, onDelete, isAdmin = false }) => {
  const getRatingBadge = (rating) => {
    if (rating >= 4) return <span className="badge badge-danger">Hazard Level: High ({rating}/5)</span>;
    if (rating === 3) return <span className="badge badge-warning">Hazard Level: Medium ({rating}/5)</span>;
    return <span className="badge badge-info">Hazard Level: Low ({rating}/5)</span>;
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
          {getRatingBadge(place.rating)}
        </div>

        <p className="place-card-address">
          <span>📍</span> {place.address}, {place.district}, {place.state}
        </p>

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
