import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function HeartLogoIcon({ className }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading, clearLocalSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState('donator');
  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [authFailed, setAuthFailed] = useState(false);

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

  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setBannerError('');
    setAuthFailed(false);
  };

  const validateForm = () => {
    const next = { email: '', password: '' };
    const trimmed = email.trim();

    if (!trimmed) {
      next.email = 'Enter your email address.';
    } else if (!emailRegex.test(trimmed)) {
      next.email = 'Enter a valid email address.';
    }

    if (!password) {
      next.password = 'Enter your password.';
    }

    setFieldErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError('');
    setAuthFailed(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const body = await login(email.trim(), password);
      const userPayload = body?.user ?? body?.data?.user;

      if (!userPayload?._id) {
        clearLocalSession();
        setBannerError('Something went wrong. Please try again.');
        return;
      }

      if (userPayload.role === 'admin') {
        toast.success('Welcome back.');
        navigate('/admin', { replace: true });
        return;
      }

      if (userPayload.role !== 'admin' && userPayload.role !== loginAs) {
        clearLocalSession();
        const isDonator = userPayload.role === 'donator';
        setBannerError(
          isDonator
            ? 'This account is registered as a Donator. Select “Donator – I want to give” and try again.'
            : 'This account is registered as a Receiver. Select “Receiver – I need help” and try again.'
        );
        return;
      }

      toast.success('Welcome back.');
      const dashboardMap = {
        donator: '/dashboard/donator',
        receiver: '/dashboard/receiver',
        admin: '/admin',
      };
      navigate(dashboardMap[userPayload.role] || '/', { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || '';

      if (status === 401 || /invalid email or password/i.test(msg)) {
        setAuthFailed(true);
        setBannerError(
          'We couldn’t sign you in. Check your email and password and try again.'
        );
      } else if (status === 400) {
        setBannerError(msg || 'Please check your details and try again.');
      } else {
        setBannerError(
          msg || 'Something went wrong. Please try again in a moment.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const emailInputClass = `${inputBase} ${
    fieldErrors.email || authFailed
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-200 focus:border-green-600 focus:ring-green-500/25'
  }`;

  const passwordInputClass = `${inputBase} ${
    fieldErrors.password || authFailed
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-200 focus:border-green-600 focus:ring-green-500/25'
  }`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-base text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5 text-gray-900">
          <HeartLogoIcon className="h-7 w-7 shrink-0 text-green-600" />
          <h1 className="text-2xl font-semibold tracking-tight">SocialServe</h1>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-600">Log in to your account to continue.</p>
          </div>

          {bannerError ? (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {bannerError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="you@example.com"
                className={emailInputClass}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="text-xs text-red-600" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                placeholder="••••••••"
                className={passwordInputClass}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? (
                <p id="password-error" className="text-xs text-red-600" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <fieldset className="space-y-3 border-0 p-0">
              <legend className="mb-3 block text-sm font-medium text-gray-800">I am a</legend>
              <div className="space-y-3 text-sm text-gray-800">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 transition-colors hover:bg-gray-50">
                  <input
                    type="radio"
                    name="loginAs"
                    value="donator"
                    checked={loginAs === 'donator'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-green-600 accent-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-0"
                  />
                  <span>Donator — I want to give</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 transition-colors hover:bg-gray-50">
                  <input
                    type="radio"
                    name="loginAs"
                    value="receiver"
                    checked={loginAs === 'receiver'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer border-gray-300 text-green-600 accent-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-0"
                  />
                  <span>Receiver — I need help</span>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Must match how you registered. Wrong choice? You’ll see a message after you sign in.
              </p>
            </fieldset>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-green-700 transition-colors hover:text-green-800 focus:outline-none focus-visible:underline"
            >
              Register as Donator or Receiver
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
