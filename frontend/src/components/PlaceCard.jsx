import React, { useState } from 'react';
import { getPhotoUrl, placeService } from '../services/api';

const PlaceCard = ({ place, onEdit, onDelete, isAdmin = false, onRatingSuccess }) => {
  const [communityRating, setCommunityRating] = useState(
    place.community_rating != null ? Number(place.community_rating).toFixed(1) : place.rating != null ? Number(place.rating).toFixed(1) : 'N/A'
  );
  const [ratingCount, setRatingCount] = useState(place.rating_count != null ? place.rating_count : 1);
  const [userRating, setUserRating] = useState(place.user_rating != null ? place.user_rating : null);
  const [hasRated, setHasRated] = useState(place.has_rated === true || place.user_rating != null);

  const [showRatingSelector, setShowRatingSelector] = useState(false);
  const [selectedRating, setSelectedRating] = useState(place.user_rating || 4);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState('');

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

  const handleRatingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingRating || isAdmin) return;
    setSubmittingRating(true);
    setRatingFeedback('');
    try {
      const res = await placeService.ratePlace(place.id, selectedRating);
      if (res.success) {
        if (res.data?.community_rating != null) {
          setCommunityRating(Number(res.data.community_rating).toFixed(1));
        }
        if (res.data?.rating_count != null) {
          setRatingCount(res.data.rating_count);
        }
        setUserRating(selectedRating);
        setHasRated(true);
        setShowRatingSelector(false);
        setRatingFeedback('Rating saved!');
        setTimeout(() => setRatingFeedback(''), 3000);
        if (onRatingSuccess) {
          onRatingSuccess(place.id, res.data);
        }
      }
    } catch (err) {
      setRatingFeedback(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
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

        {/* Community Safety Rating Display */}
        <div style={{
          margin: '0.5rem 0',
          padding: '0.6rem 0.75rem',
          backgroundColor: 'var(--bg-subtle, #f8fafc)',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px solid var(--border-light, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-navy, #0f172a)' }}>
                ⭐ Community Safety Rating: <strong>{communityRating} / 5</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Based on {ratingCount} community rating{ratingCount === 1 ? '' : 's'}
              </div>
            </div>

            {!isAdmin && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowRatingSelector((prev) => !prev)}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  backgroundColor: hasRated ? '#f0fdf4' : '#fff1f2',
                  color: hasRated ? '#166534' : 'var(--primary-pink, #ec4899)',
                  border: hasRated ? '1px solid #86efac' : '1px solid #fecdd3'
                }}
              >
                {hasRated ? `⭐ Your Rating: ${userRating}★ (Edit)` : '⭐ Rate This Place'}
              </button>
            )}
          </div>

          {/* Interactive Rating Selector */}
          {!isAdmin && showRatingSelector && (
            <div style={{
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px dashed var(--border-light, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-navy, #0f172a)' }}>
                Select Safety Rating (1 = Low, 5 = Severe Hazard):
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    style={{
                      padding: '0.3rem 0.55rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: selectedRating === star ? '1.5px solid var(--primary-pink, #ec4899)' : '1px solid #cbd5e1',
                      backgroundColor: selectedRating === star ? '#fdf2f8' : '#ffffff',
                      color: selectedRating === star ? 'var(--primary-pink, #ec4899)' : '#334155'
                    }}
                  >
                    {star} ★
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                  style={{ marginLeft: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                >
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          )}

          {ratingFeedback && (
            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
              {ratingFeedback}
            </div>
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
