import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const urgencyClasses = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700'
};

const statusClasses = {
  open: 'bg-blue-100 text-blue-700',
  partially_fulfilled: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700'
};

const statusOptions = ['open', 'partially_fulfilled', 'fulfilled', 'closed'];

const getNeedsFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.posts)) return response.data.posts;
  if (Array.isArray(response?.data?.needs)) return response.data.needs;
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

const buildSidebarLinks = (unreadCount) => [
  { label: 'Overview', to: '/dashboard/receiver', icon: 'grid' },
  { label: 'My Needs', to: '/dashboard/receiver/needs', icon: 'list' },
  { label: 'Post a Need', to: '/dashboard/receiver/needs/new', icon: 'plus' },
  { label: 'Messages', to: '/dashboard/receiver/messages', icon: 'chat', badge: unreadCount }
];

export default function ReceiverMyNeedsPage() {
  const navigate = useNavigate();
  const { unreadCount } = useSocket();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = useMemo(() => buildSidebarLinks(unreadCount), [unreadCount]);

  useEffect(() => {
    const fetchMyNeeds = async () => {
      try {
        const response = await api.get('/needs/me');
        setNeeds(getNeedsFromResponse(response));
      } catch (error) {
        console.error('Failed to fetch my needs:', error);
        toast.error('Failed to load your need posts');
        setNeeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyNeeds();
  }, []);

  const handleStatusChange = async (needId, newStatus) => {
    try {
      await api.put(`/needs/${needId}`, { status: newStatus });
      setNeeds((prev) =>
        prev.map((post) => (post?._id === needId ? { ...post, status: newStatus } : post))
      );
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update need status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (needId) => {
    const confirmed = window.confirm('Are you sure you want to delete this need post?');
    if (!confirmed) return;

    try {
      await api.delete(`/needs/${needId}`);
      setNeeds((prev) => prev.filter((post) => post?._id !== needId));
      toast.success('Need deleted');
    } catch (error) {
      console.error('Failed to delete need:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete need');
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="My Need Posts">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Need Posts</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/receiver/needs/new')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          New Need
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
                    <div className="h-4 w-20 rounded bg-gray-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-24 rounded-full bg-gray-200" />
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
      ) : needs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
          <p className="mb-4 text-gray-600">You haven&apos;t posted any needs yet.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/receiver/needs/new')}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Create Your First Need
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
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Qty Needed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {needs.map((post) => {
                const imageUrl = getImageUrl(post);
                const urgency = String(post?.urgency || 'medium').toLowerCase();
                const status = String(post?.status || 'open').toLowerCase();
                const quantityNeeded = post?.quantity ?? post?.qty ?? 0;
                const unit = post?.unit || 'items';

                return (
                  <tr key={post?._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      {imageUrl ? (
                        <img src={imageUrl} alt={post?.title || 'Need'} className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{truncateTitle(post?.title || '-')}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{post?.category || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          urgencyClasses[urgency] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {quantityNeeded} {unit}
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
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/receiver/needs/edit/${post?._id}`)}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
