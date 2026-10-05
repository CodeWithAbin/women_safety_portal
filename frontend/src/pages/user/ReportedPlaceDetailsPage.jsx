import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService, getPhotoUrl } from '../../services/api';
import SafetyMap from '../../components/SafetyMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import {
  IconShield,
  IconShieldCheck,
  IconMapPin,
  IconMap,
  IconSearch,
  IconNavigation,
  IconStar,
  IconCheck,
  IconCheckCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendar,
  IconFileText,
  IconEdit,
  IconClock
} from '../../components/Icons';

const ReportedPlaceDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [place, setPlace] = useState(location.state?.place || null);
  const [loading, setLoading] = useState(!location.state?.place);
  const [error, setError] = useState('');

  // Rating State
  const [communityRating, setCommunityRating] = useState(
    place?.community_rating != null
      ? Number(place.community_rating).toFixed(1)
      : place?.rating != null
      ? Number(place.rating).toFixed(1)
      : 'N/A'
  );
  const [ratingCount, setRatingCount] = useState(place?.rating_count != null ? place.rating_count : 1);
  const [userRating, setUserRating] = useState(place?.user_rating != null ? place.user_rating : null);
  const [hasRated, setHasRated] = useState(place?.has_rated === true || place?.user_rating != null);
  const [showRatingSelector, setShowRatingSelector] = useState(false);
  const [selectedRating, setSelectedRating] = useState(place?.user_rating || 4);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Location / Distance State
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    // Try to get user location if browser supports it (without prompting intrusive alerts)
    if (navigator.geolocation && !userCoords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6))
          });
        },
        () => {},
        { timeout: 6000 }
      );
    }
  }, [userCoords]);

  // Load place details if not passed via route state
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await placeService.getPlaceById(id);
        if (res.success && res.data) {
          const found = res.data;
          setPlace(found);
          setCommunityRating(
            found.community_rating != null
              ? Number(found.community_rating).toFixed(1)
              : found.rating != null
              ? Number(found.rating).toFixed(1)
              : 'N/A'
          );
          setRatingCount(found.rating_count != null ? found.rating_count : 1);
          setUserRating(found.user_rating != null ? found.user_rating : null);
          setHasRated(found.has_rated === true || found.user_rating != null);
          if (found.user_rating) setSelectedRating(found.user_rating);
          return;
        }
      } catch {
        // Fallback to accepted places search
        try {
          const res = await placeService.getAcceptedPlaces();
          if (res.success && Array.isArray(res.data)) {
            const found = res.data.find((p) => String(p.id) === String(id));
            if (found) {
              setPlace(found);
              setCommunityRating(
                found.community_rating != null
                  ? Number(found.community_rating).toFixed(1)
                  : found.rating != null
                  ? Number(found.rating).toFixed(1)
                  : 'N/A'
              );
              setRatingCount(found.rating_count != null ? found.rating_count : 1);
              setUserRating(found.user_rating != null ? found.user_rating : null);
              setHasRated(found.has_rated === true || found.user_rating != null);
              if (found.user_rating) setSelectedRating(found.user_rating);
              return;
            }
          }
        } catch {
          // ignore fallback error
        }
        setError('Reported place not found or may have expired from active listings.');
      } finally {
        setLoading(false);
      }
    };

    if (!place || String(place.id) !== String(id)) {
      fetchPlaceDetails();
    }
  }, [id, place]);

  const handleRatingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingRating || !place) return;
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
        setRatingFeedback('Thank you! Your safety rating has been recorded.');
        setTimeout(() => setRatingFeedback(''), 4000);
      }
    } catch (err) {
      setRatingFeedback(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading reported place details..." />;
  }

  if (error || !place) {
    return (
      <div className="place-details-page" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <AlertBanner type="error" message={error || 'Reported place not found.'} />
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            &larr; Back to Dashboard
          </button>
          <Link to="/places" className="btn btn-primary">
            Browse All Reported Places
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = place.resolved === true || place.resolved === 1 || place.resolved === 'true';
  const resolvedDate = place.resolved_at
    ? new Date(place.resolved_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const formattedReportDate = place.created_at
    ? new Date(place.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const hasCoords = place.latitude != null && place.longitude != null;

  return (
    <div className="place-details-page" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Navigation Breadcrumb Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <IconArrowLeft size={14} /> Dashboard
          </button>
          <Link
            to="/my-reports"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <IconFileText size={14} /> My Reports
          </Link>
        </div>

        <Link
          to="/places"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <IconSearch size={14} /> Browse Reported Places
        </Link>
      </div>

      {/* 2. Main Place Header Card */}
      <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.82rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconShield size={13} /> Reported Place
              </span>
              {isResolved && (
                <span className="badge badge-resolved" style={{ fontSize: '0.82rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <IconCheckCircle size={13} /> RESOLVED
                </span>
              )}
              {place.distance_km != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700 }}>
                  <IconNavigation size={12} /> {place.distance_km} km away
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.4rem 0', lineHeight: 1.25 }}>
              {place.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-body)', fontSize: '0.96rem' }}>
              <IconMapPin size={16} color="var(--primary-blue)" />
              <strong>{place.address}</strong>, {place.district}, {place.state}
            </div>
          </div>

          {place.status === 'pending' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              <IconClock size={14} /> Under Review
            </div>
          ) : place.status === 'rejected' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              <IconAlertTriangle size={14} /> Moderation Rejected
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 700 }}>
              <IconCheck size={14} /> Verified by Admin
            </div>
          )}
        </div>

        {/* Resolved Banner */}
        {isResolved && (
          <div className="place-resolved-banner" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
              <IconCheckCircle size={16} color="#059669" />
              <span>RESOLVED</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#047857', marginTop: '0.25rem' }}>
              Reported issue resolved{resolvedDate ? ` on ${resolvedDate}` : ''}.
            </div>
          </div>
        )}

        {/* Photo Display */}
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '420px', backgroundColor: '#f1f5f9', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
          <img
            src={getPhotoUrl(place.photo)}
            alt={place.name}
            style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22400%22%20viewBox%3D%220%200%20800%20400%22%3E%3Crect%20fill%3D%22%23f1f5f9%22%20width%3D%22800%22%20height%3D%22400%22%20%2F%3E%3Ctext%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%227%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EPhoto%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
            }}
          />
        </div>

        {/* Description & Report Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconFileText size={18} /> Safety Concern Description
            </h3>
            <p style={{ color: 'var(--text-body)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
              {place.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconCalendar size={14} /> <span><strong>Reported Date:</strong> {formattedReportDate || 'Recorded in Directory'}</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconAlertTriangle size={14} /> <strong>Initial Report Rating:</strong> {place.rating ? `${place.rating} / 5 ★` : '3 / 5 ★'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', paddingLeft: '1.35rem' }}>
                (Initial assessment submitted at time of report)
              </div>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconShieldCheck size={14} /> <strong>Administrative Review:</strong> Approved & Published
            </div>
          </div>
        </div>
      </div>

      {/* 3. Community Safety Rating Section */}
      <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconStar filled size={20} color="#d97706" /> Community Safety Rating
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Calculated dynamically from verified ratings submitted by community members.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.4rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              {communityRating}
            </span>
            <span style={{ fontSize: '1.1rem', color: '#92400e', fontWeight: 700 }}>/ 5 ★</span>
            <span style={{ fontSize: '0.82rem', color: '#92400e', marginLeft: '0.5rem', fontWeight: 600 }}>
              ({ratingCount} rating{ratingCount === 1 ? '' : 's'})
            </span>
          </div>
        </div>

        {/* Rating Submission Action */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                {hasRated ? `Your Current Rating: ${userRating} ★` : 'Have you visited or observed this area?'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {hasRated ? 'You can update your rating at any time.' : 'Share your safety score to assist fellow citizens.'}
              </div>
            </div>

            <button
              type="button"
              className={`btn ${hasRated ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              onClick={() => setShowRatingSelector((prev) => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {hasRated ? (
                <>
                  <IconEdit size={14} /> Edit Your Rating ({userRating}★)
                </>
              ) : (
                <>
                  <IconStar filled size={14} color="#ffffff" /> Rate This Place
                </>
              )}
            </button>
          </div>

          {showRatingSelector && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
                Select Safety Rating (1 = Minor Concern, 5 = Severe Concern):
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className={`btn btn-sm ${selectedRating === star ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.88rem' }}
                  >
                    {star} ★
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                  style={{ marginLeft: 'auto', padding: '0.45rem 1rem' }}
                >
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          )}

          {ratingFeedback && (
            <div style={{ marginTop: '0.65rem', fontSize: '0.88rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconCheck size={14} /> {ratingFeedback}
            </div>
          )}
        </div>
      </div>

      {/* 4. Map & Location Section */}
      <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconMap size={20} color="var(--primary-blue)" /> Reported Location on Safety Map
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Interactive geographic placement for {place.name}
            </p>
          </div>

          {hasCoords && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconMapPin size={13} /> <strong>Coordinates:</strong> {Number(place.latitude).toFixed(4)}, {Number(place.longitude).toFixed(4)}
            </div>
          )}
        </div>

        {hasCoords ? (
          <SafetyMap
            places={[place]}
            selectedPlaceId={place.id}
            userLocation={userCoords}
            mapHeight="360px"
            showDetailsButton={false}
          />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)', color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <IconMapPin size={36} />
            </div>
            <h4 style={{ color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>Map Coordinates Pending</h4>
            <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
              This reported place was submitted without geographic GPS coordinates. Location is verified by address: <strong>{place.address}, {place.district}, {place.state}</strong>.
            </p>
          </div>
        )}
      </div>

      {/* 5. Bottom Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem 0' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.75rem 1.5rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <IconArrowLeft size={16} /> Back to Dashboard
        </button>

        <Link
          to="/places"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          Browse All Reported Places <IconSearch size={16} />
        </Link>
      </div>

    </div>
  );
};

export default ReportedPlaceDetailsPage;
