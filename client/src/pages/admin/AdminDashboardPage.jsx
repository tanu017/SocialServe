import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const defaultStats = {
  totalUsers: 0,
  totalDonations: 0,
  totalNeeds: 0,
  donatedCount: 0,
  donatorCount: 0,
  receiverCount: 0,
  fulfilledNeedsCount: 0,
  pendingVerification: 0
};

const normalizeStats = (payload) => {
  const stats = payload || {};
  return {
    totalUsers: Number(stats.totalUsers || 0),
    totalDonations: Number(stats.totalDonations || stats.totalDonationPosts || 0),
    totalNeeds: Number(stats.totalNeeds || stats.totalNeedPosts || 0),
    donatedCount: Number(stats.donatedCount || stats.donatedDonationPosts || 0),
    donatorCount: Number(stats.donatorCount || stats.totalDonators || 0),
    receiverCount: Number(stats.receiverCount || stats.totalReceivers || 0),
    fulfilledNeedsCount: Number(stats.fulfilledNeedsCount || stats.fulfilledNeedPosts || 0),
    pendingVerification: Number(stats.pendingVerification || stats.pendingVerificationUsers || 0)
  };
};

const primaryCards = (stats) => [
  {
    label: 'Total Users',
    value: stats.totalUsers,
    emoji: '🧑‍🤝‍🧑',
    iconBgClass: 'bg-blue-100',
    iconTextClass: 'text-blue-700'
  },
  {
    label: 'Donations Posted',
    value: stats.totalDonations,
    emoji: '🎁',
    iconBgClass: 'bg-green-100',
    iconTextClass: 'text-green-700'
  },
  {
    label: 'Needs Posted',
    value: stats.totalNeeds,
    emoji: '🙏',
    iconBgClass: 'bg-amber-100',
    iconTextClass: 'text-amber-700'
  },
  {
    label: 'Donations Fulfilled',
    value: stats.donatedCount,
    emoji: '✅',
    iconBgClass: 'bg-teal-100',
    iconTextClass: 'text-teal-700'
  }
];

const secondaryCards = (stats) => [
  { label: 'Donators', value: stats.donatorCount },
  { label: 'Receivers / NGOs', value: stats.receiverCount },
  { label: 'Needs Fulfilled', value: stats.fulfilledNeedsCount },
  {
    label: 'Pending Verification',
    value: stats.pendingVerification,
    warn: stats.pendingVerification > 0
  }
];

function PrimaryStatCard({ card }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBgClass}`}>
          <span className={`${card.iconTextClass}`} style={{ fontSize: '20px' }}>
            {card.emoji}
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
      <p className="mt-1 text-sm text-gray-500">{card.label}</p>
    </div>
  );
}

function SecondaryStatCard({ card }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${card.warn ? 'bg-amber-50' : 'bg-white'}`}>
      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
      <p className="mt-1 text-sm text-gray-500">{card.label}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 h-10 w-10 rounded-full bg-gray-200" />
      <div className="h-9 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
    </div>
  );
}

function QuickCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-5 w-44 rounded bg-gray-200" />
      <div className="mt-5 h-12 w-16 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-40 rounded bg-gray-200" />
      <div className="mt-5 h-10 w-36 rounded bg-gray-200" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        const payload = response?.data?.data || {};
        setStats(normalizeStats(payload));
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        toast.error(error?.response?.data?.message || 'Failed to load dashboard stats');
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const topCards = useMemo(() => primaryCards(stats), [stats]);
  const lowerCards = useMemo(() => secondaryCards(stats), [stats]);

  return (
    <AdminLayout pageTitle="Dashboard Overview">
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={`top-skeleton-${index}`} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={`bottom-skeleton-${index}`} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuickCardSkeleton />
            <QuickCardSkeleton />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {topCards.map((card) => (
              <PrimaryStatCard key={card.label} card={card} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {lowerCards.map((card) => (
              <SecondaryStatCard key={card.label} card={card} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-lg font-semibold text-gray-900">Pending Verifications</p>
              <p className="mt-4 text-5xl font-bold text-amber-600">{stats.pendingVerification}</p>
              <p className="mt-2 text-sm text-gray-500">users awaiting verification</p>
              <Link
                to="/admin/users?isVerified=false"
                className="mt-5 inline-flex rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200"
              >
                Review Users →
              </Link>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-lg font-semibold text-gray-900">Recent Activity</p>
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                Activity feed coming soon
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
