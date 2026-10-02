import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import ReportReviewCard from '../../components/ReportReviewCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

const ManageReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPendingReports('pending');
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch pending reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
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
            ? 'Report successfully verified and published to the public hazardous places directory.'
            : 'Report successfully rejected and archived.'
        );
        // Remove processed report from list
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update report status.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="manage-reports-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span>⏳</span> Moderation Queue
          </div>
          <h1 className="page-title">Review Citizen Safety Reports</h1>
          <p className="page-subtitle">
            Verify evidence photos, problem statements, and location details to publish active hazards or reject invalid submissions.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchReports}
          disabled={loading}
          style={{ fontSize: '0.85rem' }}
        >
          <span>↺</span> Refresh Queue
        </button>
      </div>

      {feedback && <AlertBanner type="success" message={feedback} onDismiss={() => setFeedback('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Fetching pending reports moderation queue..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All Reports Reviewed"
          message="There are currently no pending citizen submissions in the moderation queue."
        />
      ) : (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-body)'
          }}>
            <div>
              <strong>{reports.length}</strong> report{reports.length > 1 ? 's' : ''} awaiting review
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Approving a report publishes it immediately to the public directory
            </span>
          </div>

          <div>
            {reports.map((report) => (
              <ReportReviewCard
                key={report.id}
                report={report}
                onAccept={(id) => handleStatusChange(id, 'accepted')}
                onReject={(id) => handleStatusChange(id, 'rejected')}
                processingId={processingId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReportsPage;

