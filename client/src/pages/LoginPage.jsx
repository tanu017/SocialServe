import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState('donator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email, password);
      const userData = response.data || response;
      
      toast.success('Login successful!');
      
      // Determine redirect based on role
      const dashboardMap = {
        donator: '/dashboard/donator',
        receiver: '/dashboard/receiver',
        admin: '/admin',
      };
      
      navigate(dashboardMap[userData.role] || '/', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Login error:', err);
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
    <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2 text-[#3f3a34]">
          <span className="text-2xl leading-none">❤</span>
          <h1 className="text-4xl font-semibold tracking-tight">SocialServe</h1>
        </div>

        <div className="bg-[#f7f7f7] border border-[#e1e1e1] rounded-2xl shadow-sm px-7 py-8">
          <div className="mb-6">
            <h2 className="text-[32px] font-semibold text-[#34312d] leading-tight">Welcome Back</h2>
            <p className="text-[#6f6b67] mt-1 text-lg">Log in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#4b4743] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#ece8e4] bg-[#eeecea] px-4 py-2.5 text-[#383532] placeholder:text-[#8f8b88] focus:outline-none focus:ring-2 focus:ring-[#8b6b42]/35 focus:border-[#8b6b42]/60 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#4b4743] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#ece8e4] bg-[#eeecea] px-4 py-2.5 text-[#383532] placeholder:text-[#8f8b88] focus:outline-none focus:ring-2 focus:ring-[#8b6b42]/35 focus:border-[#8b6b42]/60 transition"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#4b4743] mb-2">I am a</p>
              <div className="space-y-1.5 text-[15px] text-[#3f3a35]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="loginAs"
                    value="donator"
                    checked={loginAs === 'donator'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="h-3.5 w-3.5 accent-[#8f6f45]"
                  />
                  Donator - I want to give
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="loginAs"
                    value="receiver"
                    checked={loginAs === 'receiver'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="h-3.5 w-3.5 accent-[#8f6f45]"
                  />
                  Receiver - I need help
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#8f6f45] hover:bg-[#7e5f3a] disabled:bg-[#b69d7d] text-white font-medium py-2.5 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[#655f59]">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-[#8f6f45] hover:text-[#7e5f3a] transition">
                Register as Donator or Receiver
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
