import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { placeService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import LocationPickerMap from '../../components/LocationPickerMap';
import AlertBanner from '../../components/AlertBanner';

const ReportPlacePage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: user?.state || 'Kerala',
    district: user?.district || 'Ernakulam',
    latitude: null,
    longitude: null,
    rating: 4,
    description: ''
  });
  const [locationMethod, setLocationMethod] = useState('none'); // 'none' | 'current' | 'manual'
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submittedReportName, setSubmittedReportName] = useState('');

  // Similar report state for community prompt
  const [similarReport, setSimilarReport] = useState(null);
  const [ratingExisting, setRatingExisting] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setLocationMethod('current');
    setLocating(true);
    setLocationStatusMsg('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        setLocationStatusMsg('Location coordinates captured from browser GPS.');
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationStatusMsg('Location access was not granted. You can still choose location manually or submit without coordinates.');
        } else {
          setLocationStatusMsg('Could not detect location. You can choose location manually or submit without coordinates.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualMapSelect = ({ latitude, longitude }) => {
    setLocationMethod('manual');
    setFormData((prev) => ({ ...prev, latitude, longitude }));
    setLocationStatusMsg('Location selected on map.');
  };

  const handleSelectMethod = (method) => {
    if (method === 'current') {
      handleGetCurrentLocation();
    } else if (method === 'manual') {
      setLocationMethod('manual');
      if (formData.latitude == null) {
        setLocationStatusMsg('Click on the map below to drop a pin.');
      }
    }
  };

  const handleClearLocation = () => {
    setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
    setLocationMethod('none');
    setLocationStatusMsg('');
  };

  const processFile = (file) => {
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

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      state: user?.state || 'Kerala',
      district: user?.district || 'Ernakulam',
      latitude: null,
      longitude: null,
      rating: 4,
      description: ''
    });
    setLocationMethod('none');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSimilarReport(null);
    setLocationStatusMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      if (formData.latitude != null && formData.longitude != null) {
        data.append('latitude', formData.latitude);
        data.append('longitude', formData.longitude);
      }

      const res = await placeService.reportPlace(data);
      if (res.success) {
        setSubmittedReportName(formData.name);
        setSuccessMsg('Your safety report has been submitted successfully and is queued for verification.');
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!photoFile) {
      setError('Please attach a clear photo of the reported area or safety concern.');
      return;
    }

    if (!formData.state || !formData.district) {
      setError('Please specify both State and District.');
      return;
    }

    setLoading(true);

    try {
      // Check for existing similar report
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

      // No similar report found, publish directly
      await publishReportDirectly();
    } catch (err) {
      console.warn('Similar report check error, proceeding to direct publish:', err);
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
        setSubmittedReportName(similarReport.name);
        setSuccessMsg(`Thank you! Your safety rating (${formData.rating}★) for "${similarReport.name}" has been recorded.`);
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

  const getRatingLabel = (score) => {
    switch (score) {
      case 5: return '🔥 5★ Critical Hazard (Immediate danger / Severe risk)';
      case 4: return '⚠️ 4★ High Hazard (Poorly lit / High concern)';
      case 3: return '⚡ 3★ Moderate Hazard (Broken lights / Isolated alley)';
      case 2: return '🛡️ 2★ Minor Concern (Infrequent issues / Low lighting)';
      case 1: return '✅ 1★ Very Low Concern (Minimal hazard)';
      default: return `${score}★ Severity`;
    }
  };

  return (
    <div className="report-page-container" style={{ maxWidth: '840px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-pill)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <span>🚨</span> Community Safety Reporting
        </div>
        <h1 className="page-title">Report a Safety Concern</h1>
        <p className="page-subtitle">
          Help protect women and fellow citizens by submitting accurate reports of unlit, isolated, or unsafe public areas in your neighborhood.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
      
      {/* Success Confirmation Card */}
      {successMsg && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#f0fdf4', borderColor: '#86efac', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
          <h2 style={{ color: '#166534', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Report Submitted Successfully
          </h2>
          <p style={{ color: '#14532d', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.55 }}>
            {successMsg}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
            <Link to="/places" className="btn btn-secondary">
              Browse Places Directory
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSuccessMsg(''); setSubmittedReportName(''); }}
            >
              + Report Another Area
            </button>
          </div>
        </div>
      )}

      {/* Safety & Trust Information Guide */}
      <div className="trust-info-card">
        <div className="trust-info-title">
          <span>🛡️</span> Safety & Moderation Workflow
        </div>
        <ul className="trust-info-list">
          <li><strong>Submitted for Review:</strong> Every reported location is verified by moderators before publishing to prevent misinformation.</li>
          <li><strong>Community Visibility:</strong> Once verified, reports appear in the public directory to warn citizens traveling through the area.</li>
          <li><strong>Democratic Ratings:</strong> Local community members can rate the safety level (1★ to 5★) to keep hazard information current.</li>
        </ul>
      </div>

      {/* Similar Report Detection Drawer */}
      {similarReport && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#eff6ff',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid #93c5fd',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0 }}>
                Existing Report Detected at This Location
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                An active safety report may already describe a similar concern at this address.
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.2rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
              🚨 {similarReport.name}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              📍 {similarReport.address}, {similarReport.district}, {similarReport.state}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
              ⭐ Community Safety Rating: <strong>{existingCommunityRating} / 5</strong> ({similarReport.rating_count || 1} community rating{similarReport.rating_count === 1 ? '' : 's'})
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            You can contribute your assessment to the existing record, or continue publishing your distinct safety concern.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRateExisting}
              disabled={ratingExisting}
            >
              {ratingExisting ? 'Submitting Rating...' : `⭐ Rate Existing Place (${formData.rating}★)`}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={publishReportDirectly}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Continue Publishing My Report'}
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
              Modify Details
            </button>
          </div>
        </div>
      )}

      {/* Guided Reporting Form */}
      <form onSubmit={handleSubmit}>
        
        {/* =========================================================================
            STEP 1 — Location Information
            ========================================================================= */}
        <section className="report-step-card" aria-label="Step 1 Location">
          <div className="step-header">
            <span className="step-badge">STEP 1</span>
            <h2 className="step-title">📍 Location Information</h2>
          </div>

          <StateDistrictSelector
            selectedState={formData.state}
            selectedDistrict={formData.district}
            onStateChange={(st) => handleFieldChange('state', st)}
            onDistrictChange={(dt) => handleFieldChange('district', dt)}
            stateLabel="State"
            districtLabel="District"
            required={true}
          />

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="address">
              Street Address & Notable Landmark <span className="required">*</span>
            </label>
            <input
              id="address"
              type="text"
              className="form-control"
              placeholder="e.g. Swaraj Round North, Near Town Hall / Aluva Metro Pillar 42"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              required
            />
            <div className="form-hint">
              Be as specific as possible with street names, junctions, or nearby landmark buildings.
            </div>
          </div>

          {/* Optional Map Coordinates / Geolocation Section */}
          <div className="form-group" style={{ marginBottom: 0, padding: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🗺️</span> Report Location (Optional)
                </span>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  How would you like to add geographic coordinates to this report?
                </p>
              </div>

              {(formData.latitude != null && formData.longitude != null) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearLocation}
                  style={{ fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  ✕ Clear Location
                </button>
              )}
            </div>

            {/* Location Method Selection Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${locationMethod === 'current' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleSelectMethod('current')}
                disabled={locating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, padding: '0.45rem 0.9rem' }}
              >
                <span>📍</span> {locating ? 'Detecting Location...' : 'Use My Current Location'}
              </button>

              <button
                type="button"
                className={`btn ${locationMethod === 'manual' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleSelectMethod('manual')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, padding: '0.45rem 0.9rem' }}
              >
                <span>🗺️</span> Choose Location Manually
              </button>
            </div>

            {/* Method 1: Current Location Display */}
            {locationMethod === 'current' && (
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {formData.latitude != null ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.85rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', color: '#065f46', fontWeight: 600 }}>
                    <span>✓</span> Current Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>
                    Click "Use My Current Location" above to capture coordinates using your device GPS.
                  </p>
                )}
              </div>
            )}

            {/* Method 2: Manual Location Selection Map */}
            {locationMethod === 'manual' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Choose a point on the map (click or tap to place pin):
                </div>

                <LocationPickerMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={handleManualMapSelect}
                  height="300px"
                />

                {formData.latitude != null ? (
                  <div style={{ marginTop: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-sm)', fontSize: '0.86rem', color: '#065f46', fontWeight: 600 }}>
                    <span>📍</span> Selected Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Tip: Click anywhere on the map to place or reposition the marker pin.
                  </div>
                )}
              </div>
            )}

            {/* Location Status Message */}
            {locationStatusMsg && (
              <div style={{ fontSize: '0.84rem', color: formData.latitude ? '#059669' : '#b45309', marginTop: '0.4rem', fontWeight: 500 }}>
                {locationStatusMsg}
              </div>
            )}

            {/* Privacy Note */}
            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
              🔒 Privacy Note: Your current location is accessed only when you explicitly choose "Use My Current Location". Manual map selection never requests device location.
            </div>
          </div>
        </section>

        {/* =========================================================================
            STEP 2 — Safety Concern & Photo
            ========================================================================= */}
        <section className="report-step-card" aria-label="Step 2 Safety Concern">
          <div className="step-header">
            <span className="step-badge">STEP 2</span>
            <h2 className="step-title">🚨 Safety Concern Details</h2>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="placeName">
              Problem Statement / Hazard Title <span className="required">*</span>
            </label>
            <input
              id="placeName"
              type="text"
              className="form-control"
              placeholder="e.g. Broken street lights / Unlit pedestrian underpass / Suspicious spot"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />
            <div className="form-hint">Summarize the core safety hazard in a concise title.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Detailed Description & Context <span className="required">*</span>
            </label>
            <textarea
              id="description"
              className="form-control"
              placeholder="Explain the hazard conditions (e.g. street completely dark after 7 PM, overgrown bushes obscuring visibility, broken sidewalk, no CCTV coverage)..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              required
              rows={4}
            />
            <div className="form-hint">Provide helpful context for commuters and community safety members.</div>
          </div>

          {/* Photo Dropzone / Upload Area */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>📷</span> Attach Photo of the Location <span className="required">*</span>
            </label>

            <input
              ref={fileInputRef}
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {!photoPreview ? (
              <div
                className="photo-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                aria-label="Upload photo of the hazard"
              >
                <div className="photo-dropzone-icon" aria-hidden="true">
                  📸
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--primary-navy)' }}>
                  Click to Upload or Drag & Drop Photo
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Supported formats: JPEG, PNG, WebP (Maximum file size: 5MB)
                </div>
              </div>
            ) : (
              <div className="photo-preview-wrap">
                <img src={photoPreview} alt="Attached Hazard Preview" className="photo-preview-img" />
                <div className="photo-preview-overlay">
                  <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✓ Photo Attached ({photoFile?.name})
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleRemovePhoto}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            STEP 3 — Initial Safety Rating
            ========================================================================= */}
        <section className="report-step-card" aria-label="Step 3 Safety Rating">
          <div className="step-header">
            <span className="step-badge">STEP 3</span>
            <h2 className="step-title">⭐ Initial Hazard Severity Rating</h2>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              Select Hazard Severity Score <span className="required">*</span>
            </label>
            <div className="rating-selector" style={{ marginBottom: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  className={`rating-btn ${formData.rating === lvl ? 'active' : ''}`}
                  onClick={() => handleFieldChange('rating', lvl)}
                  aria-pressed={formData.rating === lvl}
                  style={{ minWidth: '70px', padding: '0.65rem 0.5rem' }}
                >
                  {lvl} {lvl === 5 ? '🔥 Critical' : lvl === 4 ? '⚠️ High' : lvl === 3 ? '⚡ Medium' : lvl === 1 ? '🛡️ Minor' : '★'}
                </button>
              ))}
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              color: 'var(--primary-navy)',
              fontWeight: 600
            }}>
              Selected: {getRatingLabel(formData.rating)}
            </div>
            <div className="form-hint" style={{ marginTop: '0.35rem' }}>
              This rating acts as the initial community evaluation and will be combined with community votes.
            </div>
          </div>
        </section>

        {/* =========================================================================
            STEP 4 — Review Summary & Submit
            ========================================================================= */}
        <section className="report-step-card" aria-label="Step 4 Review & Submit">
          <div className="step-header">
            <span className="step-badge">STEP 4</span>
            <h2 className="step-title">📋 Review & Submit Report</h2>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
            Please verify your report details before submitting. All reports are queued for administrative moderation.
          </p>

          <div className="review-summary-card">
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-navy)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              Report Summary Preview
            </div>

            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Problem Statement</span>
                <span className="review-value">{formData.name || <em style={{ color: 'var(--text-muted)' }}>Not entered</em>}</span>
              </div>

              <div className="review-item">
                <span className="review-label">Location</span>
                <span className="review-value">
                  {formData.address ? `${formData.address}, ` : ''}{formData.district}, {formData.state}
                </span>
              </div>

              <div className="review-item">
                <span className="review-label">Initial Rating</span>
                <span className="review-value" style={{ color: 'var(--primary-blue)' }}>
                  ⭐ {formData.rating} / 5 ({getRatingLabel(formData.rating).split(' ')[1] || 'Severity'})
                </span>
              </div>

              <div className="review-item">
                <span className="review-label">Photo Status</span>
                <span className="review-value">
                  {photoFile ? `✓ Attached (${photoFile.name})` : <span style={{ color: '#e11d48' }}>⚠ Photo Required</span>}
                </span>
              </div>

              <div className="review-item">
                <span className="review-label">Map Coordinates</span>
                <span className="review-value">
                  {formData.latitude != null && formData.longitude != null ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ {locationMethod === 'manual' ? 'Manually Picked' : 'Captured'} ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Not attached (optional)</span>
                  )}
                </span>
              </div>

              {formData.description && (
                <div className="review-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="review-label">Description</span>
                  <span className="review-value" style={{ fontSize: '0.88rem', fontWeight: 400, color: 'var(--text-body)', lineHeight: 1.45 }}>
                    {formData.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || Boolean(similarReport)}
            style={{ fontSize: '1rem', padding: '0.85rem 1.5rem', fontWeight: 700 }}
          >
            {loading ? 'Submitting Safety Report...' : '🚀 Submit Safety Report for Review'}
          </button>
        </section>

      </form>
    </div>
  );
};

export default ReportPlacePage;

