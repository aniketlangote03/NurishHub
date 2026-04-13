import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { DonationProvider } from './context/DonationContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Toast from './components/ui/Toast';
import FloatingShapes from './components/ui/FloatingShapes';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonationListing from './pages/DonationListing';
import AddEditDonation from './pages/AddEditDonation';
import NgoRequest from './pages/NgoRequest';
import VolunteerPickup from './pages/VolunteerPickup';
import AdminPanel from './pages/AdminPanel';
import Chat from './pages/Chat';
import Feedback from './pages/Feedback';
import MapDashboard from './pages/MapDashboard';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/donations" element={
          <ProtectedRoute><DonationListing /></ProtectedRoute>
        } />
        <Route path="/donations/new" element={
          <ProtectedRoute roles={['donor', 'admin']}><AddEditDonation /></ProtectedRoute>
        } />
        <Route path="/donations/:id" element={
          <ProtectedRoute><DonationListing /></ProtectedRoute>
        } />
        <Route path="/requests" element={
          <ProtectedRoute roles={['ngo', 'admin', 'donor']}><NgoRequest /></ProtectedRoute>
        } />
        <Route path="/pickups" element={
          <ProtectedRoute roles={['volunteer', 'admin']}><VolunteerPickup /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute><Feedback /></ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute><MapDashboard /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <DonationProvider>
              <Router>
                <FloatingShapes />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <AppRoutes />
                  <Toast />
                </div>
              </Router>
            </DonationProvider>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
