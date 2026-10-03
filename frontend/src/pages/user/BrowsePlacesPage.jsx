import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import PlaceCard from '../../components/PlaceCard';
import SafetyMap from '../../components/SafetyMap';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';
import {
  IconShield,
  IconShieldCheck,
  IconMapPin,
  IconMap,
  IconSearch,
  IconNavigation,
  IconStar,
  IconRefresh,
  IconCheck,
  IconSliders,
  IconInfo,
  IconPlus,
  IconX
} from '../../components/Icons';

const BrowsePlacesPage = () => {
  const { user } = useAuth();
  const [state, setState] = useState(user?.state || 'Kerala');
  const [district, setDistrict] = useState(user?.district || 'Ernakulam');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Location / Nearby state
  const [userCoords, setUserCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  // Debounce search input to avoid unnecessary requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPlaces = async (
    selectedState,
    selectedDistrict,
    searchQuery,
    ratingFilter,
    sortOption,
    lat,
    lon,
    radius
  ) => {
    setLoading(true);
    setError('');
    try {
      const res = await placeService.getAcceptedPlaces(
        selectedState,
        selectedDistrict,
        searchQuery,
        ratingFilter,
        sortOption,
        lat,
        lon,
        radius
      );
      if (res.success) {
        setPlaces(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reported places.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces(
      state,
      district,
      debouncedSearch,
      minRating,
      sort,
      userCoords?.latitude,
      userCoords?.longitude,
      userCoords ? radiusKm : null
    );
  }, [state, district, debouncedSearch, minRating, sort, userCoords, radiusKm]);

  // Check if any non-default filter is active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (state && state !== (user?.state || 'Kerala')) ||
      (district && district !== (user?.district || 'Ernakulam')) ||
      search.trim() !== '' ||
      minRating !== '' ||
      sort !== '' ||
      userCoords !== null
    );
  }, [state, district, search, minRating, sort, userCoords, user]);

  const handleClearFilters = () => {
    setState(user?.state || 'Kerala');
    setDistrict(user?.district || 'Ernakulam');
    setSearch('');
    setMinRating('');
    setSort('');
    setUserCoords(null);
    setLocationStatusMsg('');
    setSelectedPlaceId(null);
  };

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
        setLocationStatusMsg('Showing verified hazards near your location.');
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationStatusMsg('Location access was not granted. You can still browse places by State and District.');
        } else {
          setLocationStatusMsg('Could not retrieve your location. You can browse places by State and District.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearLocation = () => {
    setUserCoords(null);
    setLocationStatusMsg('');
  };

  const handleRatingUpdate = (placeId, updatedData) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, ...updatedData } : p))
    );
  };

  const placesWithCoords = useMemo(() => {
    return places.filter((p) => p.latitude != null && p.longitude != null);
  }, [places]);

  const placesWithoutCoordsCount = places.length - placesWithCoords.length;

  return (
    <div className="browse-places-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <IconShieldCheck size={14} /> Verified Community Directory
        </div>
        <h1 className="page-title">Explore Safety Information</h1>
        <p className="page-subtitle">
          Check reported and verified safety concerns on the interactive map, examine community hazard ratings, and explore nearby reports in your area.
        </p>
      </div>

      {/* Visually Organized Filter & Search Controls */}
      <div className="filter-card">
        <div className="filter-header-row">
          <div className="filter-header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconSliders size={16} /> Filter & Search Safety Reports
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <IconRefresh size={13} /> Reset Filters
            </button>
          )}
        </div>

        {/* State & District Selectors */}
        <StateDistrictSelector
          selectedState={state}
          selectedDistrict={district}
          onStateChange={(st) => setState(st)}
          onDistrictChange={(dt) => setDistrict(dt)}
          allowAllOption={true}
          allStateText="All States"
          allDistrictText="All Districts"
          stateLabel="Filter by State"
          districtLabel="Filter by District"
        />

        {/* Keyword Search, Rating Filter, and Sorting */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
          {/* Search Keyword */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="search-input" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconSearch size={14} /> Search by Keyword
            </label>
            <input
              id="search-input"
              type="text"
              className="form-control"
              placeholder="Search by name, street, hazard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Minimum Safety Rating */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="min-rating-select" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconStar size={14} filled color="#d97706" /> Minimum Safety Rating
            </label>
            <select
              id="min-rating-select"
              className="form-control"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Sort Results */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="sort-select" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconSliders size={14} /> Sort Results
            </label>
            <select
              id="sort-select"
              className="form-control"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">{userCoords ? 'Closest Distance First' : 'Default Order'}</option>
              <option value="rating_desc">Highest Safety Rating First (5★ → 1★)</option>
              <option value="rating_asc">Lowest Safety Rating First (1★ → 5★)</option>
              <option value="newest">Most Recently Reported</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="filter-chips-bar" aria-label="Active Filters">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Filters:</span>
            {userCoords && (
              <span className="filter-chip" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconNavigation size={12} />
                <span>Nearby ({radiusKm} km radius)</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleClearLocation}
                  title="Remove location filter"
                  aria-label="Remove location filter"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {state && (
              <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconMapPin size={12} />
                <span>State: {state}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => { setState(''); setDistrict(''); }}
                  title="Remove state filter"
                  aria-label="Remove state filter"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {district && (
              <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconMapPin size={12} />
                <span>District: {district}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setDistrict('')}
                  title="Remove district filter"
                  aria-label="Remove district filter"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconSearch size={12} />
                <span>"{search}"</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setSearch('')}
                  title="Remove search filter"
                  aria-label="Remove search filter"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {minRating && (
              <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconStar size={12} filled color="#d97706" />
                <span>{minRating}+ Stars</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setMinRating('')}
                  title="Remove rating filter"
                  aria-label="Remove rating filter"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
            {sort && (
              <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconSliders size={12} />
                <span>{sort === 'rating_desc' ? 'Highest Rating' : sort === 'rating_asc' ? 'Lowest Rating' : 'Newest'}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setSort('')}
                  title="Remove sort"
                  aria-label="Remove sort"
                >
                  <IconX size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Map Controls & Geolocation Hub */}
      <div className="map-control-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!userCoords ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleUseMyLocation}
              disabled={locating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              <IconNavigation size={15} /> {locating ? 'Detecting Location...' : 'Use My Location'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700 }}>
                <IconCheck size={13} /> Location Active
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearLocation}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              >
                Reset Location
              </button>
            </div>
          )}

          {/* Radius Selector (enabled when user location is active) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <label htmlFor="radius-select" style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
              Nearby Radius:
            </label>
            <select
              id="radius-select"
              className="form-control"
              style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
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

        {/* Status message */}
        {locationStatusMsg && (
          <div style={{ fontSize: '0.84rem', color: userCoords ? '#059669' : 'var(--text-muted)', fontWeight: 500 }}>
            {locationStatusMsg}
          </div>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Main Content Layout: Map + Cards */}
      {loading ? (
        <LoadingSpinner message="Searching verified safety reports..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon={<IconSearch size={38} color="var(--text-muted)" />}
          title={hasActiveFilters ? 'No Matching Safety Reports Found' : 'No Reported Places Found'}
          message={
            userCoords
              ? `No verified reported places found within ${radiusKm} km of your location. Try expanding the nearby radius or searching by district.`
              : hasActiveFilters
              ? `No verified reported places match your current search and filter settings. Try adjusting your search query or location.`
              : `No verified reported places have been recorded in ${district ? `${district}, ` : ''}${state || 'the selected location'}.`
          }
          actionButton={
            hasActiveFilters ? (
              <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconRefresh size={14} /> Clear All Filters
              </button>
            ) : (
              <Link to="/report" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconPlus size={15} /> Report a New Concern
              </Link>
            )
          }
        />
      ) : (
        <div className="browse-places-layout">
          {/* Column 1: Map Panel */}
          <div className="map-sticky-panel">
            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconMap size={16} /> Interactive Safety Map
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {placesWithCoords.length} plotted on map
              </div>
            </div>

            <SafetyMap
              places={places}
              userLocation={userCoords}
              radiusKm={userCoords ? radiusKm : null}
              selectedPlaceId={selectedPlaceId}
              onMarkerClick={(p) => {
                setSelectedPlaceId(p.id);
                const el = document.getElementById('place-card-' + p.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />

            {/* Note for places without coordinates */}
            {placesWithoutCoordsCount > 0 && (
              <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconInfo size={14} /> {placesWithCoords.length} of {places.length} places shown on map. Some reports do not have map coordinates yet.
              </div>
            )}
          </div>

          {/* Column 2: Places List */}
          <div>
            {/* Results Summary Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.65rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: 'var(--text-body)'
            }}>
              <div>
                Showing <strong>{places.length}</strong> verified place{places.length > 1 ? 's' : ''}{' '}
                {userCoords
                  ? `within ${radiusKm} km of your location`
                  : `in ${district || 'All Districts'}, ${state || 'All States'}`}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Click a card to focus on map
              </span>
            </div>

            {/* Place Cards Grid / Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {places.map((place) => (
                <div
                  key={place.id}
                  id={`place-card-${place.id}`}
                  className={selectedPlaceId === place.id ? 'place-card-selected' : ''}
                  style={{ borderRadius: 'var(--radius-md)', transition: 'box-shadow 0.2s ease, outline 0.2s ease', cursor: 'pointer' }}
                  onClick={() => setSelectedPlaceId(place.id)}
                >
                  <PlaceCard
                    place={place}
                    onRatingSuccess={handleRatingUpdate}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowsePlacesPage;

