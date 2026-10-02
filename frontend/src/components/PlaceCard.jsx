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

  const getHazardBadge = (score) => {
    if (isNaN(score)) return <span className="badge badge-info">Hazard: Unrated</span>;
    if (score >= 4.5) return <span className="badge badge-hazard-severe">🔥 Severe Hazard ({score}/5)</span>;
    if (score >= 3.5) return <span className="badge badge-hazard-high">⚠️ High Hazard ({score}/5)</span>;
    if (score >= 2.0) return <span className="badge badge-hazard-medium">⚡ Moderate Hazard ({score}/5)</span>;
    return <span className="badge badge-hazard-low">🛡️ Low Hazard ({score}/5)</span>;
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
        setRatingFeedback('Thank you! Rating saved.');
        setTimeout(() => setRatingFeedback(''), 3500);
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
    <article className="card place-card" aria-label={`Hazardous Place: ${place.name}`}>
      {/* 1. Image with overlay hazard badge */}
      <div className="place-card-image-wrap">
        <img
          src={getPhotoUrl(place.photo)}
          alt={place.name}
          className="place-card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20dy%3D%225%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
          }}
        />
        <div className="place-card-badge-overlay">
          {getHazardBadge(numRating)}
        </div>
      </div>

      {/* Card Content */}
      <div className="place-card-content">
        {/* 2. Place Name / Problem Title */}
        <h3 className="place-card-title">{place.name}</h3>

        {/* 3. Location */}
        <div className="place-card-address">
          <span style={{ fontSize: '1.05rem', color: 'var(--primary-blue)', flexShrink: 0 }}>📍</span>
          <span>{place.address}, {place.district}, {place.state}</span>
        </div>

        {/* 4. Description / Problem Statement */}
        <p className="place-card-desc">{place.description}</p>

        {/* 5. Community Safety Rating Box */}
        <section className="community-rating-card" aria-label="Community Safety Rating Information">
          <div className="community-rating-header">
            <div>
              <div className="community-rating-score">
                <span>⭐</span>
                <span>Community Safety Rating:</span>
                <strong>{communityRating} / 5</strong>
              </div>
              <div className="community-rating-count">
                Based on <strong>{ratingCount}</strong> community rating{ratingCount === 1 ? '' : 's'}
              </div>
            </div>

            {!isAdmin && (
              <button
                type="button"
                className={`rating-action-btn ${hasRated ? 'rated' : 'unrated'}`}
                onClick={() => setShowRatingSelector((prev) => !prev)}
                aria-expanded={showRatingSelector}
                aria-label="Rate this place"
              >
                {hasRated ? `⭐ Your Rating: ${userRating}★ (Edit)` : '⭐ Rate This Place'}
              </button>
            )}
          </div>

          {/* Interactive Rating Selector */}
          {!isAdmin && showRatingSelector && (
            <div className="rating-selector-drawer">
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                Select Hazard Severity (1 = Minor, 5 = Severe):
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className={`btn btn-sm ${selectedRating === star ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                  >
                    {star} ★
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                  style={{ marginLeft: 'auto', padding: '0.35rem 0.8rem' }}
                >
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          )}

          {ratingFeedback && (
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
              ✓ {ratingFeedback}
            </div>
          )}
        </section>

        {/* 6. Card Footer: Date & Admin Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
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
    </article>
  );
};

export default PlaceCard;

