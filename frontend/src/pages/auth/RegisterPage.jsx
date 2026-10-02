import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import StateDistrictSelector from '../../components/StateDistrictSelector';
import AlertBanner from '../../components/AlertBanner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    state: '',
    district: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.state || !formData.district) {
      setError('Please select both your State and District.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.register(formData);
      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 0.75rem',
            backgroundColor: 'var(--primary-blue-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem'
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
            Citizen Registration
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            Join the Women Safety Portal to report and view unsafe places
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}
        {successMsg && <AlertBanner type="success" message={successMsg} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder="e.g. Ananya Sharma"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              minLength={6}
            />
          </div>

          <StateDistrictSelector
            selectedState={formData.state}
            selectedDistrict={formData.district}
            onStateChange={(st) => handleChange('state', st)}
            onDistrictChange={(dt) => handleChange('district', dt)}
            required={true}
          />

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Phone Number <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || !!successMsg}
            style={{ marginTop: '1.25rem' }}
          >
            {loading ? 'Creating Account...' : 'Register & Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

