import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import {
  IconAlertTriangle,
  IconAlertOctagon,
  IconWalker,
  IconCheckCircle,
  IconAlertCircle,
  IconInfo,
  IconBell
} from '../../components/Icons';

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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'safe_walk_sos':
        return <IconAlertOctagon size={18} color="#dc2626" />;
      case 'safe_walk_overdue':
        return <IconAlertTriangle size={18} color="#b45309" />;
      case 'safe_walk_started':
        return <IconWalker size={18} color="#0284c7" />;
      case 'safe_walk_completed':
        return <IconCheckCircle size={18} color="#059669" />;
      case 'safe_walk_cancelled':
        return <IconAlertCircle size={18} color="#dc2626" />;
      case 'report_accepted':
        return <IconCheckCircle size={18} color="#059669" />;
      case 'report_rejected':
        return <IconAlertCircle size={18} color="#dc2626" />;
      default:
        return <IconInfo size={18} color="#64748b" />;
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">My Notifications</h1>
        <p className="page-subtitle">
          Real-time safety alerts, Safe Walk updates, and review decisions on your submitted reported places.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Loading your notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<IconBell size={36} color="var(--primary-blue)" />}
          title="No Notifications Yet"
          message="When new safety alerts, Safe Walk updates, or report review decisions occur, they will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif) => {
            const isUnread = notif.is_read === 0;
            const isSos = notif.type === 'safe_walk_sos';
            const isOverdue = notif.type === 'safe_walk_overdue';
            const isAccepted = notif.type === 'report_accepted';
            const isSafeWalk = notif.type && notif.type.startsWith('safe_walk');

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
                    ? isSos
                      ? '4px solid #dc2626'
                      : isOverdue
                        ? '4px solid #f59e0b'
                        : isAccepted
                          ? '4px solid var(--hazard-low)'
                          : '4px solid var(--primary-blue)'
                    : '1px solid var(--border-light)',
                  backgroundColor: isUnread ? (isSos ? '#fef2f2' : isOverdue ? '#fffbeb' : '#f8fafc') : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {getNotificationIcon(notif.type)}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isSos ? '#991b1b' : isOverdue ? '#92400e' : 'var(--primary-navy)', margin: 0 }}>
                      {notif.title}
                    </h3>
                    {isUnread && (
                      <span className={`badge ${isSos ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem', backgroundColor: isSos ? '#dc2626' : undefined, color: isSos ? '#ffffff' : undefined }}>
                        {isSos ? 'SOS Alert' : 'New'}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formattedDate}
                  </span>
                </div>

                <p style={{ margin: '0.75rem 0 0.75rem', fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                  {notif.message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {isSafeWalk && (
                    <Link
                      to="/active-safe-walk"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
                    >
                      View Safe Walk
                    </Link>
                  )}

                  {isUnread && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={actionLoadingId === notif.id}
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
                    >
                      {actionLoadingId === notif.id ? 'Updating...' : 'Mark as Read'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;


