import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const statusClassMap = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  donated: 'bg-green-100 text-green-700'
};

const getPostsFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.posts)) return response.data.posts;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export default function DonatorDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useSocket();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const fetchMyDonations = async () => {
      try {
        const response = await api.get('/donations/me');
        setPosts(getPostsFromResponse(response));
      } catch (error) {
        console.error('Failed to fetch donations:', error);
        toast.error('Failed to load your posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDonations();
  }, []);

  const stats = useMemo(() => {
    const open = posts.filter((post) => post?.status === 'open').length;
    const inProgress = posts.filter((post) => post?.status === 'in_progress').length;
    const donated = posts.filter((post) => post?.status === 'donated').length;
    return { open, inProgress, donated, total: posts.length };
  }, [posts]);

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 5);
  }, [posts]);

  const sidebarLinks = useMemo(
    () => [
      { label: 'Overview', to: '/dashboard/donator', icon: 'grid' },
      { label: 'My Posts', to: '/dashboard/donator/posts', icon: 'list' },
      { label: 'Create Post', to: '/dashboard/donator/posts/new', icon: 'plus' },
      { label: 'Messages', to: '/dashboard/donator/messages', icon: 'chat', badge: unreadCount }
    ],
    [unreadCount]
  );

  const handleDelete = async (postId) => {
    if (pendingDeleteId !== postId) {
      setPendingDeleteId(postId);
      toast('Click delete again to confirm', { icon: '⚠️' });
      return;
    }

    try {
      await api.delete(`/donations/${postId}`);
      setPosts((prev) => prev.filter((post) => post?._id !== postId));
      toast.success('Post deleted');
      setPendingDeleteId(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete post');
    }
  };

  const StatCardSkeleton = () => (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 text-center">
      <div className="mx-auto h-9 w-10 rounded bg-gray-200" />
      <div className="mx-auto mt-2 h-4 w-24 rounded bg-gray-200" />
    </div>
  );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="Donator Dashboard">
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.open}</p>
              <p className="mt-1 text-sm text-gray-500">Active Posts</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.inProgress}</p>
              <p className="mt-1 text-sm text-gray-500">In Progress</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.donated}</p>
              <p className="mt-1 text-sm text-gray-500">Donated</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total}</p>
              <p className="mt-1 text-sm text-gray-500">Total Posts</p>
            </div>
          </>
        )}
      </div>

      <section className="mb-8 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Recent Posts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    Loading posts...
                  </td>
                </tr>
              ) : recentPosts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                    No posts yet.
                  </td>
                </tr>
              ) : (
                recentPosts.map((post) => {
                  const status = post?.status || 'open';
                  return (
                    <tr key={post?._id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{post?.title || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{post?.category || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusClassMap[status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {String(status).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(post?.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/donator/posts/${post?._id}/edit`)}
                            className="text-green-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(post?._id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-4 py-3">
          <Link to="/dashboard/donator/posts" className="text-sm font-medium text-green-700 hover:underline">
            View All Posts
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/donator/posts/new')}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Post a Donation
        </button>
        <button
          type="button"
          onClick={() => navigate('/browse/needs')}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Browse Needs
        </button>
      </section>
    </DashboardLayout>
  );
}
