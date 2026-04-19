import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';

export default function VerificationBanner() {
  const { user } = useAuth();

  if (!user || user.role === 'admin' || canUseMessagingAndPosting(user)) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Account verification required</p>
      <p className="mt-1 text-amber-900/90">
        You can browse listings and update your profile. Posting and messaging unlock after an admin verifies your
        account.
      </p>
      <Link to="/account/pending-verification" className="mt-2 inline-block font-medium text-amber-900 underline">
        Learn more
      </Link>
    </div>
  );
}
