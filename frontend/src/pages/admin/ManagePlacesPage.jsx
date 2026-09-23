import React, { useState, useEffect } from 'react';
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

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPlaces(filterState, filterDistrict);
      if (res.success) {
        setPlaces(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch hazardous places.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [filterState, filterDistrict]);

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
      rating: place.rating,
      description: place.description
    });
    setPhotoFile(null);
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
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Manage Hazardous Places</h1>
          <p className="page-subtitle">
            View, add, modify, and delete verified hazardous areas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Add New Place
        </button>
      </div>

      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <StateDistrictSelector
          selectedState={filterState}
          selectedDistrict={filterDistrict}
          onStateChange={(st) => setFilterState(st)}
          onDistrictChange={(dt) => setFilterDistrict(dt)}
          allowAllOption={true}
          allStateText="All States"
          allDistrictText="All Districts"
          stateLabel="Filter Places by State"
          districtLabel="Filter Places by District"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading hazardous places..." />
      ) : places.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No Places Found"
          message="No hazardous places match the current location filter."
          actionButton={
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              + Add First Place
            </button>
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
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Add Hazardous Place</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePlace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Place Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Unlit Junction"
                    value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address & Landmark <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Near Metro Station"
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
                  <label className="form-label">Rating (1 to 5)</label>
                  <select
                    className="form-control"
                    value={placeForm.rating}
                    onChange={(e) => setPlaceForm({ ...placeForm, rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>Level {r} {r >= 4 ? '(High Hazard)' : r === 3 ? '(Medium)' : '(Low)'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the safety hazard..."
                    value={placeForm.description}
                    onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Photo <span className="required">*</span></label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-control"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    required
                  />
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
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Edit Hazardous Place</h3>
              <button className="modal-close" onClick={() => setEditPlace(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdatePlace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Place Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={placeForm.name}
                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address & Landmark <span className="required">*</span></label>
                  <input
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
                  <label className="form-label">Rating (1 to 5)</label>
                  <select
                    className="form-control"
                    value={placeForm.rating}
                    onChange={(e) => setPlaceForm({ ...placeForm, rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>Level {r} {r >= 4 ? '(High Hazard)' : r === 3 ? '(Medium)' : '(Low)'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <textarea
                    className="form-control"
                    value={placeForm.description}
                    onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Change Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-control"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                  />
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
        message={`Are you sure you want to permanently delete "${deleteTargetPlace?.name}"? This action cannot be undone.`}
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
