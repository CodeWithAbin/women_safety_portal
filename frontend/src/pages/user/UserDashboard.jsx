import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService, notificationService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PlaceCard from '../../components/PlaceCard';

const UserDashboard = () => {
  const { user } = useAuth();
  const [districtPlaces, setDistrictPlaces] = useState([]);
  const [districtCount, setDistrictCount] = useState(null);
  const [ratedPlacesCount, setRatedPlacesCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch accepted places for user's home district
        const placesRes = await placeService.getAcceptedPlaces(user.state, user.district);
        if (placesRes.success && Array.isArray(placesRes.data)) {
          setDistrictPlaces(placesRes.data);
          setDistrictCount(placesRes.count !== undefined ? placesRes.count : placesRes.data.length);
          
          // Calculate count of places with active community ratings
          const ratedCount = placesRes.data.filter(
            (p) => (p.rating_count && Number(p.rating_count) > 0) || (p.community_rating != null && Number(p.community_rating) > 0)
          ).length;
          setRatedPlacesCount(ratedCount);
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
    return <LoadingSpinner message="Loading your safety dashboard..." />;
  }

  const userDistrict = user?.district || 'Ernakulam';
  const userState = user?.state || 'Kerala';

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* =========================================================================
          SECTION A: Welcome Section
          ========================================================================= */}
      <section className="hero-welcome-card" aria-label="Dashboard Welcome">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              <span>🛡️</span> Community Safety Portal
            </div>
            <h1 className="page-title" style={{ marginBottom: '0.4rem', fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome back, {user?.name || 'Citizen'}! 👋
            </h1>
            <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', maxWidth: '640px', lineHeight: 1.5 }}>
              Your central hub for community safety intelligence, verified reports, and active hazard updates in your locality.
            </p>
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span>📍 Registered Home Area:</span>
              <strong style={{ color: 'var(--primary-navy)', fontWeight: 700 }}>
                {userDistrict}, {userState}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/report" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}>
              <span>➕</span> Report Safety Concern
            </Link>
          </div>
        </div>

        {unreadNotifs > 0 && (
          <div style={{
            marginTop: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: 'var(--hazard-medium-bg)',
            border: '1px solid var(--hazard-medium-border)',
            color: '#92400e',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <span>🔔</span> You have <strong>{unreadNotifs} unread notification{unreadNotifs > 1 ? 's' : ''}</strong> on your reported places.{' '}
            <Link to="/notifications" style={{ color: '#92400e', textDecoration: 'underline', fontWeight: 700, marginLeft: '0.25rem' }}>
              View Notifications &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION B: Location & Safety Overview (Compact Stat Cards)
          ========================================================================= */}
      <section aria-label="Safety Overview Statistics">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              📍 Local Safety Overview
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Real-time community metrics for {userDistrict}, {userState}
            </p>
          </div>
          <Link to="/places" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
            View Full District Directory &rarr;
          </Link>
        </div>

        <div className="stat-grid">
          {/* Card 1: Verified Hazards in District */}
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue" aria-hidden="true">
              ⚠️
            </div>
            <div className="stat-info">
              <span className="stat-num">{districtCount !== null ? districtCount : 0}</span>
              <span className="stat-label">Places Reported in District</span>
            </div>
          </div>

          {/* Card 2: Community-Rated Places */}
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-amber" aria-hidden="true">
              ⭐
            </div>
            <div className="stat-info">
              <span className="stat-num">{ratedPlacesCount}</span>
              <span className="stat-label">Community-Rated Places</span>
            </div>
          </div>

          {/* Card 3: Unread Notifications */}
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-emerald" aria-hidden="true">
              🔔
            </div>
            <div className="stat-info">
              <span className="stat-num">{unreadNotifs}</span>
              <span className="stat-label">Unread Notifications</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: Main Action Cards
          ========================================================================= */}
      <section aria-label="Quick Actions">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
            🚀 Essential Safety Actions
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Choose an action to contribute to community safety or check reported locations
          </p>
        </div>

        <div className="action-grid">
          {/* Action 1: Report Safety Concern */}
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                🚨
              </div>
              <div>
                <h3 className="action-card-title">Report a Safety Concern</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Encountered poorly lit streets, broken infrastructure, or suspicious spots? Submit a report with photos to warn fellow citizens.
            </p>
            <Link to="/report" className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
              <span>➕</span> Report a New Concern
            </Link>
          </div>

          {/* Action 2: Browse Safe Places */}
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0284c7' }}>
                🛡️
              </div>
              <div>
                <h3 className="action-card-title">Browse Safe Places</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Explore verified hazardous areas across districts, inspect severity levels, filter by keywords, and contribute safety ratings.
            </p>
            <Link to="/places" className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%', borderColor: 'var(--primary-blue-border)', color: 'var(--primary-blue)' }}>
              <span>🔍</span> Explore Places Directory
            </Link>
          </div>

          {/* Action 3: View Notifications */}
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#d97706' }}>
                🔔
              </div>
              <div>
                <h3 className="action-card-title">View Notifications</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Stay up-to-date on review approvals, status updates for your submitted safety reports, and community verification notices.
            </p>
            <Link to="/notifications" className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>
              <span>📬</span> Check Updates ({unreadNotifs})
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION D: Community Safety Rating Section
          ========================================================================= */}
      <section className="community-safety-banner" aria-label="About Community Safety Ratings">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              <span>⭐</span> Understanding Community Safety Ratings
            </h3>
            <p style={{ margin: 0, color: 'var(--text-body)' }}>
              Safety ratings on our portal are democratically calculated from verified ratings submitted by real community members. Instead of relying on a single assessment, every location's safety score reflects collective feedback on a scale from <strong>1★ (Low Hazard)</strong> to <strong>5★ (Severe Hazard)</strong>.
            </p>
          </div>

          {/* Visual Rating Example Badge Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.4rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            minWidth: '220px',
            alignSelf: 'center'
          }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Live System Rating Model
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>4.2</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 5</span>
              <span style={{ fontSize: '1.25rem', marginLeft: '0.15rem' }}>⭐</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Based on 18 community ratings
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION E: Recent Verified Hazards in District
          ========================================================================= */}
      <section aria-label="Recent Local Hazards">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              🛡️ Recent Verified Hazards in {userDistrict}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Latest reviewed safety reports in your registered district
            </p>
          </div>
          {districtPlaces.length > 0 && (
            <Link to="/places" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-blue)', textDecoration: 'none' }}>
              Browse All Places ({districtPlaces.length}) &rarr;
            </Link>
          )}
        </div>

        {districtPlaces.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h4 style={{ color: 'var(--primary-navy)', marginBottom: '0.35rem', fontWeight: 700 }}>No Active Hazards in {userDistrict}</h4>
            <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              There are currently no verified hazardous places reported in your district. If you notice an unsafe location, you can be the first to report it.
            </p>
            <Link to="/report" className="btn btn-primary btn-sm">
              <span>➕</span> Report a Concern in {userDistrict}
            </Link>
          </div>
        ) : (
          <div className="grid-cards">
            {districtPlaces.slice(0, 3).map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onRatingSuccess={(placeId, updatedData) => {
                  setDistrictPlaces((prev) =>
                    prev.map((p) => (p.id === placeId ? { ...p, ...updatedData } : p))
                  );
                }}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default UserDashboard;

