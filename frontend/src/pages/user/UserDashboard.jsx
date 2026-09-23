import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService, notificationService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const UserDashboard = () => {
  const { user } = useAuth();
  const [districtCount, setDistrictCount] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch accepted places count for user's home district
        const placesRes = await placeService.getAcceptedPlaces(user.state, user.district);
        if (placesRes.success) {
          setDistrictCount(placesRes.count);
        }

        // Fetch unread notifications count
        const notifsRes = await notificationService.getNotifications();
        if (notifsRes.success) {
          setUnreadNotifs(notifsRes.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(to right, #ffffff, #f0f9ff)', borderColor: '#bae6fd' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
          Welcome back, {user?.name}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Registered Location: <strong>{user?.district}, {user?.state}</strong>
        </p>
        {unreadNotifs > 0 && (
          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', backgroundColor: 'var(--safety-warning-light)', color: '#92400e', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>🔔</span> You have {unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}.{' '}
            <Link to="/notifications" style={{ color: '#92400e', textDecoration: 'underline' }}>
              View Notifications
            </Link>
          </div>
        )}
      </div>

      {/* Summary & Action Cards */}
      <div className="grid-2col">
        {/* District Safety Overview */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              📍 Local Area Status ({user?.district})
            </h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {districtCount !== null ? districtCount : '—'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>Accepted Hazardous Places</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified safety hazards in your district</div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Stay alert when traveling through reported hazardous or unlit areas in your neighborhood.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <Link to="/places" className="btn btn-primary btn-block">
                Browse Places in My District
              </Link>
            </div>
          </div>
        </div>

        {/* Report Hazard Action */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
              🚨 Report Unsafe Area
            </h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Encountered a poorly lit street, broken infrastructure, or unsafe public location?
              Submit a report with a photo so it can be verified and highlighted for community safety.
            </p>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Provide accurate street address and landmark</li>
              <li>Attach a clear photo of the hazard</li>
              <li>Reports are reviewed by administrators before publishing</li>
            </ul>
            <div style={{ marginTop: 'auto' }}>
              <Link to="/report" className="btn btn-secondary btn-block" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)' }}>
                + Report a Place Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
