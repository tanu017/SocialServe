import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/routing/ProtectedRoute';
import BrowseRoleGuard from './components/routing/BrowseRoleGuard';

// Pages
import HomePage from './pages/public/HomePage';
import BrowseDonationsPage from './pages/public/BrowseDonationsPage';
import BrowseNeedsPage from './pages/public/BrowseNeedsPage';
import DonationDetailPage from './pages/public/DonationDetailPage';
import NeedDetailPage from './pages/public/NeedDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import DonatorDashboard from './pages/donator/DonatorDashboard';
import DonatorMyPostsPage from './pages/donator/DonatorMyPostsPage';
import DonationPostFormPage from './pages/donator/DonationPostFormPage';
import DonatorInboxPage from './pages/donator/DonatorInboxPage';
import ReceiverDashboard from './pages/receiver/ReceiverDashboard';
import ReceiverMyNeedsPage from './pages/receiver/ReceiverMyNeedsPage';
import NeedPostFormPage from './pages/receiver/NeedPostFormPage';
import ReceiverInboxPage from './pages/receiver/ReceiverInboxPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserListPage from './pages/admin/AdminUserListPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminDonationsPage from './pages/admin/AdminDonationsPage';
import AdminNeedsPage from './pages/admin/AdminNeedsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import PlatformBanner from './components/common/PlatformBanner';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '10px', fontSize: '14px' },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
      <Navbar />
      <div className="pt-16">
        <PlatformBanner />
        <ErrorBoundary>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/browse/donations"
            element={
              <BrowseRoleGuard forbiddenRoles={['donator']} redirectTo="/browse/needs">
                <BrowseDonationsPage />
              </BrowseRoleGuard>
            }
          />
          <Route
            path="/browse/needs"
            element={
              <BrowseRoleGuard forbiddenRoles={['receiver']} redirectTo="/browse/donations">
                <BrowseNeedsPage />
              </BrowseRoleGuard>
            }
          />
          <Route
            path="/posts/donation/:id"
            element={
              <BrowseRoleGuard forbiddenRoles={['donator']} redirectTo="/browse/needs">
                <DonationDetailPage />
              </BrowseRoleGuard>
            }
          />
          <Route
            path="/posts/need/:id"
            element={
              <BrowseRoleGuard forbiddenRoles={['receiver']} redirectTo="/browse/donations">
                <NeedDetailPage />
              </BrowseRoleGuard>
            }
          />
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
            path="/dashboard/donator/profile"
            element={
              <ProtectedRoute allowedRoles={['donator']}>
                <ProfilePage />
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
            path="/dashboard/receiver/profile"
            element={
              <ProtectedRoute allowedRoles={['receiver']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/donations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDonationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/needs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminNeedsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
