import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * For public browse/detail routes: block specific roles (e.g. donators should not open donation browse/detail).
 * Guests and roles not listed always pass through.
 */
export default function BrowseRoleGuard({ children, forbiddenRoles = [], redirectTo = '/' }) {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (
    isAuthenticated &&
    forbiddenRoles.length > 0 &&
    user?.role &&
    forbiddenRoles.includes(user.role)
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
