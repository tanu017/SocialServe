import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  return initials || 'U';
};

const getAddress = (address) => {
  if (!address || typeof address !== 'object') return 'Not provided';
  const parts = [address.street, address.city, address.state, address.pincode, address.country]
    .map((part) => (typeof part === 'string' ? part.trim() : part))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Not provided';
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [donationPosts, setDonationPosts] = useState([]);
  const [needPosts, setNeedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('donations');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin/users/${id}`);
        const payload = response?.data?.data || {};
        setUser(payload.user || null);
        setDonationPosts(Array.isArray(payload.donationPosts) ? payload.donationPosts : []);
        setNeedPosts(Array.isArray(payload.needPosts) ? payload.needPosts : []);
      } catch (error) {
        console.error('Failed to fetch admin user detail:', error);
        toast.error(error?.response?.data?.message || 'Failed to load user details');
        setUser(null);
        setDonationPosts([]);
        setNeedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const isInactive = !user?.isActive;

  const handleVerifyToggle = async () => {
    if (!user?._id || isInactive) return;

    const nextValue = !user.isVerified;
    setUpdatingUser(true);
    try {
      const response = await api.put(`/admin/users/${user._id}/verify`, { isVerified: nextValue });
      const updatedUser = response?.data?.data;
      setUser((prev) => ({
        ...prev,
        ...(updatedUser || {}),
        isVerified: updatedUser?.isVerified ?? nextValue
      }));
      toast.success(nextValue ? 'User verified' : 'User unverified');
    } catch (error) {
      console.error('Failed to update verification:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user?._id || isInactive) return;

    const confirmed = window.confirm(`Deactivate ${user?.name || 'this user'}?`);
    if (!confirmed) return;

    setDeactivating(true);
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deactivated');
      navigate('/admin/users');
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error(error?.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setDeactivating(false);
    }
  };

  const accountStatus = useMemo(() => (user?.isActive ? 'Active' : 'Inactive'), [user?.isActive]);

  const pageTitle = user?.name || 'User Detail';
  const websiteUrl =
    user?.website && /^https?:\/\//i.test(user.website) ? user.website : user?.website ? `https://${user.website}` : '';

  return (
    <AdminLayout pageTitle={pageTitle}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/users" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← Back to Users
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{pageTitle}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!loading && isInactive ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              Account Inactive
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleVerifyToggle}
            disabled={loading || updatingUser || deactivating || isInactive}
            className={`rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
              user?.isVerified
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {updatingUser ? 'Saving...' : user?.isVerified ? 'Unverify' : 'Verify User'}
          </button>

          <button
            type="button"
            onClick={handleDeactivate}
            disabled={loading || updatingUser || deactivating || isInactive}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deactivating ? 'Working...' : 'Deactivate Account'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
              <div className="h-20 w-20 rounded-full bg-gray-200" />
              <div className="mt-4 h-7 w-48 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-64 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
            </div>
            <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`contact-skeleton-${i}`} className="mb-4">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-40 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`stats-skeleton-${index}`}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="h-3 w-32 rounded bg-gray-200" />
                <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex gap-2">
              <div className="h-9 w-40 rounded bg-gray-200" />
              <div className="h-9 w-40 rounded bg-gray-200" />
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`row-skeleton-${index}`} className="mb-3 h-8 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ) : !user ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          User not found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start gap-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-700">
                    {getInitials(user?.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-bold text-gray-900">{user?.name || '—'}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                      {user?.role || 'member'}
                    </span>
                    {user?.isVerified ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                {user?.bio ? user.bio : <span className="italic text-gray-400">No bio provided</span>}
              </p>

              <p className="mt-4 text-sm text-gray-700">
                Member since: <span className="font-medium">{formatDate(user?.createdAt)}</span>
              </p>

              <div className="mt-3">
                {user?.isActive ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-1 text-sm text-gray-800">{user?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mt-1 text-sm text-gray-800">{user?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Website</p>
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-sm text-blue-600 hover:underline"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-gray-800">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Organization Name</p>
                  <p className="mt-1 text-sm text-gray-800">{user?.organizationName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Contact Person</p>
                  <p className="mt-1 text-sm text-gray-800">{user?.contactPerson || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Address</p>
                  <p className="mt-1 text-sm text-gray-800">{getAddress(user?.address)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Total Donations Posted</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{donationPosts.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Total Needs Posted</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{needPosts.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{accountStatus}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('donations')}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === 'donations'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Donation Posts ({donationPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('needs')}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === 'needs'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Need Posts ({needPosts.length})
              </button>
            </div>

            {activeTab === 'donations' ? (
              donationPosts.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No posts of this type.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donationPosts.map((post) => (
                        <tr key={post?._id} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <a
                              href={`/posts/donation/${post?._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-gray-900 hover:underline"
                            >
                              {post?.title || '—'}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{post?.category || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">{post?.status || '—'}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {post?.quantity ?? '—'} {post?.unit || ''}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(post?.createdAt)}</td>
                          <td className="px-3 py-2">
                            <a
                              href={`/posts/donation/${post?._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View post
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : needPosts.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No posts of this type.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Urgency</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Qty Needed</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needPosts.map((post) => (
                      <tr key={post?._id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <a
                            href={`/posts/need/${post?._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {post?.title || '—'}
                          </a>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{post?.category || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{post?.urgency || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{post?.status || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {post?.quantityNeeded ?? '—'} {post?.unit || ''}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{formatDate(post?.createdAt)}</td>
                        <td className="px-3 py-2">
                          <a
                            href={`/posts/need/${post?._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View post
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
