import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import UserDashboard from './pages/user/UserDashboard';
import BrowsePlacesPage from './pages/user/BrowsePlacesPage';
import ReportedPlaceDetailsPage from './pages/user/ReportedPlaceDetailsPage';
import ReportPlacePage from './pages/user/ReportPlacePage';
import MyReportsPage from './pages/user/MyReportsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import SafeWalkPage from './pages/user/SafeWalkPage';
import ActiveSafeWalkPage from './pages/user/ActiveSafeWalkPage';
import SafetyInfoPage from './pages/user/SafetyInfoPage';
import CommunityChatPage from './pages/community/CommunityChatPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageReportsPage from './pages/admin/ManageReportsPage';
import ManagePlacesPage from './pages/admin/ManagePlacesPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageSafetyInfoPage from './pages/admin/ManageSafetyInfoPage';
import NotFoundPage from './pages/NotFoundPage';

// Root Index Redirector
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Shared Authenticated Routes */}
          <Route
            path="/community"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <CommunityChatPage />
              </ProtectedRoute>
            }
          />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safe-walk"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <SafeWalkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safe-walk/active"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <ActiveSafeWalkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <BrowsePlacesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/places/:id"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <ReportedPlaceDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <ReportPlacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safety-information"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <SafetyInfoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/places"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagePlacesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/safety-information"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageSafetyInfoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
