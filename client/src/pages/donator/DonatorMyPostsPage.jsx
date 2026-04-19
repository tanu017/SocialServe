import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { getDonatorSidebarLinks } from '../../config/dashboardNav';
import { useAuth } from '../../context/AuthContext';
import { canUseMessagingAndPosting } from '../../utils/verification';

const conditionClasses = {
  new: 'bg-blue-100 text-blue-700',
  good: 'bg-green-100 text-green-700',
  fair: 'bg-amber-100 text-amber-700'
};

const statusClasses = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-amber-100 text-amber-700',
  donated: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700'
};

const statusOptions = ['open', 'in_progress', 'donated', 'cancelled'];

const getPostsFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.posts)) return response.data.posts;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const truncateTitle = (title = '') => {
  if (title.length <= 40) return title;
  return `${title.slice(0, 40)}...`;
};

const formatDate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return format(date, 'MMM d, yyyy');
};

const getImageUrl = (post) => {
  const firstImage = Array.isArray(post?.images) ? post.images[0] : null;
  if (typeof firstImage === 'string') return firstImage;
  return firstImage?.url || '';
};

export default function DonatorMyPostsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = useMemo(() => getDonatorSidebarLinks(unreadCount, user), [unreadCount, user]);
  const verified = canUseMessagingAndPosting(user);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await api.get('/donations/me');
        setPosts(getPostsFromResponse(response));
      } catch (error) {
        console.error('Failed to fetch my donation posts:', error);
        toast.error('Failed to load your donation posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  const handleStatusChange = async (postId, newStatus) => {
    try {
      await api.put(`/donations/${postId}`, { status: newStatus });
      setPosts((prev) =>
        prev.map((post) => (post?._id === postId ? { ...post, status: newStatus } : post))
      );
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = window.confirm('Are you sure you want to delete this donation post?');
    if (!confirmed) return;

    try {
      await api.delete(`/donations/${postId}`);
      setPosts((prev) => prev.filter((post) => post?._id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete post');
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="My Donation Posts">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Donation Posts</h1>
        <button
          type="button"
          onClick={() =>
            verified ? navigate('/dashboard/donator/posts/new') : navigate('/account/pending-verification')
          }
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          New Post
        </button>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="animate-pulse border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-14 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
          <p className="mb-4 text-gray-600">You haven&apos;t posted any donations yet.</p>
          <button
            type="button"
            onClick={() =>
              verified ? navigate('/dashboard/donator/posts/new') : navigate('/account/pending-verification')
            }
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const imageUrl = getImageUrl(post);
                const condition = String(post?.condition || 'fair').toLowerCase();
                const status = String(post?.status || 'open').toLowerCase();
                const quantity = post?.quantity ?? post?.qty ?? 0;
                const unit = post?.unit || 'items';

                return (
                  <tr key={post?._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      {imageUrl ? (
                        <img src={imageUrl} alt={post?.title || 'Donation'} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{truncateTitle(post?.title || '-')}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{post?.category || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          conditionClasses[condition] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {quantity} {unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusClasses[status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(post?.createdAt)}</td>
                    <td className="px-4 py-3">
                      {verified ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/donator/posts/edit/${post?._id}`)}
                            className="text-green-700 hover:underline"
                          >
                            Edit
                          </button>
                          <select
                            value={status}
                            onChange={(event) => handleStatusChange(post?._id, event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                          >
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDelete(post?._id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Locked until verified</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && posts.length > 0 && verified ? (
        <div className="mt-4">
          <Link to="/dashboard/donator/posts/new" className="text-sm font-medium text-green-700 hover:underline">
            Create another post
          </Link>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
