import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService, notificationService, safeWalkService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PlaceCard from '../../components/PlaceCard';
import SafetyMap from '../../components/SafetyMap';

const UserDashboard = () => {
  const { user } = useAuth();
  const [districtPlaces, setDistrictPlaces] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [districtCount, setDistrictCount] = useState(null);
  const [ratedPlacesCount, setRatedPlacesCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [activeWalk, setActiveWalk] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map & Location State
  const [userCoords, setUserCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState('');
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const userDistrict = user?.district || 'Ernakulam';
  const userState = user?.state || 'Kerala';

  // Initial Fetch for User District & Notifications & Active Safe Walk
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

        // Fetch active safe walk status
        const walkRes = await safeWalkService.getActiveSafeWalk();
        if (walkRes.success && walkRes.data) {
          setActiveWalk(walkRes.data);
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Fetch Nearby Places when user location or radius changes
  useEffect(() => {
    if (!userCoords) {
      setNearbyPlaces([]);
      return;
    }

    const fetchNearby = async () => {
      setLoadingNearby(true);
      try {
        const res = await placeService.getAcceptedPlaces({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          radiusKm
        });
        if (res.success && Array.isArray(res.data)) {
          setNearbyPlaces(res.data);
        }
      } catch (err) {
        console.warn('Nearby places fetch error:', err);
      } finally {
        setLoadingNearby(false);
      }
    };

    fetchNearby();
  }, [userCoords, radiusKm]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationStatusMsg('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));
        setUserCoords({ latitude: lat, longitude: lon });
        setLocationStatusMsg('Displaying reported places near your current coordinates.');
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationStatusMsg('Location access was not granted. You can still browse reported places by State and District.');
        } else {
          setLocationStatusMsg('Could not retrieve your location. You can browse reported places by State and District.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearLocation = () => {
    setUserCoords(null);
    setLocationStatusMsg('');
    setNearbyPlaces([]);
  };

  // Determine active display places for the dashboard map and list
  const activePlaces = userCoords ? nearbyPlaces : districtPlaces;
  const placesWithCoords = useMemo(() => {
    return activePlaces.filter((p) => p.latitude != null && p.longitude != null);
  }, [activePlaces]);

  if (loading) {
    return <LoadingSpinner message="Loading your safety dashboard..." />;
  }

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
              Your central hub for community safety intelligence, verified reports, and active safety updates in your locality.
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
          {/* Card 1: Verified Reported Places */}
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue" aria-hidden="true">
              📍
            </div>
            <div className="stat-info">
              <span className="stat-num">{districtCount !== null ? districtCount : 0}</span>
              <span className="stat-label">Reported Places in District</span>
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
          SECTION B.2: Dedicated Safe Walk Personal Journey Card
          ========================================================================= */}
      <section aria-label="Safe Walk Personal Safety" className="card" style={{ padding: '1.5rem', backgroundColor: activeWalk ? '#f0fdf4' : '#ffffff', border: activeWalk ? '1.5px solid #86efac' : '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', backgroundColor: activeWalk ? '#dcfce7' : '#eff6ff', color: activeWalk ? '#15803d' : 'var(--primary-blue)', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>🚶‍♀️</span> {activeWalk ? 'Active Journey in Progress' : 'Personal Journey Protection'}
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              {activeWalk ? 'Safe Walk Active 🟢' : 'Safe Walk'}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: '0.35rem 0 0', maxWidth: '620px', lineHeight: 1.5 }}>
              {activeWalk
                ? `Walking to ${activeWalk.destination} • Companion: ${activeWalk.companion_name || activeWalk.companion_email}`
                : 'Going somewhere? Start a Safe Walk and let a community companion know about your journey.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {activeWalk ? (
              <Link to="/safe-walk/active" className="btn btn-success" style={{ padding: '0.65rem 1.3rem', fontWeight: 700 }}>
                <span>🛡️</span> View Active Journey &rarr;
              </Link>
            ) : (
              <>
                <Link to="/safe-walk?tab=start" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                  <span>🚶‍♀️</span> Start Safe Walk
                </Link>
                <Link to="/safe-walk?tab=companions" className="btn btn-secondary" style={{ padding: '0.65rem 1.15rem' }}>
                  <span>👥</span> Manage Companions
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: Prominent Safety Map — "Reported Places Near You"
          ========================================================================= */}
      <section aria-label="Reported Places Near You Map" className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.55rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              <span>🗺️</span> Interactive Safety Discovery
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              Reported Places Near You
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              {userCoords
                ? `Showing reported concerns within ${radiusKm} km of your location. Click any marker to view details.`
                : `Showing reported places in ${userDistrict}. Click "Use My Location" to discover concerns nearest to you.`}
            </p>
          </div>

          {/* Location Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {!userCoords ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUseMyLocation}
                disabled={locating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <span>📍</span> {locating ? 'Detecting Location...' : 'Use My Location'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span>✓</span> Location Active
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearLocation}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                >
                  Reset
                </button>
              </div>
            )}

            {/* Radius Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
              <label htmlFor="dashboard-radius" style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                Radius:
              </label>
              <select
                id="dashboard-radius"
                className="form-control"
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                value={radiusKm}
                disabled={!userCoords}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              >
                <option value="1">1 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Status Message / Fallback */}
        {locationStatusMsg && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.6rem 0.9rem',
            backgroundColor: userCoords ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${userCoords ? '#a7f3d0' : '#fde68a'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            color: userCoords ? '#065f46' : '#92400e',
            fontWeight: 500
          }}>
            {locationStatusMsg}
          </div>
        )}

        {/* The Map Component */}
        {loadingNearby ? (
          <LoadingSpinner message="Locating nearby reported places..." />
        ) : (
          <div>
            <SafetyMap
              places={activePlaces}
              userLocation={userCoords}
              radiusKm={userCoords ? radiusKm : null}
              selectedPlaceId={selectedPlaceId}
              mapHeight="400px"
              showDetailsButton={true}
              onMarkerClick={(p) => setSelectedPlaceId(p.id)}
            />

            {/* Map Legend / Caption */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                  Active Reported Place
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                  Resolved Issue
                </span>
                {userCoords && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block' }}></span>
                    Your Location
                  </span>
                )}
              </div>

              <span>
                {placesWithCoords.length} plotted on map
              </span>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION D: Nearby / Recent Reported Places
          ========================================================================= */}
      <section aria-label="Nearby Reported Places List">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
              {userCoords ? `🛡️ Reported Places within ${radiusKm} km` : `🛡️ Recent Reported Places in ${userDistrict}`}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              {userCoords
                ? `Discovered ${nearbyPlaces.length} safety report${nearbyPlaces.length === 1 ? '' : 's'} near your coordinates`
                : `Latest reviewed safety reports in your registered district`}
            </p>
          </div>
          {activePlaces.length > 0 && (
            <Link to="/places" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-blue)', textDecoration: 'none' }}>
              Browse All Places ({activePlaces.length}) &rarr;
            </Link>
          )}
        </div>

        {activePlaces.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h4 style={{ color: 'var(--primary-navy)', marginBottom: '0.35rem', fontWeight: 700 }}>
              {userCoords ? `No Reported Places within ${radiusKm} km` : `No Active Reports in ${userDistrict}`}
            </h4>
            <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              {userCoords
                ? `No reported safety concerns were found within ${radiusKm} km of your location. You can expand the radius or report an issue.`
                : `There are currently no reported places in your district. If you notice a safety concern, you can report it to help others.`}
            </p>
            <Link to="/report" className="btn btn-primary btn-sm">
              <span>➕</span> Report a Safety Concern
            </Link>
          </div>
        ) : (
          <div className="grid-cards">
            {activePlaces.slice(0, 3).map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                showViewDetails={true}
                onRatingSuccess={(placeId, updatedData) => {
                  setDistrictPlaces((prev) =>
                    prev.map((p) => (p.id === placeId ? { ...p, ...updatedData } : p))
                  );
                  setNearbyPlaces((prev) =>
                    prev.map((p) => (p.id === placeId ? { ...p, ...updatedData } : p))
                  );
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION E: Main Action Cards
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

          {/* Action 2: Browse Reported Places */}
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0284c7' }}>
                🛡️
              </div>
              <div>
                <h3 className="action-card-title">Browse Reported Places</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Explore verified reported areas across districts, inspect severity levels, filter by keywords, and contribute safety ratings.
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
          SECTION F: Community Safety Rating Model Explanation
          ========================================================================= */}
      <section className="community-safety-banner" aria-label="About Community Safety Ratings">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              <span>⭐</span> Understanding Community Safety Ratings
            </h3>
            <p style={{ margin: 0, color: 'var(--text-body)' }}>
              Safety ratings on our portal are democratically calculated from verified ratings submitted by real community members. Instead of relying on a single assessment, every location's safety score reflects collective feedback on a scale from <strong>1★ (Minor Concern)</strong> to <strong>5★ (Severe Concern)</strong>.
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

    </div>
  );
};

export default UserDashboard;

