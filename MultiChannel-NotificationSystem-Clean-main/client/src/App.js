import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import TemplateEdit from './pages/TemplateEdit';
import Preferences from './pages/Preferences';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import TemplatePreview from './pages/TemplatePreview';
import Layout from './components/Layout';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="templates" element={<Templates />} />
        <Route
          path="templates/new"
          element={
            <PrivateRoute requireAdmin>
              <TemplateEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="templates/:id/preview"
          element={
            <PrivateRoute>
              <TemplatePreview />
            </PrivateRoute>
          }
        />
        <Route
          path="templates/:id"
          element={
            <PrivateRoute requireAdmin>
              <TemplateEdit />
            </PrivateRoute>
          }
        />
        <Route path="preferences" element={<Preferences />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notifications/:correlationId" element={<NotificationDetail />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

