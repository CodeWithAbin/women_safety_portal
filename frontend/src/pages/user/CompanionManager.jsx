import React, { useState, useEffect, useCallback } from 'react';
import { companionService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import ConfirmModal from '../../components/ConfirmModal';

const CompanionManager = ({ onSelectTab }) => {
  // State for My Accepted Companions
  const [companions, setCompanions] = useState([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);

  // State for Pending Incoming Requests
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // State for User Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequestUserIds, setSentRequestUserIds] = useState(new Set());
  const [sendingId, setSendingId] = useState(null);

  // Status and Modal State
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, companionId: null, companionName: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch accepted companions
  const fetchCompanions = useCallback(async () => {
    setLoadingCompanions(true);
    try {
      const res = await companionService.getAcceptedCompanions();
      if (res.success && Array.isArray(res.data)) {
        setCompanions(res.data);
      }
    } catch (err) {
      console.warn('Failed to load companions:', err);
    } finally {
      setLoadingCompanions(false);
    }
  }, []);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await companionService.getPendingRequests();
      if (res.success && Array.isArray(res.data)) {
        setPendingRequests(res.data);
      }
    } catch (err) {
      console.warn('Failed to load pending requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanions();
    fetchPendingRequests();
  }, [fetchCompanions, fetchPendingRequests]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await companionService.searchUsers(searchQuery);
        if (res.success && Array.isArray(res.data)) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.warn('User search error:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Send Companion Request
  const handleSendRequest = async (userId, userName) => {
    setSendingId(userId);
    setAlert({ type: '', message: '' });
    try {
      const res = await companionService.sendRequest({ recipientId: userId });
      if (res.success) {
        setSentRequestUserIds((prev) => new Set([...prev, userId]));
        setAlert({
          type: 'success',
          message: `Companion request sent to ${userName}. They will appear in your companions list once accepted.`
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send companion request.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setSendingId(null);
    }
  };

  // Accept Incoming Request
  const handleAcceptRequest = async (id, requesterName) => {
    setActionLoading(true);
    setAlert({ type: '', message: '' });
    try {
      const res = await companionService.acceptRequest(id);
      if (res.success) {
        setAlert({ type: 'success', message: `You are now companions with ${requesterName}!` });
        // Refresh both lists
        fetchPendingRequests();
        fetchCompanions();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to accept request.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Decline Incoming Request
  const handleDeclineRequest = async (id, requesterName) => {
    setActionLoading(true);
    setAlert({ type: '', message: '' });
    try {
      const res = await companionService.rejectRequest(id);
      if (res.success) {
        setAlert({ type: 'info', message: `Request from ${requesterName} declined.` });
        fetchPendingRequests();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to decline request.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Remove Modal
  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, companionId: id, companionName: name });
  };

  // Confirm Remove Companion
  const handleConfirmRemove = async () => {
    if (!deleteModal.companionId) return;
    setActionLoading(true);
    setAlert({ type: '', message: '' });
    try {
      const res = await companionService.removeCompanion(deleteModal.companionId);
      if (res.success) {
        setAlert({ type: 'success', message: `Removed ${deleteModal.companionName} from your companions.` });
        setDeleteModal({ isOpen: false, companionId: null, companionName: '' });
        fetchCompanions();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to remove companion.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {alert.message && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* =========================================================================
          SECTION 1: Search and Add New Companion
          ========================================================================= */}
      <section className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', backgroundColor: '#eff6ff', color: 'var(--primary-blue)', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>🔍</span> Community Network
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
            Find a Community Companion
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
            Search registered citizens by name or email address to connect as Safe Walk companions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Results Display */}
        {searching ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Searching registered citizens...
          </div>
        ) : searchResults.length > 0 ? (
          <div className="companion-grid">
            {searchResults.map((usr) => {
              const isAlreadyCompanion = companions.some((c) => c.companion_id === usr.id);
              const isRequestSent = sentRequestUserIds.has(usr.id);

              return (
                <div key={usr.id} className="companion-card-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.85rem' }}>
                        {usr.name ? usr.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                          {usr.name}
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{usr.email}</span>
                      </div>
                    </div>
                    {usr.district && usr.state && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        📍 {usr.district}, {usr.state}
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    {isAlreadyCompanion ? (
                      <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
                        ✓ Companion
                      </span>
                    ) : isRequestSent ? (
                      <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', fontSize: '0.82rem' }}>
                        ✓ Request Sent
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSendRequest(usr.id, usr.name)}
                        disabled={sendingId === usr.id}
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      >
                        {sendingId === usr.id ? 'Sending...' : '➕ Add Companion'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim().length >= 2 ? (
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No registered users found matching "{searchQuery}". Make sure the person has an active account.
          </div>
        ) : null}
      </section>

      {/* =========================================================================
          SECTION 2: Pending Incoming Requests
          ========================================================================= */}
      {pendingRequests.length > 0 && (
        <section className="card" style={{ padding: '1.75rem', backgroundColor: '#fffbeb', border: '1.5px solid #fef3c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <span>📬</span> Action Required
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                Incoming Companion Requests ({pendingRequests.length})
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    👥
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                      {req.requester_name}
                    </h4>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{req.requester_email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => handleAcceptRequest(req.id, req.requester_name)}
                    disabled={actionLoading}
                  >
                    ✓ Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeclineRequest(req.id, req.requester_name)}
                    disabled={actionLoading}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: My Community Companions
          ========================================================================= */}
      <section className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <span>🤝</span> Verified Trusted Network
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              My Community Companions ({companions.length})
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              Registered companions you can select when initiating a Safe Walk journey.
            </p>
          </div>
          {onSelectTab && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onSelectTab('start')}
              disabled={companions.length === 0}
            >
              🚶‍♀️ Start Safe Walk
            </button>
          )}
        </div>

        {loadingCompanions ? (
          <LoadingSpinner message="Loading your community companions..." />
        ) : companions.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No Community Companions Yet"
            message="You need at least one accepted community companion before you can start a Safe Walk. Use the search box above to find and invite registered users."
          />
        ) : (
          <div className="companion-grid">
            {companions.map((comp) => {
              const companionName = comp.companion_name || 'Companion';
              const companionEmail = comp.companion_email || '';
              const companionPhone = comp.companion_phone || '';
              const companionLoc = comp.companion_district && comp.companion_state ? `${comp.companion_district}, ${comp.companion_state}` : '';

              return (
                <div key={comp.id} className="companion-card-item">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                        {companionName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                          {companionName}
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{companionEmail}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      {companionPhone && <div>📞 {companionPhone}</div>}
                      {companionLoc && <div>📍 {companionLoc}</div>}
                      <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                        ✓ Accepted Companion
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--hazard-high)', borderColor: '#fecdd3', fontSize: '0.82rem' }}
                      onClick={() => openDeleteModal(comp.id, companionName)}
                      disabled={actionLoading}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal for Removing Companion */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Remove Community Companion"
        message={`Are you sure you want to remove ${deleteModal.companionName} from your companions? You will not be able to select them for a Safe Walk until a new request is accepted.`}
        confirmText="Remove Companion"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleConfirmRemove}
        onCancel={() => setDeleteModal({ isOpen: false, companionId: null, companionName: '' })}
      />
    </div>
  );
};

export default CompanionManager;
