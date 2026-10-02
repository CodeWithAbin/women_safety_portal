import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import PlaceCard from '../../components/PlaceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

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

  // Debounce search input to avoid unnecessary requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPlaces = async (selectedState, selectedDistrict, searchQuery, ratingFilter, sortOption) => {
    setLoading(true);
    setError('');
    try {
      const res = await placeService.getAcceptedPlaces(
        selectedState,
        selectedDistrict,
        searchQuery,
        ratingFilter,
        sortOption
      );
      if (res.success) {
        setPlaces(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch hazardous places.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces(state, district, debouncedSearch, minRating, sort);
  }, [state, district, debouncedSearch, minRating, sort]);

  // Check if any non-default filter is active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (state && state !== (user?.state || 'Kerala')) ||
      (district && district !== (user?.district || 'Ernakulam')) ||
      search.trim() !== '' ||
      minRating !== '' ||
      sort !== ''
    );
  }, [state, district, search, minRating, sort, user]);

  const handleClearFilters = () => {
    setState(user?.state || 'Kerala');
    setDistrict(user?.district || 'Ernakulam');
    setSearch('');
    setMinRating('');
    setSort('');
  };

  const handleRatingUpdate = (placeId, updatedData) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, ...updatedData } : p))
    );
  };

  return (
    <div className="browse-places-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <span>🛡️</span> Verified Community Directory
        </div>
        <h1 className="page-title">Explore Safety Information</h1>
        <p className="page-subtitle">
          Check reported and verified safety concerns across districts, examine community hazard ratings, and contribute your own ratings to keep everyone safe.
        </p>
      </div>

      {/* Visually Organized Filter & Search Controls */}
      <div className="filter-card">
        <div className="filter-header-row">
          <div className="filter-header-title">
            <span>⚙️</span> Filter & Search Safety Reports
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}
            >
              <span>↺</span> Reset Filters
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
          stateLabel="📍 Filter by State"
          districtLabel="📍 Filter by District"
        />

        {/* Keyword Search, Rating Filter, and Sorting */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
          {/* Search Keyword */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="search-input">
              <span>🔍</span> Search by Keyword
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
            <label className="form-label" htmlFor="min-rating-select">
              <span>⭐</span> Minimum Safety Rating
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
            <label className="form-label" htmlFor="sort-select">
              <span>🔃</span> Sort Results
            </label>
            <select
              id="sort-select"
              className="form-control"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Default Order</option>
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
            {state && (
              <span className="filter-chip">
                <span>📍 State: {state}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => { setState(''); setDistrict(''); }}
                  title="Remove state filter"
                  aria-label="Remove state filter"
                >
                  ×
                </button>
              </span>
            )}
            {district && (
              <span className="filter-chip">
                <span>📍 District: {district}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setDistrict('')}
                  title="Remove district filter"
                  aria-label="Remove district filter"
                >
                  ×
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="filter-chip">
                <span>🔍 "{search}"</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setSearch('')}
                  title="Remove search filter"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </span>
            )}
            {minRating && (
              <span className="filter-chip">
                <span>⭐ {minRating}+ Stars</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setMinRating('')}
                  title="Remove rating filter"
                  aria-label="Remove rating filter"
                >
                  ×
                </button>
              </span>
            )}
            {sort && (
              <span className="filter-chip">
                <span>🔃 {sort === 'rating_desc' ? 'Highest Rating' : sort === 'rating_asc' ? 'Lowest Rating' : 'Newest'}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => setSort('')}
                  title="Remove sort"
                  aria-label="Remove sort"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner message="Searching verified safety reports..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? '🔍' : '🛡️'}
          title={hasActiveFilters ? 'No Matching Safety Reports Found' : 'No Hazardous Places Reported'}
          message={
            hasActiveFilters
              ? `No verified hazardous places match your current search and filter settings. Try adjusting your search query or location.`
              : `No verified hazardous places have been reported in ${district ? `${district}, ` : ''}${state || 'the selected location'}.`
          }
          actionButton={
            hasActiveFilters ? (
              <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                <span>↺</span> Clear All Filters
              </button>
            ) : (
              <Link to="/report" className="btn btn-primary">
                <span>➕</span> Report a New Concern
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Results Summary Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            padding: '0.65rem 1rem',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-body)'
          }}>
            <div>
              Showing <strong>{places.length}</strong> verified hazardous place{places.length > 1 ? 's' : ''}{' '}
              in <strong style={{ color: 'var(--primary-navy)' }}>{district || 'All Districts'}, {state || 'All States'}</strong>
            </div>
            {places.length > 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ⭐ Click "Rate This Place" on any card to submit your assessment
              </span>
            )}
          </div>

          {/* Place Cards Grid */}
          <div className="grid-cards">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onRatingSuccess={handleRatingUpdate}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowsePlacesPage;

