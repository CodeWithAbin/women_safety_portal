import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { safePlaceService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import LocationPickerMap from '../../components/LocationPickerMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import {
  IconShieldCheck,
  IconMapPin,
  IconSearch,
  IconStar,
  IconPlus,
  IconCheckCircle,
  IconClock,
  IconAlertCircle,
  IconUsers,
  IconRefresh,
  IconX
} from '../../components/Icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Emerald Safe Place Map Pin Icon
const createSafePlacePinIcon = (isSelected = false) => {
  const color = isSelected ? '#047857' : '#059669';
  const strokeColor = '#064e3b';
  const size = isSelected ? 38 : 32;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${size}" height="${size * 1.31}">
      <defs>
        <filter id="safe-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 26 16 42 16 42 C16 42 32 26 32 16 C32 7.16 24.84 0 16 0 Z" 
            fill="${color}" stroke="${strokeColor}" stroke-width="1.5" filter="url(#safe-shadow)"/>
      <circle cx="16" cy="15" r="7.5" fill="#ffffff" />
      <path d="M12 15 L15 18 L20 12" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  return L.divIcon({
    className: 'safe-place-map-marker',
    html: svg,
    iconSize: [size, size * 1.31],
    iconAnchor: [size / 2, size * 1.31],
    popupAnchor: [0, -size * 1.1]
  });
};

const SafePlacesPage = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'report' | 'my-reports'
  const [places, setPlaces] = useState([]);
  const [myPlaces, setMyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  // Submission Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: '',
    district: '',
    description: '',
    rating: 5,
    latitude: 9.9816,
    longitude: 76.2999
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (st) => {
    setFormData((prev) => ({ ...prev, state: st, district: '' }));
  };

  // Map reference
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch approved safe places
  const fetchPlaces = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await safePlaceService.getAcceptedSafePlaces({
        state: stateFilter,
        district: districtFilter,
        search: searchQuery,
        minRating: minRatingFilter,
        sort: sortOption
      });
      if (res.success) {
        setPlaces(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load safe places.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch my safe place submissions
  const fetchMyPlaces = async () => {
    try {
      const res = await safePlaceService.getMySafePlaces();
      if (res.success) {
        setMyPlaces(res.data || []);
      }
    } catch (err) {
      // Non-critical fallback
    }
  };

  useEffect(() => {
    fetchPlaces();
    fetchMyPlaces();
  }, [stateFilter, districtFilter, minRatingFilter, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlaces();
  };

  // Initialize and update Map when places change
  useEffect(() => {
    if (activeTab !== 'browse') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const validPlaces = places.filter((p) => p.latitude != null && p.longitude != null);

    if (validPlaces.length > 0) {
      const bounds = [];

      validPlaces.forEach((p) => {
        const isSelected = p.id === selectedPlaceId;
        const icon = createSafePlacePinIcon(isSelected);
        const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 180px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 4px; color: #059669; font-weight: 700; font-size: 0.85rem; margin-bottom: 2px;">
              <span>🛡️ Safe Place</span>
            </div>
            <strong style="font-size: 0.95rem; color: #0f172a; display: block; margin-bottom: 4px;">${p.name}</strong>
            <p style="margin: 0 0 6px; font-size: 0.82rem; color: #475569;">${p.address}</p>
            <div style="font-size: 0.8rem; color: #d97706; font-weight: 600;">⭐ Safety Rating: ${p.rating}/5</div>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedPlaceId(p.id);
        });

        markersRef.current.push(marker);
        bounds.push([p.latitude, p.longitude]);
      });

      if (bounds.length > 0 && !selectedPlaceId) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [places, activeTab, selectedPlaceId]);

  // Focus place on map
  const handleLocateOnMap = (p) => {
    setSelectedPlaceId(p.id);
    if (mapInstanceRef.current && p.latitude != null && p.longitude != null) {
      mapInstanceRef.current.flyTo([p.latitude, p.longitude], 15, { duration: 1.2 });
    }
    // Scroll map into view smoothly if on small screens
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Submit Safe Place Handler
  const handleSubmitSafePlace = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await safePlaceService.submitSafePlace(formData);
      if (res.success) {
        setSuccessMsg('Safe Place submitted successfully! It is now pending administrative verification.');
        setFormData({
          name: '',
          address: '',
          state: '',
          district: '',
          description: '',
          rating: 5,
          latitude: 9.9816,
          longitude: 76.2999
        });
        fetchMyPlaces();
        setActiveTab('my-reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit safe place.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--hazard-low-bg)', color: 'var(--hazard-low)' }}>
                <IconShieldCheck size={24} />
              </div>
              <h1 className="page-title" style={{ margin: 0 }}>Safe Places Network</h1>
            </div>
            <p className="page-subtitle" style={{ margin: '0.35rem 0 0' }}>
              Discover, browse, and report verified safe spaces, women-friendly emergency shelters, well-lit facilities, and help stations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Safe Places
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('report')}
            >
              <IconPlus size={16} />
              Report a Safe Place
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'my-reports' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('my-reports')}
            >
              My Submissions {myPlaces.length > 0 && `(${myPlaces.length})`}
            </button>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}

      {/* TAB 1: BROWSE SAFE PLACES */}
      {activeTab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Interactive Safe Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--hazard-low)', fontWeight: 700 }}>
                <IconShieldCheck size={18} />
                <span>Verified Safe Places Map</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {places.length} verified locations
              </span>
            </div>
            <div ref={mapContainerRef} style={{ height: '360px', width: '100%' }} />
          </div>

          {/* Filter & Search Bar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Search Safe Places</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingRight: '2rem' }}
                    />
                    <button
                      type="submit"
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)' }}
                    >
                      <IconSearch size={16} />
                    </button>
                  </div>
                </div>

                <StateDistrictSelector
                  selectedState={stateFilter}
                  selectedDistrict={districtFilter}
                  onStateChange={(st) => setStateFilter(st)}
                  onDistrictChange={(dt) => setDistrictFilter(dt)}
                  allowAllOption={true}
                  allStateText="All States"
                  allDistrictText="All Districts"
                  stateLabel="Filter by State"
                  districtLabel="Filter by District"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>Min Safety Rating</label>
                    <select
                      className="form-control"
                      value={minRatingFilter}
                      onChange={(e) => setMinRatingFilter(e.target.value)}
                    >
                      <option value="">Any Rating</option>
                      <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value="4">⭐⭐⭐⭐ (4+ Stars)</option>
                      <option value="3">⭐⭐⭐ (3+ Stars)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>Sort By</label>
                    <select
                      className="form-control"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="rating_desc">Highest Rated</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Safe Places List */}
          {loading ? (
            <LoadingSpinner message="Loading safe places..." />
          ) : places.length === 0 ? (
            <EmptyState
              icon={<IconShieldCheck size={42} color="var(--hazard-low)" />}
              title="No Safe Places Found"
              message="No safe places match your current search and filter criteria. Try expanding your search or submit a new safe place!"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {places.map((p) => {
                const isSelected = p.id === selectedPlaceId;
                return (
                  <article
                    key={p.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isSelected ? '2px solid var(--hazard-low)' : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? 'var(--hazard-low-bg)' : '#ffffff',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                          {p.name}
                        </h3>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <IconShieldCheck size={13} />
                          Verified
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem', color: '#d97706', fontSize: '0.88rem', fontWeight: 600 }}>
                        {[...Array(5)].map((_, idx) => (
                          <IconStar
                            key={idx}
                            size={14}
                            filled={idx < (p.rating || 5)}
                            color={idx < (p.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                        <span style={{ marginLeft: '4px', color: 'var(--text-body)' }}>{p.rating || 5}/5</span>
                      </div>

                      <p style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                        <IconMapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{p.address}, {p.district}, {p.state}</span>
                      </p>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        {p.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Added {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
                      </span>

                      {p.latitude != null && p.longitude != null && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleLocateOnMap(p)}
                        >
                          <IconMapPin size={13} color="var(--hazard-low)" />
                          Locate
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REPORT A SAFE PLACE */}
      {activeTab === 'report' && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.35rem', color: 'var(--primary-navy)' }}>Report a Verified Safe Space</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Help your community by submitting women-friendly facilities, round-the-clock pharmacies, well-lit transport hubs, and safety stations.
            </p>
          </div>

          <form onSubmit={handleSubmitSafePlace}>
            <div className="form-group">
              <label className="form-label">
                Safe Place Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 24/7 Women Help Desk - Railway Station"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
                maxLength={150}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Full Street Address <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Platform 1 Entrance, Central Station Road"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                required
                maxLength={300}
              />
            </div>

            <StateDistrictSelector
              selectedState={formData.state}
              selectedDistrict={formData.district}
              onStateChange={handleStateChange}
              onDistrictChange={(dt) => handleFieldChange('district', dt)}
              required={true}
            />

            <div className="form-group">
              <label className="form-label">
                Safety Rating (1 - 5 Stars) <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleFieldChange('rating', star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <IconStar
                      size={24}
                      filled={star <= formData.rating}
                      color={star <= formData.rating ? '#f59e0b' : '#cbd5e1'}
                    />
                  </button>
                ))}
                <span style={{ fontWeight: 600, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                  {formData.rating} out of 5
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Safety Description & Amenities <span className="required">*</span>
              </label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Describe why this place is safe (e.g., active CCTV surveillance, 24/7 security personnel, bright street lighting, emergency telephone)..."
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
                maxLength={1500}
              />
            </div>

            {/* Location Coordinate Picker */}
            <div className="form-group">
              <label className="form-label">
                Pin Location on Map <span className="required">*</span>
              </label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                Click on the map or drag the pin to set the exact geographic coordinates.
              </p>
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={({ latitude, longitude }) => setFormData((prev) => ({ ...prev, latitude, longitude }))}
                height="280px"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('browse')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !formData.name || !formData.state || !formData.district}
              >
                {submitting ? 'Submitting Safe Place...' : 'Submit Safe Place for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MY SUBMISSIONS */}
      {activeTab === 'my-reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.35rem', color: 'var(--primary-navy)' }}>
              My Safe Place Submissions
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Track the verification and publication status of the safe places you have reported.
            </p>
          </div>

          {myPlaces.length === 0 ? (
            <EmptyState
              icon={<IconShieldCheck size={42} color="var(--primary-blue)" />}
              title="No Safe Place Submissions Yet"
              message="You haven't submitted any safe places yet. Click 'Report a Safe Place' to contribute to community safety!"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myPlaces.map((sp) => {
                const isAccepted = sp.status === 'accepted';
                const isRejected = sp.status === 'rejected';
                const isPending = sp.status === 'pending';

                return (
                  <div
                    key={sp.id}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderLeft: isAccepted
                        ? '4px solid var(--hazard-low)'
                        : isRejected
                          ? '4px solid #dc2626'
                          : '4px solid #f59e0b',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--primary-navy)' }}>
                          {sp.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {sp.address}, {sp.district}, {sp.state}
                        </p>
                      </div>

                      <span
                        className={`badge ${
                          isAccepted
                            ? 'badge-success'
                            : isRejected
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                        style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}
                      >
                        {isAccepted ? 'Approved & Live' : isRejected ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', margin: '0.5rem 0' }}>
                      {sp.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                      <span>Submitted on {sp.created_at ? new Date(sp.created_at).toLocaleDateString() : ''}</span>
                      <span>Rating: {sp.rating}/5 ⭐</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SafePlacesPage;
