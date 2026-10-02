import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import PlaceCard from '../../components/PlaceCard';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/AlertBanner';

const ManagePlacesPage = () => {
  const [places, setPlaces] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlace, setEditPlace] = useState(null);
  const [deleteTargetPlace, setDeleteTargetPlace] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states for Add / Edit
  const [placeForm, setPlaceForm] = useState({
    name: '',
    address: '',
    state: 'Kerala',
    district: 'Ernakulam',
    rating: 3,
    description: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Debounce search input to avoid unnecessary requests while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPlaces(filterState, filterDistrict, debouncedSearch, minRating, sort);
      if (res.success) {
        setPlaces(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch hazardous places.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [filterState, filterDistrict, debouncedSearch, minRating, sort]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filterState !== '' ||
      filterDistrict !== '' ||
      search.trim() !== '' ||
      minRating !== '' ||
      sort !== ''
    );
  }, [filterState, filterDistrict, search, minRating, sort]);

  const handleClearFilters = () => {
    setFilterState('');
    setFilterDistrict('');
    setSearch('');
    setMinRating('');
    setSort('');
  };

  const resetForm = () => {
    setPlaceForm({
      name: '',
      address: '',
      state: 'Kerala',
      district: 'Ernakulam',
      rating: 3,
      description: ''
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP image files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo exceeds the 5MB size limit.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (place) => {
    setPlaceForm({
      name: place.name,
      address: place.address,
      state: place.state,
      district: place.district,
      rating: place.rating || 3,
      description: place.description
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditPlace(place);
  };

  const handleCreatePlace = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setError('A photo is required when adding a hazardous place.');
      return;
    }

    setModalLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', placeForm.name);
      data.append('address', placeForm.address);
      data.append('state', placeForm.state);
      data.append('district', placeForm.district);
      data.append('rating', placeForm.rating);
      data.append('description', placeForm.description);
      data.append('photo', photoFile);

      const res = await adminService.createPlace(data);
      if (res.success) {
        setSuccessMsg('Hazardous place created and published successfully.');
        setShowAddModal(false);
        resetForm();
        fetchPlaces();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create place.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePlace = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setError('');

    try {
      let res;
      if (photoFile) {
        const data = new FormData();
        data.append('name', placeForm.name);
        data.append('address', placeForm.address);
        data.append('state', placeForm.state);
        data.append('district', placeForm.district);
        data.append('rating', placeForm.rating);
        data.append('description', placeForm.description);
        data.append('photo', photoFile);
        res = await adminService.updatePlace(editPlace.id, data, true);
      } else {
        res = await adminService.updatePlace(editPlace.id, placeForm, false);
      }

      if (res.success) {
        setSuccessMsg('Hazardous place updated successfully.');
        setEditPlace(null);
        resetForm();
        fetchPlaces();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update place.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePlace = async () => {
    if (!deleteTargetPlace) return;
    setModalLoading(true);
    setError('');

    try {
      const res = await adminService.deletePlace(deleteTargetPlace.id);
      if (res.success) {
        setSuccessMsg('Hazardous place deleted successfully.');
        setDeleteTargetPlace(null);
        fetchPlaces();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete place.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="manage-places-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span>📍</span> Directory Management
          </div>
          <h1 className="page-title">Manage Hazardous Places</h1>
          <p className="page-subtitle">
            View, add, modify, and delete published hazardous areas in the portal safety directory.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <span>➕</span> Add New Place
        </button>
      </div>

      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Filter & Search Bar */}
      <div className="filter-card">
        <div className="filter-header-row">
          <div className="filter-header-title">
            <span>⚙️</span> Filter & Search Directory
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

        <StateDistrictSelector
          selectedState={filterState}
          selectedDistrict={filterDistrict}
          onStateChange={(st) => setFilterState(st)}
          onDistrictChange={(dt) => setFilterDistrict(dt)}
          allowAllOption={true}
          allStateText="All States"
          allDistrictText="All Districts"
          stateLabel="📍 Filter Places by State"
          districtLabel="📍 Filter Places by District"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-search-input">
              <span>🔍</span> Search Keyword
            </label>
            <input
              id="admin-search-input"
              type="text"
              className="form-control"
              placeholder="Search by name, street, hazard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-min-rating-select">
              <span>⭐</span> Minimum Safety Rating
            </label>
            <select
              id="admin-min-rating-select"
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
            <label className="form-label" htmlFor="admin-sort-select">
              <span>🔃</span> Sort Results
            </label>
            <select
              id="admin-sort-select"
              className="form-control"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Default Order</option>
              <option value="rating_desc">Highest Safety Rating First</option>
              <option value="rating_asc">Lowest Safety Rating First</option>
              <option value="newest">Most Recently Added</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="filter-chips-bar" aria-label="Active Filters">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Active Filters:</span>
            {filterState && (
              <span className="filter-chip">
                <span>📍 State: {filterState}</span>
                <button type="button" className="filter-chip-remove" onClick={() => { setFilterState(''); setFilterDistrict(''); }}>×</button>
              </span>
            )}
            {filterDistrict && (
              <span className="filter-chip">
                <span>📍 District: {filterDistrict}</span>
                <button type="button" className="filter-chip-remove" onClick={() => setFilterDistrict('')}>×</button>
              </span>
            )}
            {search.trim() && (
              <span className="filter-chip">
                <span>🔍 "{search}"</span>
                <button type="button" className="filter-chip-remove" onClick={() => setSearch('')}>×</button>
              </span>
            )}
            {minRating && (
              <span className="filter-chip">
                <span>⭐ {minRating}+ Stars</span>
                <button type="button" className="filter-chip-remove" onClick={() => setMinRating('')}>×</button>
              </span>
            )}
            {sort && (
              <span className="filter-chip">
                <span>🔃 {sort === 'rating_desc' ? 'Highest Rating' : sort === 'rating_asc' ? 'Lowest Rating' : 'Newest'}</span>
                <button type="button" className="filter-chip-remove" onClick={() => setSort('')}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary Bar */}
      {places.length > 0 && (
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
            Showing <strong>{places.length}</strong> hazardous place{places.length > 1 ? 's' : ''}{' '}
            in <strong style={{ color: 'var(--primary-navy)' }}>{filterDistrict || 'All Districts'}, {filterState || 'All States'}</strong>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Use Edit or Delete buttons on each card to manage records
          </span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading hazardous places..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No Places Found"
          message={
            hasActiveFilters
              ? 'No hazardous places match the current location and search filters.'
              : 'No hazardous places are currently published in the portal directory.'
          }
          actionButton={
            hasActiveFilters ? (
              <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                <span>↺</span> Clear Filters
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                + Add First Place
              </button>
            )
          }
        />
      ) : (
        <div className="grid-cards">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isAdmin={true}
              onEdit={handleOpenEdit}
              onDelete={(p) => setDeleteTargetPlace(p)}
            />
          ))}
        </div>
      )}

      {/* Add Place Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-place-modal-title">
          <div className="modal-container">
            <div className="modal-header">
              <h3 id="add-place-modal-title" className="modal-title">Add Hazardous Place</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePlace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="add-name">
                    Place Name / Problem Title <span className="required">*</span>
                  </label>
                  <input
                    id="add-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Unlit Pedestrian Underpass near Market"
                    value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-address">
                    Address & Notable Landmark <span className="required">*</span>
                  </label>
                  <input
                    id="add-address"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Near Metro Station Exit 2, MG Road"
                    value={placeForm.address}
                    onChange={(e) => setPlaceForm({ ...placeForm, address: e.target.value })}
                    required
                  />
                </div>
                <StateDistrictSelector
                  selectedState={placeForm.state}
                  selectedDistrict={placeForm.district}
                  onStateChange={(st) => setPlaceForm({ ...placeForm, state: st })}
                  onDistrictChange={(dt) => setPlaceForm({ ...placeForm, district: dt })}
                  required={true}
                />
                <div className="form-group">
                  <label className="form-label" htmlFor="add-rating">
                    Initial Hazard Severity (1 to 5)
                  </label>
                  <select
                    id="add-rating"
                    className="form-control"
                    value={placeForm.rating}
                    onChange={(e) => setPlaceForm({ ...placeForm, rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        Level {r} {r >= 5 ? '(🔥 Critical Hazard)' : r >= 4 ? '(⚠️ High Hazard)' : r === 3 ? '(⚡ Moderate)' : '(🛡️ Minor)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-desc">
                    Detailed Problem Statement <span className="required">*</span>
                  </label>
                  <textarea
                    id="add-desc"
                    className="form-control"
                    placeholder="Describe the safety hazard and context..."
                    value={placeForm.description}
                    onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-photo">
                    Photo of Location <span className="required">*</span>
                  </label>
                  <input
                    id="add-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-control"
                    onChange={handlePhotoSelect}
                    required={!photoPreview}
                  />
                  {photoPreview && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img src={photoPreview} alt="Upload Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Place Modal */}
      {editPlace && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-place-modal-title">
          <div className="modal-container">
            <div className="modal-header">
              <h3 id="edit-place-modal-title" className="modal-title">Edit Hazardous Place</h3>
              <button className="modal-close" onClick={() => setEditPlace(null)} aria-label="Close modal">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdatePlace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">
                    Place Name <span className="required">*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className="form-control"
                    value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-address">
                    Address & Landmark <span className="required">*</span>
                  </label>
                  <input
                    id="edit-address"
                    type="text"
                    className="form-control"
                    value={placeForm.address}
                    onChange={(e) => setPlaceForm({ ...placeForm, address: e.target.value })}
                    required
                  />
                </div>
                <StateDistrictSelector
                  selectedState={placeForm.state}
                  selectedDistrict={placeForm.district}
                  onStateChange={(st) => setPlaceForm({ ...placeForm, state: st })}
                  onDistrictChange={(dt) => setPlaceForm({ ...placeForm, district: dt })}
                  required={true}
                />
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-rating">
                    Initial Rating (1 to 5)
                  </label>
                  <select
                    id="edit-rating"
                    className="form-control"
                    value={placeForm.rating}
                    onChange={(e) => setPlaceForm({ ...placeForm, rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        Level {r} {r >= 5 ? '(🔥 Critical Hazard)' : r >= 4 ? '(⚠️ High Hazard)' : r === 3 ? '(⚡ Moderate)' : '(🛡️ Minor)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="edit-desc"
                    className="form-control"
                    value={placeForm.description}
                    onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-photo">
                    Replace Photo (Optional)
                  </label>
                  <input
                    id="edit-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-control"
                    onChange={handlePhotoSelect}
                  />
                  {photoPreview && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img src={photoPreview} alt="New Photo Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditPlace(null)} disabled={modalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetPlace}
        title="Delete Hazardous Place"
        message={`Are you sure you want to permanently delete "${deleteTargetPlace?.name}" (${deleteTargetPlace?.address})? This record will be removed from the public safety directory and cannot be undone.`}
        confirmText="Delete Place"
        isDestructive={true}
        loading={modalLoading}
        onConfirm={handleDeletePlace}
        onCancel={() => setDeleteTargetPlace(null)}
      />
    </div>
  );
};

export default ManagePlacesPage;

