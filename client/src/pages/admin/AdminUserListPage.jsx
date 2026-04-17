import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import Pagination from '../../components/common/Pagination';
import api from '../../services/api';

const PAGE_SIZE = 20;

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  return initials || 'U';
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const normalizeUsersPayload = (payload) => ({
  users: Array.isArray(payload?.users) ? payload.users : [],
  total: Number(payload?.total || 0),
  page: Number(payload?.page || 1),
  pages: Number(payload?.pages || 1)
});

export default function AdminUserListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialVerified = searchParams.get('isVerified');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(
    initialVerified === 'true' || initialVerified === 'false' ? initialVerified : ''
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const params = {
          page: currentPage,
          limit: PAGE_SIZE
        };

        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter) params.role = roleFilter;
        if (verifiedFilter) params.isVerified = verifiedFilter;

        const response = await api.get('/admin/users', { params });
        const parsed = normalizeUsersPayload(response?.data?.data || {});

        setUsers(parsed.users);
        setTotal(parsed.total);
        setPages(parsed.pages || 1);
      } catch (error) {
        console.error('Failed to fetch admin users:', error);
        toast.error(error?.response?.data?.message || 'Failed to load users');
        setUsers([]);
        setTotal(0);
        setPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearch, roleFilter, verifiedFilter, currentPage]);

  const updateUserInState = (userId, updater) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user?._id !== userId) return user;
        return updater(user);
      })
    );
  };

  const handleToggleVerification = async (user) => {
    if (!user?._id) return;

    const nextValue = !user.isVerified;
    setUpdatingId(user._id);

    try {
      const response = await api.put(`/admin/users/${user._id}/verify`, { isVerified: nextValue });
      const updatedUser = response?.data?.data;

      updateUserInState(user._id, (existing) => ({
        ...existing,
        ...(updatedUser || {}),
        isVerified: updatedUser?.isVerified ?? nextValue
      }));

      toast.success(nextValue ? 'User verified' : 'User unverified');
    } catch (error) {
      console.error('Failed to update verification:', error);
      toast.error(error?.response?.data?.message || 'Failed to update verification');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeactivate = async (user) => {
    if (!user?._id || !user?.isActive) return;

    const confirmed = window.confirm(`Deactivate ${user?.name || 'this user'}?`);
    if (!confirmed) return;

    setDeactivatingId(user._id);

    try {
      await api.delete(`/admin/users/${user._id}`);
      updateUserInState(user._id, (existing) => ({ ...existing, isActive: false }));
      toast.success('User deactivated');
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error(error?.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setRoleFilter('');
    setVerifiedFilter('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleRoleChange = (event) => {
    setRoleFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleVerifiedChange = (event) => {
    const nextValue = event.target.value;
    setVerifiedFilter(nextValue);
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    window.scrollTo(0, 0);
  };

  const showingRange = useMemo(() => {
    if (total === 0) return 'Showing 0-0 of 0 users';
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);
    return `Showing ${start}-${end} of ${total} users`;
  }, [currentPage, total]);

  return (
    <AdminLayout pageTitle="Users">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setCurrentPage(1);
          }}
          className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <select
          value={roleFilter}
          onChange={handleRoleChange}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          <option value="">All Roles</option>
          <option value="donator">Donator</option>
          <option value="receiver">Receiver</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={handleVerifiedChange}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>

        <button
          type="button"
          onClick={handleClearFilters}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Org Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Verified</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={`skeleton-row-${index}`} className="animate-pulse border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div>
                          <div className="h-4 w-28 rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-36 rounded bg-gray-200" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-16 rounded-full bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-16 rounded-full bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div className="h-7 w-14 rounded bg-gray-200" />
                        <div className="h-7 w-20 rounded bg-gray-200" />
                        <div className="h-7 w-20 rounded bg-gray-200" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = String(user?.role || '').toLowerCase();
                  const roleClass =
                    role === 'donator'
                      ? 'bg-blue-100 text-blue-700'
                      : role === 'receiver'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700';

                  return (
                    <tr
                      key={user?._id}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${user?.isActive ? '' : 'opacity-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user?.name || 'User'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                              {getInitials(user?.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{user?.name || '—'}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700">{user?.organizationName || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{user?.phone || '—'}</td>

                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${roleClass}`}>
                          {role || 'member'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {user?.isActive ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {user?.isVerified ? (
                          <span className="text-lg text-green-600">✓</span>
                        ) : (
                          <span className="text-lg text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700">{formatDate(user?.createdAt)}</td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/users/${user?._id}`)}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleVerification(user)}
                            disabled={updatingId === user?._id}
                            className="rounded border border-blue-200 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingId === user?._id
                              ? 'Saving...'
                              : user?.isVerified
                                ? 'Unverify'
                                : 'Verify'}
                          </button>

                          {user?.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(user)}
                              disabled={deactivatingId === user?._id}
                              className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deactivatingId === user?._id ? 'Working...' : 'Deactivate'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-center text-sm text-gray-600 sm:text-left">{showingRange}</p>
        <Pagination
          currentPage={currentPage}
          totalPages={pages}
          onPageChange={handlePageChange}
        />
      </div>
    </AdminLayout>
  );
}
