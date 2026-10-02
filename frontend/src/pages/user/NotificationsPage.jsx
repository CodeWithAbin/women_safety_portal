import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update notification.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">My Notifications</h1>
        <p className="page-subtitle">
          Real-time updates and administrative review decisions on your submitted hazardous places.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Loading your notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No Notifications Yet"
          message="When an administrator reviews your submitted hazardous place reports or new safety updates occur, they will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => {
            const isUnread = notif.is_read === 0;
            const isAccepted = notif.type === 'report_accepted';

            const formattedDate = new Date(notif.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <article
                key={notif.id}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: isUnread
                    ? isAccepted
                      ? '4px solid var(--hazard-low)'
                      : '4px solid var(--primary-blue)'
                    : '1px solid var(--border-light)',
                  backgroundColor: isUnread ? '#f8fafc' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>
                      {isAccepted ? '✅' : 'ℹ️'}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                      {notif.title}
                    </h3>
                    {isUnread && (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        New
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formattedDate}
                  </span>
                </div>

                <p style={{ margin: '0.75rem 0 0.5rem', fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  {notif.message}
                </p>

                {isUnread && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={actionLoadingId === notif.id}
                    >
                      {actionLoadingId === notif.id ? 'Updating...' : 'Mark as Read'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

