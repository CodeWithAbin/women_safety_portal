import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const { isAuthenticated, role } = useAuth();

  const homeRoute = !isAuthenticated ? '/login' : role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={homeRoute} className="btn btn-primary">
        Return to Portal
      </Link>
    </div>
  );
};

export default NotFoundPage;
