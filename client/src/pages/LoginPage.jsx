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
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-base text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5 text-foreground">
          <HeartLogoIcon className="h-7 w-7 shrink-0 text-primary" />
          <h1 className="text-2xl font-medium tracking-tight">SocialServe</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm dark:shadow-none">
          <div className="mb-8 space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl font-medium text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Log in to your account to continue
            </p>
          </div>

          {error && (
            <div
              className="mb-6 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 dark:border-destructive/40 dark:bg-destructive/15"
              role="alert"
            >
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-input px-3 py-2.5 text-base font-normal text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-primary/40"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-foreground">I am a</legend>
              <div className="space-y-3 text-base text-foreground">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="loginAs"
                    value="donator"
                    checked={loginAs === 'donator'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="h-4 w-4 shrink-0 border-border text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background"
                  />
                  <span className="font-normal">Donator - I want to give</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="loginAs"
                    value="receiver"
                    checked={loginAs === 'receiver'}
                    onChange={(e) => setLoginAs(e.target.value)}
                    className="h-4 w-4 shrink-0 border-border text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-background"
                  />
                  <span className="font-normal">Receiver - I need help</span>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin text-primary-foreground"
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
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-accent transition-colors hover:text-accent/90 focus:outline-none focus-visible:underline"
            >
              Register as Donator or Receiver
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
