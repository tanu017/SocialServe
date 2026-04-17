import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import Pagination from '../../components/common/Pagination';
import api from '../../services/api';

const PAGE_SIZE = 20;
const categories = ['food', 'clothing', 'furniture', 'electronics', 'medical', 'books', 'other'];

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

const truncateText = (value, max = 35) => {
  const text = String(value || '');
  if (text.length <= max) return text || '—';
  return `${text.slice(0, max).trim()}...`;
};

const normalizePayload = (payload) => ({
  posts: Array.isArray(payload?.posts) ? payload.posts : [],
  total: Number(payload?.total || 0),
  pages: Number(payload?.pages || 1)
});

const statusClassMap = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  donated: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700'
};

const conditionClassMap = {
  new: 'bg-emerald-100 text-emerald-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-orange-100 text-orange-700'
};

export default function AdminDonationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: PAGE_SIZE
        };
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (debouncedSearch) params.search = debouncedSearch;

        const response = await api.get('/admin/donations', { params });
        const parsed = normalizePayload(response?.data?.data || {});
        setPosts(parsed.posts);
        setTotal(parsed.total);
        setPages(parsed.pages || 1);
      } catch (error) {
        console.error('Failed to fetch admin donations:', error);
        toast.error(error?.response?.data?.message || 'Failed to load donations');
        setPosts([]);
        setTotal(0);
        setPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [statusFilter, categoryFilter, debouncedSearch, currentPage]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setCategoryFilter('');
    setSearchInput('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (post) => {
    if (!post?._id) return;
    const confirmed = window.confirm(`Delete donation post "${post?.title || ''}"?`);
    if (!confirmed) return;

    setDeletingId(post._id);
    try {
      await api.delete(`/admin/donations/${post._id}`);
      setPosts((prev) => prev.filter((item) => item?._id !== post._id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('Donation post deleted');
    } catch (error) {
      console.error('Failed to delete donation post:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const showingRange = useMemo(() => {
    if (total === 0) return 'Showing 0-0 of 0 posts';
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);
    return `Showing ${start}-${end} of ${total} posts`;
  }, [currentPage, total]);

  return (
    <AdminLayout pageTitle="Donations">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          <option value="">All</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="donated">donated</option>
          <option value="cancelled">cancelled</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          <option value="">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by title..."
          className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

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
                <th className="px-4 py-3 text-left">Post</th>
                <th className="px-4 py-3 text-left">Donator</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Posted</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={`skeleton-donation-${index}`} className="animate-pulse border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-gray-200" />
                        <div>
                          <div className="h-4 w-40 rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-52 rounded bg-gray-200" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 7 }).map((__, col) => (
                      <td key={`skeleton-col-${col}`} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div className="h-7 w-16 rounded bg-gray-200" />
                        <div className="h-7 w-16 rounded bg-gray-200" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No donation posts found.
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const status = String(post?.status || '').toLowerCase();
                  const condition = String(post?.condition || '').toLowerCase();
                  const location = [post?.location?.city, post?.location?.state].filter(Boolean).join(', ') || '—';
                  return (
                    <tr key={post?._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {post?.images?.[0] ? (
                            <img
                              src={post.images[0]}
                              alt={post?.title || 'Donation'}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-100" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{truncateText(post?.title, 35)}</p>
                            <p className="truncate text-xs text-gray-400">
                              {truncateText(post?.description, 60)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post?.donator?.avatar ? (
                            <img
                              src={post.donator.avatar}
                              alt={post?.donator?.name || 'Donator'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                              {getInitials(post?.donator?.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            {post?.donator?._id ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/users/${post.donator._id}`)}
                                className="truncate font-medium text-gray-900 hover:underline"
                              >
                                {post?.donator?.name || '—'}
                              </button>
                            ) : (
                              <p className="truncate font-medium text-gray-900">{post?.donator?.name || '—'}</p>
                            )}
                            {post?.donator?.isVerified ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                Verified
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                          {post?.category || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            conditionClassMap[condition] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {condition || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {post?.quantity ?? '—'} {post?.unit || ''}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{location}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusClassMap[status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(post?.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`/posts/donation/${post?._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            View Post
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(post)}
                            disabled={deletingId === post?._id}
                            className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === post?._id ? 'Deleting...' : 'Delete'}
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
