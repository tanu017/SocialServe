import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';

/**
 * Requires a verified donator/receiver (or admin). Use inside ProtectedRoute.
 */
export default function VerifiedRoute({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">Loading...</div>
    );
  }

  if (canUseMessagingAndPosting(user)) {
    return children;
  }

  return <Navigate to="/account/pending-verification" replace />;
}
