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
    try {
      const res = await adminService.getPendingReports('pending');
      if (res.success) {
        setReports(res.data);
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
            ? 'Report successfully accepted and published as a hazardous place.'
            : 'Report successfully rejected.'
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
    <div>
      <div className="page-header">
        <h1 className="page-title">Review Pending Reports</h1>
        <p className="page-subtitle">
          Verify and approve or reject hazardous place submissions made by citizens.
        </p>
      </div>

      {feedback && <AlertBanner type="success" message={feedback} onDismiss={() => setFeedback('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Fetching pending reports queue..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All Reports Reviewed"
          message="There are no pending user submissions in the moderation queue."
        />
      ) : (
        <div>
          <div style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <strong>{reports.length}</strong> report{reports.length > 1 ? 's' : ''} awaiting administrative review:
          </div>

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
      )}
    </div>
  );
};

export default ManageReportsPage;
