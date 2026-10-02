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

  // Similar report state for community prompt
  const [similarReport, setSimilarReport] = useState(null);
  const [ratingExisting, setRatingExisting] = useState(false);

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

  const handleRateExisting = async () => {
    if (!similarReport) return;
    setRatingExisting(true);
    setError('');
    try {
      const res = await placeService.ratePlace(similarReport.id, formData.rating);
      if (res.success) {
        setSuccessMsg(`Thank you! Your safety rating for "${similarReport.name}" has been recorded.`);
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit rating for existing report.');
    } finally {
      setRatingExisting(false);
    }
  };

  const existingCommunityRating = similarReport?.community_rating != null
    ? Number(similarReport.community_rating).toFixed(1)
    : similarReport?.rating != null
      ? Number(similarReport.rating).toFixed(1)
      : 'N/A';

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Report a Hazardous Place</h1>
        <p className="page-subtitle">
          Help protect women and your community by reporting unlit, unsafe, or hazardous public areas.
        </p>
      </div>

      <div className="card" style={{ padding: '2.25rem 2rem' }}>
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
        {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />}

        {/* Similar Report Prompt Modal / Alert */}
        {similarReport && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.35rem',
            backgroundColor: 'var(--primary-blue-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--primary-blue-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)', margin: 0 }}>
                Existing Report Found at This Location
              </h3>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1rem', lineHeight: '1.55' }}>
              A safety report has already been verified at or near this address. You can submit your rating ({formData.rating}★) to support the existing record, or continue publishing your distinct concern.
            </p>

            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.15rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                🚨 {similarReport.name}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                📍 {similarReport.address}, {similarReport.district}, {similarReport.state}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
                ⭐ Community Safety Rating: {existingCommunityRating} / 5 ({similarReport.rating_count || 1} rating{similarReport.rating_count === 1 ? '' : 's'})
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRateExisting}
                disabled={ratingExisting}
              >
                {ratingExisting ? 'Rating...' : `⭐ Rate Existing Place (${formData.rating}★)`}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={publishReportDirectly}
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Continue Publishing My Report'}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setSimilarReport(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem',
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
              Problem Statement / Hazard Title <span className="required">*</span>
            </label>
            <input
              id="placeName"
              type="text"
              className="form-control"
              placeholder="e.g. Broken street lights / Suspicious gathering at bus stop"
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
              placeholder="e.g. Swaraj Round North, Near Town Hall"
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
              Hazard Severity Rating (1 = Minor Concern, 5 = Critical Hazard) <span className="required">*</span>
            </label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  className={`rating-btn ${formData.rating === lvl ? 'active' : ''}`}
                  onClick={() => handleFieldChange('rating', lvl)}
                >
                  {lvl} {lvl === 5 ? '🔥 Critical' : lvl === 4 ? '⚠️ High' : lvl === 1 ? '🛡️ Minor' : '★'}
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
              placeholder="Provide context regarding the safety risk (e.g. dark walkway between 8 PM to 6 AM, overgrown bushes, non-functional CCTV)..."
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
            <div className="form-hint">Supported formats: JPG, PNG, WebP (Max file size: 5MB)</div>

            {photoPreview && (
              <div style={{ marginTop: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>Attached Photo Preview:</div>
                <img src={photoPreview} alt="Hazard Preview" className="photo-preview" />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || Boolean(similarReport)}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Submitting Report...' : 'Submit Report for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPlacePage;

