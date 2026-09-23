import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placeService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import AlertBanner from '../../components/AlertBanner';

const ReportPlacePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: user?.state || 'Kerala',
    district: user?.district || 'Ernakulam',
    rating: 4,
    description: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP image files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please select a smaller photo.');
      return;
    }

    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!photoFile) {
      setError('Please attach a photo of the hazardous place.');
      return;
    }

    if (!formData.state || !formData.district) {
      setError('Please specify both State and District.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('address', formData.address);
      data.append('state', formData.state);
      data.append('district', formData.district);
      data.append('rating', formData.rating);
      data.append('description', formData.description);
      data.append('photo', photoFile);

      const res = await placeService.reportPlace(data);
      if (res.success) {
        setSuccessMsg('Your report has been submitted and is waiting for admin review.');
        // Reset form
        setFormData({
          name: '',
          address: '',
          state: user?.state || 'Kerala',
          district: user?.district || 'Ernakulam',
          rating: 4,
          description: ''
        });
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Report a Hazardous Place</h1>
        <p className="page-subtitle">
          Help improve community safety by reporting unsafe, dark, or hazardous public areas.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
        {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="placeName">
              Place Name / Title <span className="required">*</span>
            </label>
            <input
              id="placeName"
              type="text"
              className="form-control"
              placeholder="e.g. Unlit Underpass near Metro Gate 2"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">
              Street Address & Landmark <span className="required">*</span>
            </label>
            <input
              id="address"
              type="text"
              className="form-control"
              placeholder="e.g. MG Road, Pillar 104, Behind Bus Stop"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              required
            />
          </div>

          <StateDistrictSelector
            selectedState={formData.state}
            selectedDistrict={formData.district}
            onStateChange={(st) => handleFieldChange('state', st)}
            onDistrictChange={(dt) => handleFieldChange('district', dt)}
            required={true}
          />

          <div className="form-group">
            <label className="form-label">
              Hazard Severity Rating (1 = Low, 5 = Severe Hazard) <span className="required">*</span>
            </label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  className={`rating-btn ${formData.rating === lvl ? 'active' : ''}`}
                  onClick={() => handleFieldChange('rating', lvl)}
                >
                  {lvl} {lvl === 5 ? '🔥 Critical' : lvl === 1 ? '⚠️ Minor' : '★'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Detailed Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              className="form-control"
              placeholder="Describe the hazard (e.g. completely unlit after 7 PM, lack of security, frequent anti-social gatherings)..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="photo">
              Attach Photo of the Hazard <span className="required">*</span>
            </label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="form-control"
              onChange={handlePhotoChange}
              required={!photoPreview}
            />
            <div className="form-hint">Accepted formats: JPG, PNG, WebP (Max 5MB)</div>

            {photoPreview && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Image Preview:</div>
                <img src={photoPreview} alt="Hazard Preview" className="photo-preview" />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '1.25rem', padding: '0.85rem' }}
          >
            {loading ? 'Submitting Report...' : 'Submit Report for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPlacePage;
