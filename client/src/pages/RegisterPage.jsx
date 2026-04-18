import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getPublicPlatform } from '../services/platformService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user, loading } = useAuth();

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organizationName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicPlatform();
        const data = res?.data?.data ?? res?.data;
        if (!cancelled && data && typeof data.allowRegistration === 'boolean') {
          setRegistrationOpen(data.allowRegistration);
        }
      } catch {
        /* ignore — banner / server message still applies */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dashboardMap = {
        donator: '/dashboard/donator',
        receiver: '/dashboard/receiver',
        admin: '/admin',
      };
      navigate(dashboardMap[user.role] || '/', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!role) {
      setError('Please select your role');
      return;
    }

    const { name, email, password, confirmPassword, phone } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Name, email, password, and confirm password are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (role === 'receiver' && !formData.organizationName) {
      setError('Organization name is required for receivers');
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = {
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      };

      if (role === 'receiver' && formData.organizationName) {
        registrationData.organizationName = formData.organizationName;
      }

      const response = await register(registrationData);
      const userData = response.data || response;

      toast.success('Account created successfully!');

      // Determine redirect based on role
      const dashboardMap = {
        donator: '/dashboard/donator',
        receiver: '/dashboard/receiver',
        admin: '/admin',
      };

      navigate(dashboardMap[userData.role] || '/', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full mx-auto mt-20 bg-white rounded-2xl border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">SocialServe</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
        </div>

        {/* Role Selector */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-4">Select your role</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Donor Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('donator')}
              className={`p-4 rounded-lg border-2 transition ${
                role === 'donator'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🎁</div>
              <div className="text-sm font-semibold text-gray-900">I'm a Donor</div>
              <div className="text-xs text-gray-600 mt-1">I have items to donate</div>
            </button>

            {/* Receiver Card */}
            <button
              type="button"
              onClick={() => handleRoleSelect('receiver')}
              className={`p-4 rounded-lg border-2 transition ${
                role === 'receiver'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-sm font-semibold text-gray-900">I'm a Receiver</div>
              <div className="text-xs text-gray-600 mt-1">Need donations</div>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {!registrationOpen && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm font-medium text-amber-900">New registrations are temporarily disabled.</p>
            <p className="mt-1 text-xs text-amber-800">
              Please try again later or{' '}
              <Link to="/login" className="font-medium underline">
                sign in
              </Link>{' '}
              if you already have an account.
            </p>
          </div>
        )}

        {/* Form - Only show if role is selected */}
        {role && registrationOpen && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password (min 6 characters)
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone (optional)
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* Organization Name - Only for Receivers */}
            {role === 'receiver' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name (required)
                </label>
                <input
                  id="organizationName"
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Your organization name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-700">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-green-600 hover:text-green-700 font-medium transition"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
