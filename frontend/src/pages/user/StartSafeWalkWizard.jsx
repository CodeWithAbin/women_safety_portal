import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companionService, safeWalkService } from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  IconMapPin,
  IconClock,
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconNavigation,
  IconSearch,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconX,
  IconPhone,
  IconCompass,
  IconLock,
  IconWalker
} from '../../components/Icons';

const StartSafeWalkWizard = ({ onSwitchToCompanions }) => {
  const navigate = useNavigate();

  // Wizard Step (1: Destination, 2: Arrival, 3: Companion, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [destination, setDestination] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Duration / Expected Arrival
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customArrivalTime, setCustomArrivalTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);

  // Companion Selection
  const [companions, setCompanions] = useState([]);
  const [selectedCompanionId, setSelectedCompanionId] = useState(null);
  const [loadingCompanions, setLoadingCompanions] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch accepted companions on mount
  useEffect(() => {
    const loadCompanions = async () => {
      setLoadingCompanions(true);
      try {
        const res = await companionService.getAcceptedCompanions();
        if (res.success && Array.isArray(res.data)) {
          setCompanions(res.data);
          if (res.data.length > 0) {
            setSelectedCompanionId(res.data[0].companion_id);
          }
        }
      } catch (err) {
        console.warn('Failed to load companions:', err);
      } finally {
        setLoadingCompanions(false);
      }
    };

    loadCompanions();
  }, []);

  // Handle GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));
        setStartCoords({ latitude: lat, longitude: lon });
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === 1
            ? 'Location access was not granted. Start coordinates are optional.'
            : 'Could not fetch current coordinates. You can continue without it.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Helper to calculate expected arrival formatted string
  const getExpectedArrivalDisplay = () => {
    if (useCustomTime && customArrivalTime) {
      const d = new Date(customArrivalTime);
      return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }
    const target = new Date(Date.now() + durationMinutes * 60 * 1000);
    return `${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (in ~${durationMinutes} mins)`;
  };

  // Find selected companion object
  const selectedCompanion = companions.find((c) => c.companion_id === selectedCompanionId);

  // Step Navigators with Validation
  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!destination.trim()) {
        setErrorMsg('Please enter your journey destination.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (useCustomTime && !customArrivalTime) {
        setErrorMsg('Please select a valid expected arrival time.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedCompanionId) {
        setErrorMsg('Please choose an accepted companion for this journey.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Submit
  const handleStartSafeWalk = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        destination: destination.trim(),
        companion_id: selectedCompanionId,
        start_latitude: startCoords ? startCoords.latitude : null,
        start_longitude: startCoords ? startCoords.longitude : null
      };

      if (useCustomTime && customArrivalTime) {
        payload.expected_arrival = new Date(customArrivalTime).toISOString();
      } else {
        payload.expected_duration_minutes = durationMinutes;
      }

      const res = await safeWalkService.createSafeWalk(payload);
      if (res.success) {
        navigate('/safe-walk/active');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to start Safe Walk journey.';
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="safewalk-card">
      {errorMsg && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
        </div>
      )}

      {/* Stepper Header */}
      <div className="safewalk-stepper" aria-label="Safe Walk Progress">
        <div className={`safewalk-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
          <div className="safewalk-step-circle">{currentStep > 1 ? <IconCheck size={14} /> : '1'}</div>
          <span className="safewalk-step-label">Destination</span>
        </div>

        <div className={`safewalk-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
          <div className="safewalk-step-circle">{currentStep > 2 ? <IconCheck size={14} /> : '2'}</div>
          <span className="safewalk-step-label">Arrival Time</span>
        </div>

        <div className={`safewalk-step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
          <div className="safewalk-step-circle">{currentStep > 3 ? <IconCheck size={14} /> : '3'}</div>
          <span className="safewalk-step-label">Companion</span>
        </div>

        <div className={`safewalk-step-item ${currentStep === 4 ? 'active' : ''}`}>
          <div className="safewalk-step-circle">4</div>
          <span className="safewalk-step-label">Review</span>
        </div>
      </div>

      {/* =========================================================================
          STEP 1: Destination & Optional Start Location
          ========================================================================= */}
      {currentStep === 1 && (
        <section aria-label="Step 1: Destination">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconMapPin size={22} color="var(--primary-blue)" /> Where are you going?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Enter your final destination so your companion knows where your journey ends.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="destination-input">
              Destination <span style={{ color: 'var(--hazard-high)' }}>*</span>
            </label>
            <div className="input-icon-wrap">
              <span className="input-icon">
                <IconMapPin size={18} />
              </span>
              <input
                id="destination-input"
                type="text"
                className="form-control"
                placeholder="e.g. Central Metro Station, Campus Hostel, MG Road"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Optional Start Location */}
          <div className="form-group" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <label className="form-label" style={{ marginBottom: '0.35rem' }}>
              Starting Location (Optional)
            </label>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Sharing your start point provides initial journey context to your companion.
            </p>

            {startCoords ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--primary-navy)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <IconMapPin size={15} /> Coordinates: {startCoords.latitude}, {startCoords.longitude}
                </span>
                <button
                  type="button"
                  onClick={() => setStartCoords(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--hazard-high)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <IconX size={14} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetLocation}
                disabled={locating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconNavigation size={15} /> {locating ? 'Capturing Location...' : 'Use Current GPS Location'}
              </button>
            )}

            {locationError && (
              <div style={{ marginTop: '0.5rem', color: '#92400e', fontSize: '0.82rem' }}>
                {locationError}
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={!destination.trim()}
              style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Continue <IconArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          STEP 2: Expected Arrival
          ========================================================================= */}
      {currentStep === 2 && (
        <section aria-label="Step 2: Expected Arrival">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconClock size={22} color="var(--primary-blue)" /> When do you expect to arrive?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Your companion will be able to see when your journey is expected to finish.
            </p>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Quick Duration Selection
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`safewalk-pill-btn ${!useCustomTime && durationMinutes === mins ? 'active' : ''}`}
                  onClick={() => {
                    setDurationMinutes(mins);
                    setUseCustomTime(false);
                  }}
                >
                  ~{mins} mins
                </button>
              ))}
              <button
                type="button"
                className={`safewalk-pill-btn ${useCustomTime ? 'active' : ''}`}
                onClick={() => setUseCustomTime(true)}
              >
                Custom Time
              </button>
            </div>
          </div>

          {useCustomTime && (
            <div className="form-group" style={{ marginBottom: '1.5rem', maxWidth: '340px' }}>
              <label className="form-label" htmlFor="custom-time-input">
                Select Specific Date & Time
              </label>
              <input
                id="custom-time-input"
                type="datetime-local"
                className="form-control"
                value={customArrivalTime}
                onChange={(e) => setCustomArrivalTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Expected Arrival Preview */}
          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IconClock size={22} color="var(--primary-blue)" />
            <div>
              <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 600, display: 'block' }}>
                Estimated Expected Arrival:
              </span>
              <strong style={{ fontSize: '1rem', color: '#1e3a8a' }}>
                {getExpectedArrivalDisplay()}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrevStep} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNextStep} style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Continue <IconArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          STEP 3: Choose Companion
          ========================================================================= */}
      {currentStep === 3 && (
        <section aria-label="Step 3: Choose Companion">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconUserCheck size={22} color="var(--primary-blue)" /> Choose a Community Companion
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Select one accepted companion who will be notified about this active journey.
            </p>
          </div>

          {loadingCompanions ? (
            <LoadingSpinner message="Loading your companions..." />
          ) : companions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fef3c7' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <IconUsers size={36} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e', marginBottom: '0.4rem' }}>
                You don't have a community companion yet.
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#b45309', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                A Safe Walk requires an accepted companion. Connect with a registered user first.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSwitchToCompanions}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconSearch size={16} /> Find a Companion
              </button>
            </div>
          ) : (
            <div className="companion-grid" style={{ marginBottom: '1.5rem' }}>
              {companions.map((comp) => {
                const isSelected = selectedCompanionId === comp.companion_id;
                const name = comp.companion_name || 'Companion';
                const email = comp.companion_email || '';
                const phone = comp.companion_phone || '';

                return (
                  <div
                    key={comp.id}
                    className={`companion-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCompanionId(comp.companion_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <input
                        type="radio"
                        name="companion-select"
                        checked={isSelected}
                        onChange={() => setSelectedCompanionId(comp.companion_id)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                          {name}
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{email}</span>
                        {phone && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <IconPhone size={13} /> {phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrevStep} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextStep}
              disabled={companions.length === 0 || !selectedCompanionId}
              style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Review Walk <IconArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          STEP 4: Review and Start Safe Walk
          ========================================================================= */}
      {currentStep === 4 && (
        <section aria-label="Step 4: Review and Confirm">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <IconShieldCheck size={22} color="var(--primary-blue)" /> Safe Walk Summary
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Please review your journey details before starting the session.
            </p>
          </div>

          <div className="safewalk-summary-box" style={{ marginBottom: '1.5rem' }}>
            <div className="safewalk-summary-row">
              <span className="safewalk-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconMapPin size={15} /> Destination
              </span>
              <span className="safewalk-summary-value">{destination}</span>
            </div>

            <div className="safewalk-summary-row">
              <span className="safewalk-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconClock size={15} /> Expected Arrival
              </span>
              <span className="safewalk-summary-value">{getExpectedArrivalDisplay()}</span>
            </div>

            <div className="safewalk-summary-row">
              <span className="safewalk-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconUserCheck size={15} /> Community Companion
              </span>
              <span className="safewalk-summary-value">
                {selectedCompanion?.companion_name || 'Selected User'} ({selectedCompanion?.companion_email || ''})
              </span>
            </div>

            <div className="safewalk-summary-row">
              <span className="safewalk-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IconCompass size={15} /> Start Location
              </span>
              <span className="safewalk-summary-value">
                {startCoords ? `${startCoords.latitude}, ${startCoords.longitude}` : 'Not specified'}
              </span>
            </div>
          </div>

          {/* Privacy & Trust Notice */}
          <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem', fontSize: '0.86rem', color: '#166534', lineHeight: 1.55, display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
            <IconLock size={16} style={{ marginTop: '2px' }} />
            <div>
              <strong>Privacy Guarantee:</strong> Your journey information is shared only with your selected companion while the Safe Walk is active. Sharing stops immediately once the journey is completed or cancelled.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrevStep} disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartSafeWalk}
              disabled={submitting}
              style={{ minWidth: '160px', padding: '0.75rem 1.5rem', fontSize: '0.98rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <IconWalker size={18} /> {submitting ? 'Starting Journey...' : 'Start Safe Walk'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default StartSafeWalkWizard;

