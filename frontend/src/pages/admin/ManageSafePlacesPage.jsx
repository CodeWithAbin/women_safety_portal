import React, { useState, useEffect } from 'react';
import { safePlaceService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import ConfirmModal from '../../components/ConfirmModal';
import {
  IconShieldCheck,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconTrash,
  IconSearch,
  IconMapPin,
  IconStar,
  IconUser,
  IconRefresh
} from '../../components/Icons';

const ManageSafePlacesPage = () => {
  const [places, setPlaces] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState('pending'); // default focus on pending
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Action states
  const [processingId, setProcessingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSafePlaces = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, summaryRes] = await Promise.all([
        safePlaceService.getAdminSafePlaces({
          status: statusFilter,
          state: stateFilter,
          district: districtFilter,
          search: searchQuery
        }),
        safePlaceService.getAdminSummary()
      ]);

      if (listRes.success) {
        setPlaces(listRes.data || []);
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data || { pending: 0, accepted: 0, rejected: 0, total: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch safe places.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafePlaces();
  }, [statusFilter, stateFilter, districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSafePlaces();
  };

  const handleStatusChange = async (id, newStatus) => {
    setProcessingId(id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await safePlaceService.updateSafePlaceStatus(id, newStatus);
      if (res.success) {
        setSuccessMsg(`Safe place status updated to '${newStatus}'.`);
        fetchSafePlaces();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const res = await safePlaceService.deleteSafePlace(deleteTargetId);
      if (res.success) {
        setSuccessMsg('Safe place deleted successfully.');
        setDeleteTargetId(null);
        fetchSafePlaces();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete safe place.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Manage Safe Places</h1>
            <p className="page-subtitle">
              Review, verify, and moderate community-submitted safe spots, illuminated zones, and help facilities.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchSafePlaces}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconRefresh size={14} />
            Refresh
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}

      {/* Metric Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-content">
            <span className="metric-label">Pending Verification</span>
            <span className="metric-value" style={{ color: '#d97706' }}>{summary.pending}</span>
          </div>
          <div className="metric-icon-wrap" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <IconClock size={24} />
          </div>
        </div>

        <div className="card metric-card" style={{ borderLeft: '4px solid var(--hazard-low)' }}>
          <div className="metric-content">
            <span className="metric-label">Approved Safe Places</span>
            <span className="metric-value" style={{ color: 'var(--hazard-low)' }}>{summary.accepted}</span>
          </div>
          <div className="metric-icon-wrap" style={{ backgroundColor: 'var(--hazard-low-bg)', color: 'var(--hazard-low)' }}>
            <IconShieldCheck size={24} />
          </div>
        </div>

        <div className="card metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="metric-content">
            <span className="metric-label">Rejected Submissions</span>
            <span className="metric-value" style={{ color: '#dc2626' }}>{summary.rejected}</span>
          </div>
          <div className="metric-icon-wrap" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <IconAlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.85rem' }}>
          {[
            { id: 'pending', label: `Pending Review (${summary.pending})` },
            { id: 'accepted', label: `Approved (${summary.accepted})` },
            { id: 'rejected', label: `Rejected (${summary.rejected})` },
            { id: 'all', label: `All (${summary.total})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search place name, address, submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingRight: '2rem' }}
              />
              <button
                type="submit"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)' }}
              >
                <IconSearch size={16} />
              </button>
            </div>

            <StateDistrictSelector
              selectedState={stateFilter}
              selectedDistrict={districtFilter}
              onStateChange={(st) => setStateFilter(st)}
              onDistrictChange={(dt) => setDistrictFilter(dt)}
              allowAllOption={true}
              allStateText="All States"
              allDistrictText="All Districts"
              stateLabel="Filter State"
              districtLabel="Filter District"
            />
          </div>
        </form>
      </div>

      {/* Safe Places Moderation List */}
      {loading ? (
        <LoadingSpinner message="Loading safe places for moderation..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon={<IconShieldCheck size={42} color="var(--primary-blue)" />}
          title="No Safe Places Found"
          message={`No safe places matching status '${statusFilter}' and the selected filters.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {places.map((sp) => {
            const isPending = sp.status === 'pending';
            const isAccepted = sp.status === 'accepted';
            const isRejected = sp.status === 'rejected';

            return (
              <article
                key={sp.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  borderLeft: isPending
                    ? '4px solid #f59e0b'
                    : isAccepted
                      ? '4px solid var(--hazard-low)'
                      : '4px solid #dc2626'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--primary-navy)' }}>
                        {sp.name}
                      </h3>
                      <span
                        className={`badge ${
                          isAccepted
                            ? 'badge-success'
                            : isRejected
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {sp.status}
                      </span>
                    </div>

                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      <IconMapPin size={14} color="var(--hazard-low)" />
                      <span>{sp.address}, {sp.district}, {sp.state}</span>
                      {sp.latitude != null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          ({sp.latitude.toFixed(4)}, {sp.longitude.toFixed(4)})
                        </span>
                      )}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                    {[...Array(5)].map((_, idx) => (
                      <IconStar
                        key={idx}
                        size={15}
                        filled={idx < (sp.rating || 5)}
                        color={idx < (sp.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                    <span style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.9rem', marginLeft: '4px' }}>
                      {sp.rating || 5}/5
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55, margin: '0.75rem 0' }}>
                  {sp.description}
                </p>

                {/* Submitter Info & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <IconUser size={14} />
                    <span>Submitted by: <strong>{sp.submitter_name || 'User'}</strong> ({sp.submitter_email || 'No email'}) on {sp.created_at ? new Date(sp.created_at).toLocaleDateString() : ''}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ backgroundColor: 'var(--hazard-low)', borderColor: 'var(--hazard-low)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleStatusChange(sp.id, 'accepted')}
                          disabled={processingId === sp.id}
                        >
                          <IconCheckCircle size={14} />
                          Approve Safe Place
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => handleStatusChange(sp.id, 'rejected')}
                          disabled={processingId === sp.id}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isRejected && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(sp.id, 'accepted')}
                        disabled={processingId === sp.id}
                      >
                        Re-Approve
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#d97706' }}
                        onClick={() => handleStatusChange(sp.id, 'rejected')}
                        disabled={processingId === sp.id}
                      >
                        Revoke Approval
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#991b1b' }}
                      onClick={() => setDeleteTargetId(sp.id)}
                      disabled={processingId === sp.id}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <ConfirmModal
          isOpen={true}
          title="Delete Safe Place"
          message="Are you sure you want to permanently remove this safe place record? This action cannot be undone."
          confirmText={isDeleting ? 'Deleting...' : 'Delete Safe Place'}
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
};

export default ManageSafePlacesPage;
