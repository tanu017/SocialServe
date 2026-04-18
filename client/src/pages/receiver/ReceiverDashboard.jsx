import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { getReceiverSidebarLinks } from '../../config/dashboardNav';

const urgencyClasses = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700'
};

const statusClasses = {
  open: 'bg-blue-100 text-blue-700',
  partially_fulfilled: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-green-100 text-green-700'
};

const getNeedsFromResponse = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.posts)) return response.data.posts;
  if (Array.isArray(response?.data?.needs)) return response.data.needs;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useSocket();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const sidebarLinks = useMemo(() => getReceiverSidebarLinks(unreadCount), [unreadCount]);

  useEffect(() => {
    const fetchMyNeeds = async () => {
      try {
        const response = await api.get('/needs/me');
        setNeeds(getNeedsFromResponse(response));
      } catch (error) {
        console.error('Failed to fetch needs:', error);
        toast.error('Failed to load your needs');
        setNeeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyNeeds();
  }, []);

  const stats = useMemo(() => {
    const open = needs.filter((post) => post?.status === 'open').length;
    const partial = needs.filter((post) => post?.status === 'partially_fulfilled').length;
    const fulfilled = needs.filter((post) => post?.status === 'fulfilled').length;
    return { open, partial, fulfilled, total: needs.length };
  }, [needs]);

  const recentNeeds = useMemo(
    () =>
      [...needs]
        .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
        .slice(0, 5),
    [needs]
  );

  const handleDelete = async (needId) => {
    if (pendingDeleteId !== needId) {
      setPendingDeleteId(needId);
      toast('Click delete again to confirm', { icon: '⚠️' });
      return;
    }

    try {
      await api.delete(`/needs/${needId}`);
      setNeeds((prev) => prev.filter((post) => post?._id !== needId));
      toast.success('Need deleted');
      setPendingDeleteId(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete need');
    }
  };

  const StatCardSkeleton = () => (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 text-center">
      <div className="mx-auto h-9 w-10 rounded bg-gray-200" />
      <div className="mx-auto mt-2 h-4 w-28 rounded bg-gray-200" />
    </div>
  );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle="Receiver Dashboard">
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
              <p className="mt-1 text-sm text-gray-500">Active Needs</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.partial}</p>
              <p className="mt-1 text-sm text-gray-500">Partially Fulfilled</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.fulfilled}</p>
              <p className="mt-1 text-sm text-gray-500">Fulfilled</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total}</p>
              <p className="mt-1 text-sm text-gray-500">Total Needs</p>
            </div>
          </>
        )}
      </div>

      <section className="mb-8 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Recent Needs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                    Loading needs...
                  </td>
                </tr>
              ) : recentNeeds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                    No needs yet.
                  </td>
                </tr>
              ) : (
                recentNeeds.map((post) => {
                  const urgency = String(post?.urgency || 'medium').toLowerCase();
                  const status = String(post?.status || 'open').toLowerCase();
                  return (
                    <tr key={post?._id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{post?.title || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{post?.category || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            urgencyClasses[urgency] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {urgency}
                        </span>
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
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/receiver/needs/new')}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Post a Need
        </button>
        <button
          type="button"
          onClick={() => navigate('/browse/donations')}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Browse Donations
        </button>
      </section>
    </DashboardLayout>
  );
}
