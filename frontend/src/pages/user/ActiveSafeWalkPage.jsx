import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { safeWalkService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import SafeWalkMap from '../../components/SafeWalkMap';

const ActiveSafeWalkPage = () => {
  const { user } = useAuth();

  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Location State (for Walker)
  const [walkerLocation, setWalkerLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState(null);
  const [timeAgoDisplay, setTimeAgoDisplay] = useState('');

  // Modals & Action States
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [completedState, setCompletedState] = useState(false);
  const [cancelledState, setCancelledState] = useState(false);

  // Refs for tracking lifecycle & cleanup
  const watchIdRef = useRef(null);
  const lastSentTimeRef = useRef(0);
  const pollingTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch active walk initial data
  const fetchActiveWalk = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await safeWalkService.getActiveSafeWalk();
      if (!isMountedRef.current) return;

      if (res.success && res.data) {
        setWalk(res.data);
        if (res.data.last_latitude && res.data.last_longitude) {
          setWalkerLocation({
            latitude: res.data.last_latitude,
            longitude: res.data.last_longitude
          });
        }
        if (res.data.updated_at) {
          setLastLocationUpdateTime(new Date(res.data.updated_at));
        }
      } else {
        setWalk(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('Active Safe Walk fetch notice:', err);
        if (isInitial) {
          setError(err.response?.data?.message || err.message || 'Failed to load active Safe Walk session.');
        }
      }
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchActiveWalk(true);
  }, [fetchActiveWalk]);

  // Determine roles
  const isWalker = Boolean(user && walk && walk.user_id === user.id);
  const isCompanion = Boolean(user && walk && walk.companion_id === user.id);
  const isActive = Boolean(walk && walk.status === 'ACTIVE');

  // =========================================================================
  // 1. WALKER GPS WATCHER & THROTTLED LOCATION SHARING
  // =========================================================================
  useEffect(() => {
    if (!isWalker || !isActive || !walk?.id) return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationError('');

    // Watch position callback
    const handlePositionSuccess = (position) => {
      if (!isMountedRef.current) return;

      const lat = parseFloat(position.coords.latitude.toFixed(6));
      const lon = parseFloat(position.coords.longitude.toFixed(6));

      // Update local walker state for immediate map display
      setWalkerLocation({ latitude: lat, longitude: lon });
      const now = Date.now();

      // Throttle backend updates to once every 12 seconds
      if (now - lastSentTimeRef.current >= 12000) {
        lastSentTimeRef.current = now;
        setLastLocationUpdateTime(new Date());

        safeWalkService
          .updateLocation(walk.id, { latitude: lat, longitude: lon })
          .then((res) => {
            if (res.success && isMountedRef.current) {
              setLastLocationUpdateTime(new Date());
            }
          })
          .catch((err) => {
            console.warn('Background location update notice:', err.message);
          });
      }
    };

    const handlePositionError = (err) => {
      if (!isMountedRef.current) return;
      if (err.code === 1) {
        // Permission denied
        setLocationError(
          'Location sharing is unavailable. You can continue your Safe Walk, but your companion will not receive your current location.'
        );
      } else {
        console.warn('GPS position acquisition notice:', err.message);
      }
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        options
      );
    } catch (e) {
      console.warn('Could not start GPS watch:', e);
    }

    // Cleanup GPS watcher on unmount or when walk is completed/cancelled
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isWalker, isActive, walk?.id]);

  // =========================================================================
  // 2. COMPANION PERIODIC POLLING (Every 12 Seconds)
  // =========================================================================
  useEffect(() => {
    if (!isCompanion || !isActive || !walk?.id) return;

    const pollIntervalMs = 12000;

    pollingTimerRef.current = setInterval(async () => {
      if (!isMountedRef.current) return;
      try {
        const res = await safeWalkService.getSafeWalkById(walk.id);
        if (res.success && res.data && isMountedRef.current) {
          setWalk(res.data);
          if (res.data.last_latitude && res.data.last_longitude) {
            setWalkerLocation({
              latitude: res.data.last_latitude,
              longitude: res.data.last_longitude
            });
          }
          if (res.data.updated_at) {
            setLastLocationUpdateTime(new Date(res.data.updated_at));
          }

          // If journey completed or cancelled, stop polling
          if (res.data.status !== 'ACTIVE') {
            clearInterval(pollingTimerRef.current);
          }
        }
      } catch (err) {
        console.warn('Companion polling notice:', err.message);
      }
    }, pollIntervalMs);

    // Cleanup polling timer on unmount
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isCompanion, isActive, walk?.id]);

  // =========================================================================
  // 3. RELATIVE TIME AGO CALCULATION (for location update status)
  // =========================================================================
  useEffect(() => {
    if (!lastLocationUpdateTime) {
      setTimeAgoDisplay('');
      return;
    }

    const updateDisplay = () => {
      const secondsAgo = Math.floor((Date.now() - lastLocationUpdateTime.getTime()) / 1000);
      if (secondsAgo < 10) {
        setTimeAgoDisplay('Just now');
      } else if (secondsAgo < 60) {
        setTimeAgoDisplay(`${secondsAgo}s ago`);
      } else {
        const minsAgo = Math.floor(secondsAgo / 60);
        setTimeAgoDisplay(`${minsAgo}m ago`);
      }
    };

    updateDisplay();
    const timer = setInterval(updateDisplay, 5000);
    return () => clearInterval(timer);
  }, [lastLocationUpdateTime]);

  // =========================================================================
  // ACTION HANDLERS: Complete & Cancel
  // =========================================================================
  const handleCompleteWalk = async () => {
    if (!walk) return;
    setActionLoading(true);

    // Immediately stop geolocation watch
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      const res = await safeWalkService.completeSafeWalk(walk.id);
      if (res.success) {
        setCompleteModalOpen(false);
        setCompletedState(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete Safe Walk session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelWalk = async () => {
    if (!walk) return;
    setActionLoading(true);

    // Immediately stop geolocation watch
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      const res = await safeWalkService.cancelSafeWalk(walk.id);
      if (res.success) {
        setCancelModalOpen(false);
        setCancelledState(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel Safe Walk session.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving active Safe Walk status..." />;
  }

  // =========================================================================
  // VIEW: Completed State
  // =========================================================================
  if (completedState) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <div className="safewalk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Journey Completed!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            Your Safe Walk has ended and your companion no longer has access to your journey or location.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/safe-walk" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              🚶‍♀️ Start Another Safe Walk
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Cancelled State
  // =========================================================================
  if (cancelledState) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <div className="safewalk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛑</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Safe Walk Cancelled
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            Your Safe Walk session has ended and location sharing is stopped.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/safe-walk" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Safe Walk Hub
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: No Active Walk
  // =========================================================================
  if (!walk) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <EmptyState
          icon="🚶‍♀️"
          title="No Active Safe Walk Session"
          message="You do not have any active Safe Walk journeys in progress as a walker or companion."
          actionButton={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              <Link to="/safe-walk" className="btn btn-primary">
                🚶‍♀️ Start a Safe Walk
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                Go to Dashboard
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const formattedStartedAt = walk.started_at
    ? new Date(walk.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Just now';

  const formattedExpectedArrival = walk.expected_arrival
    ? new Date(walk.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Not specified';

  // Target coordinates for SafeWalkMap
  const displayLat = walkerLocation?.latitude || walk.last_latitude || walk.start_latitude || null;
  const displayLon = walkerLocation?.longitude || walk.last_longitude || walk.start_longitude || null;

  return (
    <div className="safewalk-container">
      {error && (
        <AlertBanner type="error" message={error} onClose={() => setError('')} />
      )}

      {locationError && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', color: '#92400e', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>ℹ️</span>
          <span>{locationError}</span>
        </div>
      )}

      {/* Companion View Notification Banner */}
      {isCompanion && (
        <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e40af' }}>
          <span style={{ fontSize: '1.5rem' }}>🤝</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem' }}>You are the Community Companion for this journey</strong>
            <span style={{ fontSize: '0.86rem', color: '#1e3a8a' }}>
              {walk.user_name} has shared their live Safe Walk journey with you. Updates refresh automatically.
            </span>
          </div>
        </div>
      )}

      {/* Main Active Safe Walk Card */}
      <div className="safewalk-card" style={{ borderTop: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <span className="badge-safewalk-active">
                <span className="pulse-dot"></span> ACTIVE JOURNEY
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Started at {formattedStartedAt}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              {walk.destination}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="btn btn-secondary btn-sm" style={{ opacity: 0.6, cursor: 'not-allowed', fontSize: '0.8rem' }} title="Extend Journey will be available in the next release">
              ⏱️ Extend Journey (Coming Soon)
            </span>
          </div>
        </div>

        {/* Journey Details Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ padding: '1.15rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              📍 Destination
            </span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--primary-navy)' }}>
              {walk.destination}
            </strong>
          </div>

          <div style={{ padding: '1.15rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              🕒 Expected Arrival
            </span>
            <strong style={{ fontSize: '1.05rem', color: '#1e3a8a' }}>
              {formattedExpectedArrival}
            </strong>
          </div>

          <div style={{ padding: '1.15rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              {isWalker ? '🤝 Community Companion' : '🚶‍♀️ Walker'}
            </span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--primary-navy)', display: 'block' }}>
              {isWalker ? walk.companion_name : walk.user_name}
            </strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isWalker ? walk.companion_phone || walk.companion_email : walk.user_phone || walk.user_email}
            </span>
          </div>
        </div>

        {/* =========================================================================
            SAFE WALK LIVE MAP (Leaflet Live Journey View)
            ========================================================================= */}
        <section style={{ marginBottom: '1.75rem' }} aria-label="Safe Walk Live Map">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              <span>🗺️</span> {isWalker ? 'Your Live Safe Walk Map' : `${walk.user_name}'s Live Location`}
            </div>
            {timeAgoDisplay && (
              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                ● Last update: {timeAgoDisplay}
              </span>
            )}
          </div>

          <SafeWalkMap
            latitude={displayLat}
            longitude={displayLon}
            walkerName={walk.user_name || 'Walker'}
            destination={walk.destination}
            lastUpdated={timeAgoDisplay}
            isWalker={isWalker}
            status={walk.status}
            height="320px"
          />
        </section>

        {/* Privacy Notice */}
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
          <strong>🔒 Privacy Protection:</strong> {isWalker
            ? 'Your current location is shared only with your selected community companion while this Safe Walk is active. Location sharing stops when the Safe Walk is completed or cancelled.'
            : 'You have access to this journey location because you were selected as a community companion. Location sharing stops when the Safe Walk concludes.'}
        </div>

        {/* Walker Action Controls */}
        {isWalker && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading}
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel Safe Walk
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={() => setCompleteModalOpen(true)}
              disabled={actionLoading}
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}
            >
              ✓ Complete Journey
            </button>
          </div>
        )}

        {/* Companion View Footer Note */}
        {isCompanion && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            🔒 Safe Walk in progress. Only the walker can mark this journey complete or cancelled.
          </div>
        )}
      </div>

      {/* Confirmation Modal for Complete */}
      <ConfirmModal
        isOpen={completeModalOpen}
        title="Complete Safe Walk"
        message={`Mark this Safe Walk to "${walk?.destination}" as safely completed? Your companion will be informed that you have arrived.`}
        confirmText="Yes, Complete Journey"
        cancelText="Cancel"
        loading={actionLoading}
        onConfirm={handleCompleteWalk}
        onCancel={() => setCompleteModalOpen(false)}
      />

      {/* Confirmation Modal for Cancel */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Safe Walk"
        message={`Are you sure you want to cancel this Safe Walk? Your companion will be informed that the session was ended.`}
        confirmText="Cancel Safe Walk"
        cancelText="Keep Journey Active"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleCancelWalk}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
};

export default ActiveSafeWalkPage;
