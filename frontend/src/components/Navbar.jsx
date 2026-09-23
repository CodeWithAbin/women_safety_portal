import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notifications count for logged in users
  useEffect(() => {
    if (isAuthenticated && role === 'user') {
      const fetchUnread = async () => {
        try {
          const res = await notificationService.getNotifications();
          if (res.success) {
            setUnreadCount(res.unreadCount || 0);
          }
        } catch (err) {
          // Graceful silent fallback
        }
      };

      fetchUnread();
    }
  }, [isAuthenticated, role, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-content">
        <Link 
          to={role === 'admin' ? '/admin/dashboard' : isAuthenticated ? '/dashboard' : '/login'} 
          className="brand-logo"
          onClick={closeMenu}
        >
          <span style={{ fontSize: '1.35rem' }}>🛡️</span>
          <span>Women Safety Portal</span>
          {role === 'admin' && <span className="badge badge-admin">Admin</span>}
        </Link>

        <nav>
          <ul className="nav-links">
            {isAuthenticated ? (
              role === 'admin' ? (
                /* Admin Navigation Links */
                <>
                  <li>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Overview
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Review Reports
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Hazardous Places
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Users
                    </NavLink>
                  </li>
                  <li style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </span>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                /* Standard User Navigation Links */
                <>
                  <li>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Browse Places
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Report Place
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                      Notifications
                      {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </NavLink>
                  </li>
                  <li style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                      {user.name}
                    </span>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                      Logout
                    </button>
                  </li>
                </>
              )
            ) : (
              /* Public Links */
              <>
                <li>
                  <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                    Sign In
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                    Create Account
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
