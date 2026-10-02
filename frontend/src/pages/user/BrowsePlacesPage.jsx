import React, { useState, useEffect } from 'react';
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Hazardous Places</h1>
        <p className="page-subtitle">
          Explore verified unsafe and hazardous areas, filter by location, and contribute community safety ratings.
        </p>
      </div>

      {/* Cascading Filter & Search Controls */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '0.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="search-input">
              Search by Keyword
            </label>
            <input
              id="search-input"
              type="text"
              className="form-control"
              placeholder="Search by name, landmark, street..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="min-rating-select">
              Minimum Safety Rating
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="sort-select">
              Sort Results
            </label>
            <select
              id="sort-select"
              className="form-control"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Default Order</option>
              <option value="rating_desc">Highest Safety Rating First</option>
              <option value="rating_asc">Lowest Safety Rating First</option>
              <option value="newest">Most Recently Reported</option>
            </select>
          </div>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {loading ? (
        <LoadingSpinner message="Searching verified hazardous places..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No Hazardous Places Reported"
          message={`No verified places match your filters in ${district ? `${district}, ` : ''}${state || 'the selected location'}.`}
        />
      ) : (
        <>
          <div style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Showing <strong>{places.length}</strong> verified hazardous place{places.length > 1 ? 's' : ''}:
          </div>
          <div className="grid-cards">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowsePlacesPage;

