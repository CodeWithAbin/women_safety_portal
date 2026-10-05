import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { IconShieldCheck, IconMenu, IconX } from './Icons';

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
          <div className="brand-icon-wrap">
            <IconShieldCheck size={20} color="var(--primary-blue)" />
          </div>
          <span>Women Safety Portal</span>
          {role === 'admin' && <span className="badge badge-admin">Admin</span>}
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <ul className="nav-links">
            {isAuthenticated ? (
              role === 'admin' ? (
                /* Admin Navigation Links */
                <>
                  <li>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Overview
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Review Reports
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Reported Places
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/safety-information" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Safety Info
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Users
                    </NavLink>
                  </li>
                  <li style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {user?.email}
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
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/safe-walk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Safe Walk
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Browse Places
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/safety-information" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Safety Info
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/my-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      My Reports
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Report Place
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Notifications
                      {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </NavLink>
                  </li>
                  <li style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>
                      {user?.name}
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
                  <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Sign In
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className="btn btn-primary btn-sm">
                    Create Account
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {isAuthenticated ? (
            role === 'admin' ? (
              <>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Overview
                </NavLink>
                <NavLink to="/admin/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Review Reports
                </NavLink>
                <NavLink to="/admin/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Reported Places
                </NavLink>
                <NavLink to="/admin/safety-information" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Safety Info
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Users
                </NavLink>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Dashboard
                </NavLink>
                <NavLink to="/safe-walk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Safe Walk
                </NavLink>
                <NavLink to="/places" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Browse Places
                </NavLink>
                <NavLink to="/safety-information" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Safety Info
                </NavLink>
                <NavLink to="/my-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  My Reports
                </NavLink>
                <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Report Place
                </NavLink>
                <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </NavLink>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-navy)' }}>{user?.name}</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    Logout
                  </button>
                </div>
              </>
            )
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Sign In
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Create Account
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;


