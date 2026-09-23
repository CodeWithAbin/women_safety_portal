import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    pendingReports: 0,
    acceptedPlaces: 0,
    registeredUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        // Derive counts from existing 16 endpoints in parallel
        const [reportsRes, placesRes, usersRes] = await Promise.all([
          adminService.getPendingReports('pending'),
          adminService.getPlaces(),
          adminService.getUsers()
        ]);

        setMetrics({
          pendingReports: reportsRes.count || (reportsRes.data ? reportsRes.data.length : 0),
          acceptedPlaces: placesRes.count || (placesRes.data ? placesRes.data.length : 0),
          registeredUsers: usersRes.count || (usersRes.data ? usersRes.data.length : 0)
        });
      } catch (err) {
        setError('Failed to fetch administrative summary metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading administrator overview..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Administrator Dashboard</h1>
        <p className="page-subtitle">
          Overview of moderation queues, verified hazardous locations, and registered citizens.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Pending Reports Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--safety-warning)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  PENDING REPORTS
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--safety-warning)', marginTop: '0.25rem' }}>
                  {metrics.pendingReports}
                </div>
              </div>
              <div style={{ fontSize: '2rem' }}>⏳</div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/admin/reports" className="btn btn-secondary btn-sm btn-block">
                Review Pending Queue &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Accepted Places Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ACCEPTED PLACES
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '0.25rem' }}>
                  {metrics.acceptedPlaces}
                </div>
              </div>
              <div style={{ fontSize: '2rem' }}>📍</div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/admin/places" className="btn btn-secondary btn-sm btn-block">
                Manage Places &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Registered Users Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--safety-success)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  REGISTERED USERS
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--safety-success)', marginTop: '0.25rem' }}>
                  {metrics.registeredUsers}
                </div>
              </div>
              <div style={{ fontSize: '2rem' }}>👥</div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/admin/users" className="btn btn-secondary btn-sm btn-block">
                Manage Users &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
            Administrative Actions
          </h2>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/reports" className="btn btn-primary" style={{ padding: '1rem' }}>
            <span>📝</span> Review Pending Reports ({metrics.pendingReports})
          </Link>
          <Link to="/admin/places" className="btn btn-secondary" style={{ padding: '1rem' }}>
            <span>➕</span> Add / Manage Hazardous Places
          </Link>
          <Link to="/admin/users" className="btn btn-secondary" style={{ padding: '1rem' }}>
            <span>👥</span> View Registered Citizens
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
