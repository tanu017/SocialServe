import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, loading } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'donator':
        return '/dashboard/donator';
      case 'receiver':
        return '/dashboard/receiver';
      case 'admin':
        return '/admin';
      default:
        return '/dashboard/donator';
    }
  };

  const getDashboardLabel = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Panel';
      default:
        return 'My Dashboard';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-xl font-bold text-[#1D9E75]">SocialServe</span>
        </Link>

        {/* Center Navigation - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/browse/donations"
            className={`${
              isActive('/browse/donations')
                ? 'text-green-600 font-medium'
                : 'text-gray-600 hover:text-green-600'
            } transition-colors`}
          >
            Browse Donations
          </Link>
          <Link
            to="/browse/needs"
            className={`${
              isActive('/browse/needs')
                ? 'text-green-600 font-medium'
                : 'text-gray-600 hover:text-green-600'
            } transition-colors`}
          >
            Browse Needs
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {!loading && (
            <>
              {!isAuthenticated ? (
                // Not logged in
                <div className="hidden sm:flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Register
                  </button>
                </div>
              ) : (
                // Logged in
                <div className="hidden sm:flex items-center space-x-4">
                  <Link
                    to={getDashboardLink()}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    {getDashboardLabel()}
                  </Link>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-semibold">
                        {getInitials()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col space-y-1.5 p-2"
          >
            <div className="w-6 h-0.5 bg-gray-800"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Nav Links */}
            <Link
              to="/browse/donations"
              className={`block py-2 ${
                isActive('/browse/donations')
                  ? 'text-green-600 font-medium'
                  : 'text-gray-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Donations
            </Link>
            <Link
              to="/browse/needs"
              className={`block py-2 ${
                isActive('/browse/needs')
                  ? 'text-green-600 font-medium'
                  : 'text-gray-600'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Needs
            </Link>

            <div className="border-t border-gray-200 pt-3">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Register
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to={getDashboardLink()}
                    className="block py-2 text-gray-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {getDashboardLabel()}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
