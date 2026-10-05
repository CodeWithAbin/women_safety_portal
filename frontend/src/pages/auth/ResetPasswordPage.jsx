import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import AlertBanner from '../../components/AlertBanner';
import { IconLock, IconCheckCircle, IconClock, IconRefresh, IconArrowLeft } from '../../components/Icons';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(location.state?.infoMessage || '');
  const [resendSuccess, setResendSuccess] = useState('');

  // 15-minute Countdown Timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Password strength evaluation
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'var(--border-light)' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
    return { score, label: 'Strong', color: '#10b981' };
  };

  const strength = calculateStrength(newPassword);

  // Step 1: Verify 6-digit code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setResendSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.verifyResetCode(trimmedEmail, trimmedCode);
      const token = res.data?.reset_token;
      if (!token) {
        throw new Error('Verification failed: No reset authorization token received.');
      }
      setResetToken(token);
      setIsCodeVerified(true);
      setInfoMessage('Verification code confirmed. Please set your new password below.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResendCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address first.');
      return;
    }

    setError('');
    setResendSuccess('');
    setResending(true);

    try {
      await authService.forgotPassword(trimmedEmail);
      setTimeLeft(900);
      setIsCodeVerified(false);
      setResetToken('');
      setCode('');
      setResendSuccess('A new 6-digit verification code has been dispatched.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!resetToken) {
      setError('Reset authorization missing or expired. Please verify your code again.');
      setIsCodeVerified(false);
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email.trim().toLowerCase(), resetToken, newPassword);
      navigate('/login', {
        state: {
          email: email.trim().toLowerCase(),
          successMessage: 'Password has been reset successfully! You can now sign in with your new password.'
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Password reset failed. Please restart the process.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 0.75rem',
            backgroundColor: isCodeVerified ? 'rgba(16, 185, 129, 0.12)' : 'var(--primary-blue-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s ease'
          }}>
            {isCodeVerified ? (
              <IconCheckCircle size={28} color="#10b981" />
            ) : (
              <IconLock size={28} color="var(--primary-blue)" />
            )}
          </div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
            {isCodeVerified ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            {isCodeVerified
              ? 'Choose a strong new password for your account'
              : 'Enter the 6-digit verification code sent to your email'}
          </p>
        </div>

        {infoMessage && <AlertBanner type="info" message={infoMessage} onDismiss={() => setInfoMessage('')} />}
        {resendSuccess && <AlertBanner type="success" message={resendSuccess} onDismiss={() => setResendSuccess('')} />}
        {error && <AlertBanner type="error" message={error} onDismiss={() => setError('')} />}

        {!isCodeVerified ? (
          // ================= STEP 1: VERIFY CODE =================
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">
                Registered Email Address <span className="required">*</span>
              </label>
              <input
                id="reset-email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="otp-code" style={{ marginBottom: 0 }}>
                  6-Digit Verification Code <span className="required">*</span>
                </label>
                <span style={{ fontSize: '0.8rem', color: timeLeft > 60 ? 'var(--text-muted)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  <IconClock size={13} /> {formatTimer(timeLeft)}
                </span>
              </div>
              <input
                id="otp-code"
                type="text"
                className="form-control"
                placeholder="• • • • • •"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                maxLength={6}
                required
                autoFocus
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '0.45rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || code.length !== 6 || timeLeft <= 0}
              style={{ marginTop: '1.25rem' }}
            >
              {loading ? 'Verifying Code...' : 'Verify Code & Proceed'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-blue)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0
                }}
              >
                <IconRefresh size={14} /> {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        ) : (
          // ================= STEP 2: SET NEW PASSWORD =================
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Interactive Strength Meter */}
              {newPassword && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        style={{
                          height: '4px',
                          flex: 1,
                          borderRadius: '2px',
                          backgroundColor: level <= strength.score ? strength.color : 'var(--border-light)',
                          transition: 'background-color 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: strength.color, fontWeight: 600 }}>
                    Password Strength: {strength.label}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">
                Confirm New Password <span className="required">*</span>
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
              style={{ marginTop: '1.25rem' }}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.92rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              color: 'var(--primary-blue)',
              textDecoration: 'none'
            }}
          >
            <IconArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
