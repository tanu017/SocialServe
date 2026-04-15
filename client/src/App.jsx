import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Pages
import HomePage from './pages/public/HomePage';
import BrowseDonationsPage from './pages/public/BrowseDonationsPage';
import BrowseNeedsPage from './pages/public/BrowseNeedsPage';
import DonationDetailPage from './pages/public/DonationDetailPage';
import NeedDetailPage from './pages/public/NeedDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicProfilePage from './pages/PublicProfilePage';
import DonatorDashboard from './pages/DonatorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar />
      <div className="pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/browse/donations" element={<BrowseDonationsPage />} />
          <Route path="/browse/needs" element={<BrowseNeedsPage />} />
          <Route path="/posts/donation/:id" element={<DonationDetailPage />} />
          <Route path="/posts/need/:id" element={<NeedDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:id" element={<PublicProfilePage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard/donator/*"
            element={
              <ProtectedRoute>
                <DonatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/*"
            element={
              <ProtectedRoute>
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
