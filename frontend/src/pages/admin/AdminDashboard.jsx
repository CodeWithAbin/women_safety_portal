import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import ReportReviewCard from '../../components/ReportReviewCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    pendingReports: 0,
    acceptedPlaces: 0,
    registeredUsers: 0
  });
  const [pendingReportsList, setPendingReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchAdminData = async () => {
    try {
      const [reportsRes, placesRes, usersRes] = await Promise.all([
        adminService.getPendingReports('pending'),
        adminService.getPlaces(),
        adminService.getUsers()
      ]);

      const pendingList = reportsRes.data || [];
      setPendingReportsList(pendingList);

      setMetrics({
        pendingReports: reportsRes.count !== undefined ? reportsRes.count : pendingList.length,
        acceptedPlaces: placesRes.count !== undefined ? placesRes.count : (placesRes.data ? placesRes.data.length : 0),
        registeredUsers: usersRes.count !== undefined ? usersRes.count : (usersRes.data ? usersRes.data.length : 0)
      });
    } catch (err) {
      setError('Failed to fetch administrative summary metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (reportId, newStatus) => {
    setProcessingId(reportId);
    setError('');
    setFeedback('');

    try {
      const res = await adminService.updateReportStatus(reportId, newStatus);
      if (res.success) {
        setFeedback(
          newStatus === 'accepted'
            ? 'Report verified and published as an active hazard.'
            : 'Report rejected and archived.'
        );
        // Remove processed report from pending list and decrement count
        setPendingReportsList((prev) => prev.filter((r) => r.id !== reportId));
        setMetrics((prev) => ({
          ...prev,
          pendingReports: Math.max(0, prev.pendingReports - 1),
          acceptedPlaces: newStatus === 'accepted' ? prev.acceptedPlaces + 1 : prev.acceptedPlaces
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update report status.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administrator control center..." />;
  }

  return (
    <div className="admin-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <span>🛡️</span> Moderation & Control Center
        </div>
        <h1 className="page-title">Administrator Dashboard</h1>
        <p className="page-subtitle">
          Review reported safety concerns, moderate community submissions, and manage verified reported locations.
        </p>
      </div>

      {feedback && <AlertBanner type="success" message={feedback} onDismiss={() => setFeedback('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* =========================================================================
          1. Overview Metric Cards
          ========================================================================= */}
      <section aria-label="Administrative Key Metrics">
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          
          {/* Card 1: Pending Reports */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--hazard-medium)' }}>
            <div className="stat-icon-wrap stat-icon-amber" aria-hidden="true">
              ⏳
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-num" style={{ color: '#92400e' }}>{metrics.pendingReports}</span>
              <span className="stat-label">Pending Review Queue</span>
            </div>
            <Link to="/admin/reports" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
              Review &rarr;
            </Link>
          </div>

          {/* Card 2: Accepted Places */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
            <div className="stat-icon-wrap stat-icon-blue" aria-hidden="true">
              📍
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-num" style={{ color: 'var(--primary-navy)' }}>{metrics.acceptedPlaces}</span>
              <span className="stat-label">Reported Places</span>
            </div>
            <Link to="/admin/places" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
              Manage &rarr;
            </Link>
          </div>

          {/* Card 3: Registered Citizens */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--hazard-low)' }}>
            <div className="stat-icon-wrap stat-icon-emerald" aria-hidden="true">
              👥
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-num" style={{ color: '#065f46' }}>{metrics.registeredUsers}</span>
              <span className="stat-label">Registered Citizens</span>
            </div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
              Directory &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. Moderation Queue (Primary Focus)
          ========================================================================= */}
      <section aria-label="Moderation Queue">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📝</span> Reports Awaiting Review
              {metrics.pendingReports > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                  {metrics.pendingReports} Pending
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Verify evidence, check community context, and approve or reject submissions
            </p>
          </div>

          {metrics.pendingReports > 0 && (
            <Link to="/admin/reports" className="btn btn-primary btn-sm">
              Open Full Queue ({metrics.pendingReports}) &rarr;
            </Link>
          )}
        </div>

        {pendingReportsList.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
              Moderation Queue is Clean
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              All submitted hazard reports have been reviewed. New citizen submissions will appear here as they are submitted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/admin/places" className="btn btn-secondary btn-sm">
                Manage Published Places
              </Link>
              <Link to="/admin/users" className="btn btn-secondary btn-sm">
                View Citizen Directory
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {pendingReportsList.slice(0, 3).map((report) => (
              <ReportReviewCard
                key={report.id}
                report={report}
                onAccept={(id) => handleStatusChange(id, 'accepted')}
                onReject={(id) => handleStatusChange(id, 'rejected')}
                processingId={processingId}
              />
            ))}

            {pendingReportsList.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/admin/reports" className="btn btn-secondary btn-block" style={{ padding: '0.75rem' }}>
                  View Remaining {pendingReportsList.length - 3} Pending Report{pendingReportsList.length - 3 > 1 ? 's' : ''} &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          3. Quick Action Hub
          ========================================================================= */}
      <section aria-label="Administrative Quick Actions">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
            ⚡ Operational Controls
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
            Quick administrative navigation to directories and management tools
          </p>
        </div>

        <div className="action-grid">
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#d97706' }}>
                📝
              </div>
              <div>
                <h3 className="action-card-title">Moderation Queue</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Examine photos, problem statements, and initial severity ratings submitted by citizens.
            </p>
            <Link to="/admin/reports" className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
              Review Reports ({metrics.pendingReports})
            </Link>
          </div>

          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0284c7' }}>
                📍
              </div>
              <div>
                <h3 className="action-card-title">Manage Places</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Add new reported locations, modify descriptions/ratings, or remove resolved reports.
            </p>
            <Link to="/admin/places" className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>
              Manage Places ({metrics.acceptedPlaces})
            </Link>
          </div>

          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#d1fae5', borderColor: '#a7f3d0', color: '#059669' }}>
                👥
              </div>
              <div>
                <h3 className="action-card-title">Citizen Directory</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Filter registered users by location, inspect account information, and update user records.
            </p>
            <Link to="/admin/users" className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>
              Citizen Directory ({metrics.registeredUsers})
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;

