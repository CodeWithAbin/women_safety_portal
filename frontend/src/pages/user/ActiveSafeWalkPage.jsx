import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { safeWalkService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

const ActiveSafeWalkPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [walk, setWalk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Action States
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [completedState, setCompletedState] = useState(false);
  const [cancelledState, setCancelledState] = useState(false);

  const fetchActiveWalk = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await safeWalkService.getActiveSafeWalk();
      if (res.success && res.data) {
        setWalk(res.data);
      } else {
        setWalk(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load active Safe Walk session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveWalk();
  }, []);

  // Complete Walk Handler
  const handleCompleteWalk = async () => {
    if (!walk) return;
    setActionLoading(true);
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

  // Cancel Walk Handler
  const handleCancelWalk = async () => {
    if (!walk) return;
    setActionLoading(true);
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

  // Completed State View
  if (completedState) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <div className="safewalk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Journey Completed!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            Your Safe Walk has ended and your companion no longer has access to an active journey.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/safe-walk" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              🚶‍♀️ Start Another Safe Walk
            </Link>
            <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cancelled State View
  if (cancelledState) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <div className="safewalk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛑</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
            Safe Walk Cancelled
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem' }}>
            Your Safe Walk session has been cancelled. Your companion has been informed.
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

  // Empty State View (No Active Walk)
  if (!walk) {
    return (
      <div className="safewalk-container" style={{ maxWidth: '680px' }}>
        <EmptyState
          icon="🚶‍♀️"
          title="No Active Safe Walk Session"
          message="You do not have any active Safe Walk journeys currently in progress as a walker or companion."
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

  // Role Determination
  const isWalker = user && walk.user_id === user.id;
  const isCompanion = user && walk.companion_id === user.id;

  const formattedStartedAt = walk.started_at
    ? new Date(walk.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Just now';

  const formattedExpectedArrival = walk.expected_arrival
    ? new Date(walk.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Not specified';

  return (
    <div className="safewalk-container">
      {error && (
        <AlertBanner type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Companion View Notification Banner */}
      {isCompanion && (
        <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e40af' }}>
          <span style={{ fontSize: '1.5rem' }}>🤝</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem' }}>You are the Community Companion for this journey</strong>
            <span style={{ fontSize: '0.86rem', color: '#1e3a8a' }}>
              {walk.user_name} is currently walking to their destination. You will be notified when they arrive safely.
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
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

        {/* Start Coordinates (if available) */}
        {walk.start_latitude && walk.start_longitude && (
          <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>🧭 Start Coordinates:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
              {walk.start_latitude}, {walk.start_longitude}
            </span>
          </div>
        )}

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
