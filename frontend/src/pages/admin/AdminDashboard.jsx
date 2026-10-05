import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService, safePlaceService } from '../../services/api';
import ReportReviewCard from '../../components/ReportReviewCard';
import SafetyMap from '../../components/SafetyMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertBanner from '../../components/AlertBanner';
import {
  IconShield,
  IconShieldCheck,
  IconClock,
  IconMapPin,
  IconMap,
  IconUsers,
  IconFileText,
  IconCheckCircle,
  IconSliders,
  IconSearch,
  IconX,
  IconInfo,
  IconPhone
} from '../../components/Icons';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    pendingReports: 0,
    acceptedPlaces: 0,
    registeredUsers: 0,
    pendingSafePlaces: 0,
    acceptedSafePlaces: 0
  });
  const [pendingReportsList, setPendingReportsList] = useState([]);
  const [publishedPlacesList, setPublishedPlacesList] = useState([]);
  const [mapStatusFilter, setMapStatusFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'resolved'
  const [mapSearch, setMapSearch] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchAdminData = async () => {
    try {
      const [reportsRes, placesRes, usersRes, safePlacesSummaryRes] = await Promise.all([
        adminService.getPendingReports('pending'),
        adminService.getPlaces(),
        adminService.getUsers(),
        safePlaceService.getAdminSummary().catch(() => ({ success: false, data: {} }))
      ]);

      const pendingList = reportsRes.data || [];
      const placesList = placesRes.data || [];
      setPendingReportsList(pendingList);
      setPublishedPlacesList(placesList);

      setMetrics({
        pendingReports: reportsRes.count !== undefined ? reportsRes.count : pendingList.length,
        acceptedPlaces: placesRes.count !== undefined ? placesRes.count : placesList.length,
        registeredUsers: usersRes.count !== undefined ? usersRes.count : (usersRes.data ? usersRes.data.length : 0),
        pendingSafePlaces: safePlacesSummaryRes.data?.pending || 0,
        acceptedSafePlaces: safePlacesSummaryRes.data?.accepted || 0
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
        const processedReport = pendingReportsList.find((r) => r.id === reportId);
        // Remove processed report from pending list and decrement count
        setPendingReportsList((prev) => prev.filter((r) => r.id !== reportId));
        if (newStatus === 'accepted' && processedReport) {
          setPublishedPlacesList((prev) => [{ ...processedReport, status: 'accepted' }, ...prev]);
        }
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

  // Combine pending and published places for admin spatial awareness
  const allAdminPlaces = useMemo(() => {
    const pending = (pendingReportsList || []).map((r) => ({ ...r, status: 'pending' }));
    const published = (publishedPlacesList || []).map((p) => ({ ...p, status: 'accepted' }));
    return [...pending, ...published];
  }, [pendingReportsList, publishedPlacesList]);

  // Statistics calculation for the map summary
  const mapStats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let resolved = 0;
    let withCoords = 0;
    let withoutCoords = 0;

    allAdminPlaces.forEach((p) => {
      const hasCoords = p.latitude != null && p.longitude != null && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude));
      const isRes = p.resolved === true || p.resolved === 1 || p.resolved === 'true';

      if (hasCoords) {
        withCoords += 1;
        if (p.status === 'pending') {
          pending += 1;
        } else if (isRes) {
          resolved += 1;
        } else {
          accepted += 1;
        }
      } else {
        withoutCoords += 1;
      }
    });

    return { pending, accepted, resolved, withCoords, withoutCoords, total: allAdminPlaces.length };
  }, [allAdminPlaces]);

  // Filtered places for map plotting
  const filteredMapPlaces = useMemo(() => {
    return allAdminPlaces.filter((p) => {
      const isRes = p.resolved === true || p.resolved === 1 || p.resolved === 'true';

      // Status filter
      if (mapStatusFilter === 'pending' && p.status !== 'pending') return false;
      if (mapStatusFilter === 'accepted' && (p.status !== 'accepted' || isRes)) return false;
      if (mapStatusFilter === 'resolved' && !isRes) return false;

      // Search filter
      if (mapSearch.trim()) {
        const query = mapSearch.trim().toLowerCase();
        const matchName = p.name && p.name.toLowerCase().includes(query);
        const matchAddress = p.address && p.address.toLowerCase().includes(query);
        const matchDistrict = p.district && p.district.toLowerCase().includes(query);
        const matchState = p.state && p.state.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchDistrict && !matchState) return false;
      }

      return true;
    });
  }, [allAdminPlaces, mapStatusFilter, mapSearch]);

  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return allAdminPlaces.find((p) => p.id === selectedPlaceId) || null;
  }, [allAdminPlaces, selectedPlaceId]);

  if (loading) {
    return <LoadingSpinner message="Loading administrator control center..." />;
  }

  return (
    <div className="admin-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <IconShield size={14} /> Moderation & Control Center
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
              <IconClock size={22} color="#d97706" />
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
              <IconMapPin size={22} color="var(--primary-blue)" />
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
              <IconUsers size={22} color="#059669" />
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-num" style={{ color: '#065f46' }}>{metrics.registeredUsers}</span>
              <span className="stat-label">Registered Citizens</span>
            </div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
              Directory &rarr;
            </Link>
          </div>

          {/* Card 4: Safe Places */}
          <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
            <div className="stat-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }} aria-hidden="true">
              <IconShieldCheck size={22} color="#059669" />
            </div>
            <div className="stat-info" style={{ flex: 1 }}>
              <span className="stat-num" style={{ color: '#065f46' }}>
                {metrics.pendingSafePlaces > 0 ? `${metrics.pendingSafePlaces} New` : `${metrics.acceptedSafePlaces} Active`}
              </span>
              <span className="stat-label">Manage Safe Places</span>
            </div>
            <Link to="/admin/safe-places" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
              Moderate &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. Reported Places Map (Command Center)
          ========================================================================= */}
      <section aria-label="Reported Places Map" className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)' }}>
        
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconMapPin size={18} color="var(--primary-blue)" /> Reported Places Map
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              View reported safety concerns across the selected area.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-info" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconMapPin size={12} /> {mapStats.withCoords} reported places on map
            </span>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status:
            </span>
            <button
              type="button"
              onClick={() => setMapStatusFilter('all')}
              className={`btn btn-sm ${mapStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              All ({mapStats.withCoords})
            </button>
            <button
              type="button"
              onClick={() => setMapStatusFilter('pending')}
              className={`btn btn-sm ${mapStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Pending ({mapStats.pending})
            </button>
            <button
              type="button"
              onClick={() => setMapStatusFilter('accepted')}
              className={`btn btn-sm ${mapStatusFilter === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Accepted ({mapStats.accepted})
            </button>
            <button
              type="button"
              onClick={() => setMapStatusFilter('resolved')}
              className={`btn btn-sm ${mapStatusFilter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Resolved ({mapStats.resolved})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1 1 240px', maxWidth: '340px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </div>
              <input
                type="text"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search map places..."
                className="form-control"
                style={{
                  paddingLeft: '2rem',
                  paddingRight: mapSearch ? '2rem' : '0.75rem',
                  paddingTop: '0.35rem',
                  paddingBottom: '0.35rem',
                  fontSize: '0.84rem',
                  height: '34px'
                }}
              />
              {mapSearch && (
                <button
                  type="button"
                  onClick={() => setMapSearch('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex'
                  }}
                >
                  <IconX size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* The Safety Map */}
        <SafetyMap
          places={filteredMapPlaces}
          selectedPlaceId={selectedPlaceId}
          onMarkerClick={(place) => setSelectedPlaceId(place.id)}
          mapHeight="440px"
          showDetailsButton={true}
          isAdmin={true}
        />

        {/* Legend & Summary Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
              Active Concern (High)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
              Moderate / Pending
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
              Resolved Place
            </span>
          </div>

          <div>
            <span>{mapStats.pending} pending · {mapStats.accepted} accepted · {mapStats.resolved} recently resolved</span>
          </div>
        </div>

        {/* No Coordinates Notice */}
        {mapStats.withoutCoords > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f1f5f9',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <IconInfo size={14} color="var(--primary-blue)" />
            <span>Some reported places ({mapStats.withoutCoords}) do not have map coordinates and can be managed directly in the directory lists.</span>
          </div>
        )}

        {/* Selected Place Quick Action Bar (if marker clicked) */}
        {selectedPlace && (
          <div style={{
            marginTop: '0.85rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--primary-navy)', fontSize: '0.9rem' }}>{selectedPlace.name}</strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>({selectedPlace.district}, {selectedPlace.state})</span>
              {selectedPlace.status === 'pending' ? (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Pending Review</span>
              ) : (selectedPlace.resolved === true || selectedPlace.resolved === 1 || selectedPlace.resolved === 'true') ? (
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Resolved</span>
              ) : (
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Accepted</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selectedPlace.status === 'pending' ? (
                <Link to="/admin/reports" className="btn btn-warning btn-sm" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}>
                  Review Report &rarr;
                </Link>
              ) : (
                <Link to="/admin/places" className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}>
                  Manage Place &rarr;
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedPlaceId(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                aria-label="Close selection"
              >
                <IconX size={12} />
              </button>
            </div>
          </div>
        )}

      </section>

      {/* =========================================================================
          3. Moderation Queue (Primary Focus)
          ========================================================================= */}
      <section aria-label="Moderation Queue">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconFileText size={18} color="var(--primary-blue)" /> Reports Awaiting Review
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
            <div style={{ color: '#059669', marginBottom: '0.5rem' }}>
              <IconCheckCircle size={48} />
            </div>
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconSliders size={18} /> Operational Controls
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
            Quick administrative navigation to directories and management tools
          </p>
        </div>

        <div className="action-grid">
          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#d97706' }}>
                <IconFileText size={22} />
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
                <IconMapPin size={22} />
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
                <IconUsers size={22} />
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

          <div className="action-card">
            <div className="action-card-header">
              <div className="action-card-icon" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: 'var(--primary-blue)' }}>
                <IconPhone size={22} />
              </div>
              <div>
                <h3 className="action-card-title">Manage Safety Info</h3>
              </div>
            </div>
            <p className="action-card-desc">
              Publish safety guidance tips and maintain emergency contact helplines for citizens.
            </p>
            <Link to="/admin/safety-information" className="btn btn-secondary" style={{ marginTop: 'auto', width: '100%' }}>
              Manage Safety Info &rarr;
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;

