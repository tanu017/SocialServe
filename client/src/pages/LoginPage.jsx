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
  const pageStyle = {
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f3f3',
    padding: '16px',
  };

  const wrapperStyle = {
    width: '90%',
    maxWidth: '600px',
  };

  const brandStyle = {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#3f3a34',
  };

  const cardStyle = {
    background: '#f7f7f7',
    border: '1px solid #e1e1e1',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(38, 35, 31, 0.08)',
    paddingTop: '28px',
    paddingBottom: '28px',
    paddingLeft: '24px',
    paddingRight: '24px',
    margin: '10px',
    boxSizing: 'border-box',
  };

  const controlStyle = {
    borderRadius: '5px',
    padding: '15px',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  };

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
    <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] px-4" style={pageStyle}>
      <div className="w-full max-w-md" style={wrapperStyle}>
        <div className="mb-8 flex items-center justify-center gap-2 text-[#3f3a34]" style={brandStyle}>
          <span className="text-[40px] leading-none">❤</span>
          <h1 className="text-[60px] font-semibold tracking-tight">SocialServe</h1>
        </div>

        <div className="bg-[#f7f7f7] border border-[#e1e1e1] rounded-2xl shadow-sm px-3 py-4" style={cardStyle}>
          <div className="mb-2">
            <h2 className="text-[35px] font-semibold text-[#34312d] leading-tight">Welcome Back</h2>
            <p className="text-[#6f6b67] mt-1 text-lg">Log in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-[18px] font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label htmlFor="email" className="block text-[20px] font-semibold text-[#4b4743] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#ece8e4] bg-[#FBF4F0] px-4 py-2.5 text-[18px] placeholder:text-[18px] text-[#383532] placeholder:text-[#8f8b88] focus:outline-none focus:ring-2 focus:ring-[#8b6b42]/35 mb-6 focus:border-[#8b6b42]/60 transition mt-10px"
                style={controlStyle}
              />
            </div>
            <br />
            <div>
              <label htmlFor="password" className="block text-[20px] font-semibold text-[#4b4743] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#ece8e4] bg-[#FBF4F0] px-4 py-2.5 text-[#383532] placeholder:text-[#8f8b88] focus:outline-none focus:ring-2 focus:ring-[#8b6b42]/35 focus:border-[#8b6b42]/60 transition"
                style={controlStyle}
              />
            </div>

            <div>
              <p className="text-[18px] font-semibold text-[#4b4743] mb-2">I am a</p>
              <div className="space-y-0 text-[20px] text-[#3f3a35]">
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
              className="w-full rounded-2xl bg-[#94734a] hover:bg-[#7e5f3a] disabled:bg-[#b69d7d] text-[18px] font-medium py-2.5 transition flex items-center justify-center gap-2"
              style={controlStyle}
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
