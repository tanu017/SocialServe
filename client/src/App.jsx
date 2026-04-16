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
import DonatorDashboard from './pages/donator/DonatorDashboard';
import DonatorMyPostsPage from './pages/donator/DonatorMyPostsPage';
import DonationPostFormPage from './pages/donator/DonationPostFormPage';
import DonatorInboxPage from './pages/donator/DonatorInboxPage';
import ReceiverDashboard from './pages/receiver/ReceiverDashboard';
import ReceiverMyNeedsPage from './pages/receiver/ReceiverMyNeedsPage';
import NeedPostFormPage from './pages/receiver/NeedPostFormPage';
import ReceiverInboxPage from './pages/receiver/ReceiverInboxPage';
import AdminPlaceholder from './pages/AdminDashboard';

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
            path="/dashboard/donator"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donator/posts"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonatorMyPostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donator/posts/new"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonationPostFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donator/posts/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonationPostFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donator/messages"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonatorInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/donator/messages/:conversationId"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <DonatorInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ReceiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/needs"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ReceiverMyNeedsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/needs/new"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <NeedPostFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/needs/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <NeedPostFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/messages"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ReceiverInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/receiver/messages/:conversationId"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ReceiverInboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPlaceholder />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
