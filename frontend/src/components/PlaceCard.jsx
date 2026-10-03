import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPhotoUrl, placeService } from '../services/api';
import {
  IconMapPin,
  IconNavigation,
  IconCheck,
  IconCheckCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconShieldCheck,
  IconStar,
  IconEdit
} from './Icons';

const PlaceCard = ({ place, onEdit, onDelete, onResolve, isAdmin = false, onRatingSuccess, showViewDetails = true }) => {
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
  const isResolved = place.resolved === true || place.resolved === 1 || place.resolved === 'true';

  const getResolvedInfo = (resolvedAt) => {
    if (!resolvedAt) return null;
    const now = new Date();
    const resDate = new Date(resolvedAt);
    const diffMs = Math.max(0, now.getTime() - resDate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 7 - diffDays);
    return {
      formattedDate: resDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      daysAgo: diffDays === 0 ? 'today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`,
      daysLeftText: daysLeft === 1 ? '1 day left in active listings' : `${daysLeft} days left in active listings`
    };
  };

  const resolvedInfo = isResolved ? getResolvedInfo(place.resolved_at) : null;

  const getHazardBadge = (score) => {
    if (isNaN(score)) return <span className="badge badge-info">Rating: Unrated</span>;
    if (score >= 4.5) return <span className="badge badge-hazard-severe" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IconAlertTriangle size={12} /> Severe Concern ({score}/5)</span>;
    if (score >= 3.5) return <span className="badge badge-hazard-high" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IconAlertTriangle size={12} /> High Concern ({score}/5)</span>;
    if (score >= 2.0) return <span className="badge badge-hazard-medium" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IconAlertCircle size={12} /> Moderate Concern ({score}/5)</span>;
    return <span className="badge badge-hazard-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IconShieldCheck size={12} /> Minor Concern ({score}/5)</span>;
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
    <article className="card place-card" aria-label={`Reported Place: ${place.name}`}>
      {/* 1. Image with overlay badges */}
      <div className="place-card-image-wrap">
        <img
          src={getPhotoUrl(place.photo)}
          alt={place.name}
          className="place-card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%20viewBox%3D%220%200%20400%20200%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22400%22%20height%3D%22200%22%20%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20dy%3D%225%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
          }}
        />
        <div className="place-card-badge-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          {isResolved && (
            <span className="badge badge-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <IconCheckCircle size={12} /> RESOLVED
            </span>
          )}
          {getHazardBadge(numRating)}
        </div>
      </div>

      {/* Card Content */}
      <div className="place-card-content">
        {/* 2. Place Name / Problem Title */}
        <h3 className="place-card-title">{place.name}</h3>

        {/* 3. Location */}
        <div className="place-card-address">
          <IconMapPin size={15} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{place.address}, {place.district}, {place.state}</span>
        </div>

        {/* Distance Badge (if location search active) */}
        {place.distance_km != null && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 700, width: 'fit-content' }}>
            <IconNavigation size={12} /> {place.distance_km} km away
          </div>
        )}

        {/* Admin Coordinates display */}
        {isAdmin && place.latitude != null && place.longitude != null && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <IconMapPin size={12} />
            <span>Coordinates:</span>
            <strong>{Number(place.latitude).toFixed(4)}, {Number(place.longitude).toFixed(4)}</strong>
          </div>
        )}

        {/* 4. Description / Problem Statement */}
        <p className="place-card-desc">{place.description}</p>

        {/* 5. Resolved Info Banner (if resolved) */}
        {isResolved && (
          <div className="place-resolved-banner" role="status" aria-label="Resolution Status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#065f46', fontSize: '0.88rem' }}>
              <IconCheckCircle size={14} color="#059669" />
              <span>RESOLVED</span>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#047857', marginTop: '0.2rem', lineHeight: 1.4 }}>
              Reported issue resolved{resolvedInfo?.formattedDate ? ` on ${resolvedInfo.formattedDate}` : ''}
              {isAdmin && resolvedInfo && (
                <div style={{ fontSize: '0.78rem', color: '#065f46', opacity: 0.9, marginTop: '0.2rem' }}>
                  Resolved {resolvedInfo.daysAgo} ({resolvedInfo.daysLeftText})
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Community Safety Rating Box */}
        <section className="community-rating-card" aria-label="Community Safety Rating Information">
          <div className="community-rating-header">
            <div>
              <div className="community-rating-score" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconStar filled size={14} color="#d97706" />
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {hasRated ? (
                  <>
                    <IconEdit size={12} /> Your Rating: {userRating}★ (Edit)
                  </>
                ) : (
                  <>
                    <IconStar filled size={12} /> Rate Place
                  </>
                )}
              </button>
            )}
          </div>

          {/* Interactive Rating Selector */}
          {!isAdmin && showRatingSelector && (
            <div className="rating-selector-drawer">
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                Select Safety Rating (1 = Minor Concern, 5 = Severe Concern):
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
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <IconCheck size={12} /> {ratingFeedback}
            </div>
          )}
        </section>

        {/* 7. Card Footer: Date, View Details Action, Admin Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          {formattedDate && <span>Reported: {formattedDate}</span>}
          
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
            {showViewDetails && (
              <Link
                to={`/places/${place.id}`}
                state={{ place }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}
              >
                View Details &rarr;
              </Link>
            )}

            {isAdmin && (
              <>
                {!isResolved ? (
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => onResolve && onResolve(place)}
                    title="Mark this safety issue as resolved"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <IconCheck size={13} /> Mark as Resolved
                  </button>
                ) : (
                  <span className="badge badge-resolved" style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <IconCheck size={12} /> Resolved
                  </span>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(place)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(place)}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PlaceCard;

