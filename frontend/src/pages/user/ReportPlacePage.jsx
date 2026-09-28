import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { placeService, getPhotoUrl } from '../../services/api';
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

  // Similar report state for community prompt
  const [similarReport, setSimilarReport] = useState(null);
  const [supportingExisting, setSupportingExisting] = useState(false);

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

  const resetForm = () => {
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
    setSimilarReport(null);
  };

  const publishReportDirectly = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setSimilarReport(null);

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
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
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
      // Safe matching check for similar accepted report
      const similarCheck = await placeService.checkSimilar({
        state: formData.state,
        district: formData.district,
        address: formData.address,
        name: formData.name
      });

      if (similarCheck.success && similarCheck.data?.similar_found && similarCheck.data?.existing_report) {
        setSimilarReport(similarCheck.data.existing_report);
        setLoading(false);
        return;
      }

      // No similar report, publish immediately
      await publishReportDirectly();
    } catch (err) {
      console.warn('Similar report check error, proceeding to publish directly:', err);
      await publishReportDirectly();
    }
  };

  const handleSupportExisting = async () => {
    if (!similarReport) return;
    setSupportingExisting(true);
    setError('');
    try {
      const res = await placeService.supportPlace(similarReport.id);
      if (res.success) {
        setSuccessMsg(`Thank you! You have supported the existing report for "${similarReport.name}".`);
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to support existing report.');
    } finally {
      setSupportingExisting(false);
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

        {/* Similar Report Prompt Modal / Alert */}
        {similarReport && (
          <div style={{
            marginBottom: '1.75rem',
            padding: '1.25rem',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1.5px solid #3b82f6',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                Similar Report Found at This Location
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#1e3a8a', marginBottom: '1rem', lineHeight: '1.5' }}>
              A similar report already exists at this location. You can support the existing report to help raise priority, or continue publishing your own report.
            </p>

            <div style={{
              backgroundColor: '#ffffff',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-navy, #0f172a)', marginBottom: '0.35rem' }}>
                🚨 {similarReport.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }}>
                📍 {similarReport.address}, {similarReport.district}, {similarReport.state}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>
                👍 {similarReport.support_count || 0} {(similarReport.support_count === 1) ? 'person supports' : 'people support'} this report
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSupportExisting}
                disabled={supportingExisting}
                style={{
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  fontWeight: 600,
                  padding: '0.6rem 1rem'
                }}
              >
                {supportingExisting ? 'Supporting...' : '👍 I Support This Report'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={publishReportDirectly}
                disabled={loading}
                style={{
                  fontWeight: 600,
                  padding: '0.6rem 1rem'
                }}
              >
                {loading ? 'Publishing...' : 'Continue Publishing My Report'}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setSimilarReport(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  padding: '0.6rem 0.75rem'
                }}
              >
                Modify Report
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="placeName">
              Problem Statement / Place Title <span className="required">*</span>
            </label>
            <input
              id="placeName"
              type="text"
              className="form-control"
              placeholder="e.g. Spotted attackers on the street / Broken street lights"
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
              placeholder="e.g. Thrissur Swaraj Road, Near Bus Stand"
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
              placeholder="Describe the problem (e.g. attackers spotted hiding behind trees after 8 PM, lack of streetlights)..."
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
            disabled={loading || Boolean(similarReport)}
            style={{ marginTop: '1.25rem', padding: '0.85rem' }}
          >
            {loading ? 'Checking & Submitting...' : 'Submit Report for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPlacePage;
