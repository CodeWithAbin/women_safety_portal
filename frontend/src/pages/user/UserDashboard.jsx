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
      {/* Welcome Hero Banner */}
      <div className="card" style={{ padding: '2rem 2.25rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)', borderColor: '#bae6fd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Registered Home Area: <strong style={{ color: 'var(--primary-navy)' }}>📍 {user?.district}, {user?.state}</strong>
            </p>
          </div>

          <Link to="/report" className="btn btn-primary" style={{ padding: '0.7rem 1.25rem' }}>
            <span>➕</span> Report Unsafe Place
          </Link>
        </div>

        {unreadNotifs > 0 && (
          <div style={{
            marginTop: '1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--hazard-medium-bg)',
            border: '1px solid var(--hazard-medium-border)',
            color: '#92400e',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <span>🔔</span> You have {unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}.{' '}
            <Link to="/notifications" style={{ color: '#92400e', textDecoration: 'underline', fontWeight: 700 }}>
              View Updates &rarr;
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
              📍 Local Safety Status ({user?.district})
            </h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--primary-blue)', lineHeight: 1 }}>
                {districtCount !== null ? districtCount : '—'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '1.05rem' }}>Verified Hazardous Places</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Active community-reported hazards in your district</div>
              </div>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Stay cautious when traveling through dark alleys, broken street light areas, or reported unsafe streets in your locality.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <Link to="/places" className="btn btn-primary btn-block">
                Browse Places in My District &rarr;
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
            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
              Encountered a poorly lit street, broken infrastructure, or suspicious area?
              Submit a report with an image to help protect other women and citizens in your community.
            </p>
            <ul style={{ fontSize: '0.88rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Provide accurate landmark and street address</li>
              <li>Attach a clear photo of the hazard</li>
              <li>Community members can rate and verify the location</li>
            </ul>
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <Link to="/report" className="btn btn-secondary btn-block">
                + Report a New Hazard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

