import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { placeService, getPhotoUrl } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  IconFileText,
  IconMapPin,
  IconClock,
  IconCheck,
  IconCheckCircle,
  IconAlertCircle,
  IconXCircle,
  IconShieldCheck,
  IconStar,
  IconPlus,
  IconSearch,
  IconArrowRight,
  IconRefresh
} from '../../components/Icons';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await placeService.getMyReports();
      if (res.success && Array.isArray(res.data)) {
        setReports(res.data);
      } else {
        setReports([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your submitted reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter counts
  const counts = useMemo(() => {
    const total = reports.length;
    const underReview = reports.filter((r) => r.status === 'pending').length;
    const accepted = reports.filter(
      (r) => r.status === 'accepted' && !(r.resolved === true || r.resolved === 1 || r.resolved === 'true')
    ).length;
    const resolved = reports.filter(
      (r) => r.status === 'accepted' && (r.resolved === true || r.resolved === 1 || r.resolved === 'true')
    ).length;
    const rejected = reports.filter((r) => r.status === 'rejected').length;

    return { total, underReview, accepted, resolved, rejected };
  }, [reports]);

  // Filtered reports list
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const isResolved = r.resolved === true || r.resolved === 1 || r.resolved === 'true';
      if (activeFilter === 'under_review') return r.status === 'pending';
      if (activeFilter === 'accepted') return r.status === 'accepted' && !isResolved;
      if (activeFilter === 'resolved') return r.status === 'accepted' && isResolved;
      if (activeFilter === 'rejected') return r.status === 'rejected';
      return true;
    });
  }, [reports, activeFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (report) => {
    const isResolved = report.resolved === true || report.resolved === 1 || report.resolved === 'true';
    if (report.status === 'pending') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            fontSize: '0.82rem',
            padding: '0.3rem 0.65rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <IconClock size={13} /> Under Review
        </span>
      );
    }
    if (report.status === 'rejected') {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            fontSize: '0.82rem',
            padding: '0.3rem 0.65rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <IconXCircle size={13} /> Rejected
        </span>
      );
    }
    if (isResolved) {
      return (
        <span
          className="badge badge-resolved"
          style={{
            fontSize: '0.82rem',
            padding: '0.3rem 0.65rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <IconCheckCircle size={13} /> Resolved
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          fontSize: '0.82rem',
          padding: '0.3rem 0.65rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <IconShieldCheck size={13} /> Accepted & Published
      </span>
    );
  };

  const renderTimeline = (report) => {
    const isRejected = report.status === 'rejected';
    const isPending = report.status === 'pending';
    const isAccepted = report.status === 'accepted';
    const isResolved = report.resolved === true || report.resolved === 1 || report.resolved === 'true';

    const submittedDate = formatDate(report.created_at);
    const resolvedDate = formatDate(report.resolved_at);

    if (isRejected) {
      // 3-step timeline for rejected
      return (
        <div className="report-timeline-container">
          <div className="report-timeline">
            {/* Connector Line */}
            <div
              className="report-timeline-connector rejected"
              style={{ left: '16.6%', right: '16.6%' }}
              aria-hidden="true"
            />

            {/* Step 1: Submitted */}
            <div className="report-timeline-step completed">
              <div className="report-timeline-circle" title="Report Submitted">
                <IconCheck size={16} />
              </div>
              <div className="report-timeline-label">Submitted</div>
              <div className="report-timeline-sublabel">{submittedDate || 'Completed'}</div>
            </div>

            {/* Step 2: Under Review */}
            <div className="report-timeline-step completed">
              <div className="report-timeline-circle" title="Reviewed by Moderators">
                <IconCheck size={16} />
              </div>
              <div className="report-timeline-label">Under Review</div>
              <div className="report-timeline-sublabel">Reviewed</div>
            </div>

            {/* Step 3: Rejected */}
            <div className="report-timeline-step rejected">
              <div className="report-timeline-circle" title="Report Not Accepted">
                <IconXCircle size={18} />
              </div>
              <div className="report-timeline-label">Rejected</div>
              <div className="report-timeline-sublabel">Not Published</div>
            </div>
          </div>
        </div>
      );
    }

    // 4-step timeline for normal/accepted/resolved flow
    return (
      <div className="report-timeline-container">
        <div className="report-timeline">
          {/* Connector Line */}
          <div
            className={`report-timeline-connector ${isResolved ? 'completed' : ''}`}
            style={{
              left: '12.5%',
              right: '12.5%',
              background: isResolved
                ? '#059669'
                : isAccepted
                ? 'linear-gradient(to right, #059669 0%, #059669 66%, var(--border-medium) 66%, var(--border-medium) 100%)'
                : 'linear-gradient(to right, #059669 0%, #059669 33%, var(--border-medium) 33%, var(--border-medium) 100%)'
            }}
            aria-hidden="true"
          />

          {/* Step 1: Submitted */}
          <div className="report-timeline-step completed">
            <div className="report-timeline-circle" title="Report Submitted">
              <IconCheck size={16} />
            </div>
            <div className="report-timeline-label">Submitted</div>
            <div className="report-timeline-sublabel">{submittedDate || 'Completed'}</div>
          </div>

          {/* Step 2: Under Review */}
          <div className={`report-timeline-step ${isPending ? 'active under-review' : 'completed'}`}>
            <div className="report-timeline-circle" title={isPending ? 'Currently Under Moderation' : 'Moderation Completed'}>
              {isPending ? <IconClock size={18} /> : <IconCheck size={16} />}
            </div>
            <div className="report-timeline-label">Under Review</div>
            <div className="report-timeline-sublabel">
              {isPending ? 'In Progress' : 'Verified'}
            </div>
          </div>

          {/* Step 3: Accepted */}
          <div className={`report-timeline-step ${isAccepted && !isResolved ? 'active' : isAccepted ? 'completed' : 'upcoming'}`}>
            <div className="report-timeline-circle" title={isAccepted ? 'Accepted & Listed Publicly' : 'Awaiting Review'}>
              {isAccepted ? <IconCheck size={16} /> : <IconShieldCheck size={16} />}
            </div>
            <div className="report-timeline-label">Accepted</div>
            <div className="report-timeline-sublabel">
              {isAccepted ? 'Published' : 'Pending'}
            </div>
          </div>

          {/* Step 4: Resolved */}
          <div className={`report-timeline-step ${isResolved ? 'completed' : 'upcoming'}`}>
            <div className="report-timeline-circle" title={isResolved ? 'Issue Resolved' : 'Awaiting Resolution'}>
              {isResolved ? <IconCheckCircle size={18} /> : <IconCheck size={16} />}
            </div>
            <div className="report-timeline-label">Resolved</div>
            <div className="report-timeline-sublabel">
              {isResolved ? resolvedDate || 'Resolved' : 'Pending'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="my-reports-page" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Page Header */}
      <div className="hero-welcome-card" style={{ padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <IconFileText size={14} /> Moderation Lifecycle Tracking
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0 0 0.35rem 0' }}>
              My Submitted Reports
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '0.96rem', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              Track the verification, publication, and resolution progress of every safety hazard and place concern you have submitted.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchReports}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            >
              <IconRefresh size={14} /> Refresh
            </button>
            <Link to="/report" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconPlus size={15} /> Report New Concern
            </Link>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
          <div className="report-filter-tabs">
            <button
              type="button"
              className={`report-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Reports <span className="report-filter-count">{counts.total}</span>
            </button>
            <button
              type="button"
              className={`report-filter-pill ${activeFilter === 'under_review' ? 'active' : ''}`}
              onClick={() => setActiveFilter('under_review')}
            >
              Under Review <span className="report-filter-count">{counts.underReview}</span>
            </button>
            <button
              type="button"
              className={`report-filter-pill ${activeFilter === 'accepted' ? 'active' : ''}`}
              onClick={() => setActiveFilter('accepted')}
            >
              Accepted <span className="report-filter-count">{counts.accepted}</span>
            </button>
            <button
              type="button"
              className={`report-filter-pill ${activeFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('resolved')}
            >
              Resolved <span className="report-filter-count">{counts.resolved}</span>
            </button>
            {counts.rejected > 0 && (
              <button
                type="button"
                className={`report-filter-pill ${activeFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setActiveFilter('rejected')}
              >
                Rejected <span className="report-filter-count">{counts.rejected}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Loading your submitted reports..." />
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <p style={{ color: 'var(--hazard-high)', fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={fetchReports}>
            Try Again
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', backgroundColor: '#ffffff' }}>
          {reports.length === 0 ? (
            <EmptyState
              icon={<IconFileText size={42} color="var(--primary-blue)" />}
              title="No reports yet"
              message="Reports you submit will appear here so you can follow their progress through moderation to resolution."
              actionButton={
                <Link to="/report" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IconPlus size={16} /> Report a Safety Concern
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={<IconSearch size={40} color="var(--text-muted)" />}
              title="No reports in this category"
              message={`You do not have any reports currently matching the "${activeFilter.replace('_', ' ')}" filter.`}
              actionButton={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveFilter('all')}
                >
                  View All Reports ({reports.length})
                </button>
              }
            />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredReports.map((report) => {
            const isResolved = report.resolved === true || report.resolved === 1 || report.resolved === 'true';
            const submittedDate = formatDate(report.created_at);
            const resolvedDate = formatDate(report.resolved_at);

            return (
              <div key={report.id} className="report-tracking-card">
                
                {/* Header: ID, Badges, Title & Address */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: 'var(--primary-navy)',
                          backgroundColor: '#f1f5f9',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)'
                        }}
                      >
                        Report #{report.id}
                      </span>
                      {renderStatusBadge(report)}
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <IconClock size={13} /> Submitted {submittedDate || 'recently'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: '0.2rem 0 0 0', lineHeight: 1.25 }}>
                      {report.name}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-body)', fontSize: '0.92rem' }}>
                      <IconMapPin size={15} color="var(--primary-blue)" />
                      <span>{report.address}, {report.district}, {report.state}</span>
                    </div>
                  </div>

                  {/* Thumbnail if photo available */}
                  {report.photo && (
                    <div style={{ width: '70px', height: '70px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#f1f5f9', flexShrink: 0 }}>
                      <img
                        src={getPhotoUrl(report.photo)}
                        alt={report.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Visual Moderation Timeline */}
                <div style={{ padding: '0.5rem 0' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    Status Lifecycle
                  </div>
                  {renderTimeline(report)}
                </div>

                {/* Key Details Grid */}
                <div className="report-meta-grid">
                  <div className="report-meta-item">
                    <span className="report-meta-label">Initial Assessment</span>
                    <span className="report-meta-value">
                      {report.rating ? `${report.rating} / 5 ★` : '3 / 5 ★'}
                    </span>
                  </div>

                  <div className="report-meta-item">
                    <span className="report-meta-label">Community Rating</span>
                    <span className="report-meta-value">
                      {report.status === 'accepted' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <IconStar size={14} color="#d97706" filled />
                          {report.community_rating != null ? Number(report.community_rating).toFixed(1) : Number(report.rating || 3).toFixed(1)} / 5 ★
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            ({report.rating_count || 1})
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Awaiting publication</span>
                      )}
                    </span>
                  </div>

                  <div className="report-meta-item">
                    <span className="report-meta-label">Moderation Status</span>
                    <span className="report-meta-value">
                      {report.status === 'pending'
                        ? 'Awaiting Administrator Review'
                        : report.status === 'rejected'
                        ? 'Rejected by Moderation'
                        : isResolved
                        ? 'Verified & Resolved'
                        : 'Approved & Active in Directory'}
                    </span>
                  </div>

                  {isResolved && resolvedDate && (
                    <div className="report-meta-item">
                      <span className="report-meta-label">Resolved On</span>
                      <span className="report-meta-value" style={{ color: '#059669' }}>
                        {resolvedDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer / Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {report.status === 'pending' && (
                      <span>This report is under moderation and is currently only visible to you.</span>
                    )}
                    {report.status === 'rejected' && (
                      <span style={{ color: '#991b1b' }}>This report was not approved by moderators. Contact support for inquiries.</span>
                    )}
                    {report.status === 'accepted' && !isResolved && (
                      <span style={{ color: '#065f46' }}>Visible to all citizens in the Reported Places directory.</span>
                    )}
                    {isResolved && (
                      <span style={{ color: '#065f46' }}>This issue has been marked resolved and will remain visible for 7 days.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/places/${report.id}`, { state: { place: report } })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    View Report <IconArrowRight size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MyReportsPage;
