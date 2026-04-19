import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';

export default function PendingVerificationPage() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (canUseMessagingAndPosting(user)) {
      const dest =
        user.role === 'receiver' ? '/dashboard/receiver' : user.role === 'donator' ? '/dashboard/donator' : '/';
      navigate(dest, { replace: true });
    }
  }, [loading, user, navigate]);

  const profileLink =
    user?.role === 'receiver'
      ? '/dashboard/receiver/profile'
      : user?.role === 'donator'
        ? '/dashboard/donator/profile'
        : null;

  const browseLink = user?.role === 'receiver' ? '/browse/donations' : '/browse/needs';

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl" aria-hidden>
        ⏳
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Verification pending</h1>
      <p className="mt-3 text-gray-600">
        An administrator will review your account shortly. Until then you can browse listings and update your profile,
        but posting and messaging stay disabled.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to={browseLink}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Browse listings
        </Link>
        {profileLink ? (
          <Link
            to={profileLink}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Edit profile
          </Link>
        ) : null}
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await refreshUser();
            toast.success('Profile refreshed');
          } catch {
            toast.error('Could not refresh. Try logging in again.');
          }
        }}
        className="mt-6 text-sm font-medium text-green-700 underline hover:text-green-800"
      >
        I was verified — refresh my session
      </button>
      <p className="mt-4 text-xs text-gray-400">
        If messaging and posting stay locked after an admin verified you, use the button above or log in again.
      </p>
    </div>
  );
}
