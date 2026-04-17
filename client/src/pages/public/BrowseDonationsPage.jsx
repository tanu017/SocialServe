import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDonations, needDonation } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import PostFilters from '../../components/posts/PostFilters';
import PostGrid from '../../components/posts/PostGrid';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 12;

export default function BrowseDonationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch donations on mount and when filters or currentPage changes
  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const response = await getDonations({ ...filters, page: currentPage, limit: PAGE_SIZE });
        const responseData = response?.data || {};
        const data = responseData?.data || {};
        const posts = data?.posts || responseData?.donations || responseData || [];
        const pages =
          data?.pages ??
          data?.pagination?.pages ??
          responseData?.totalPages ??
          (data?.total != null ? Math.ceil(Number(data.total) / PAGE_SIZE) : 1);
        setPosts(Array.isArray(posts) ? posts : []);
        setTotalPages(Number.isFinite(Number(pages)) ? Number(pages) : 1);
      } catch (error) {
        toast.error('Failed to load donations');
        console.error(error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [filters, currentPage]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    window.scrollTo(0, 0);
  };

  const handleNeed = async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a donation.');
      navigate('/login');
      return;
    }

    try {
      const response = await needDonation(postId);
      const conversationId = response.data?.data?.conversationId || response.data?.conversationId;
      toast.success('Conversation started! Check your messages.');
      
      // Navigate to receiver dashboard messages section with conversationId
      navigate(`/dashboard/receiver/messages/${conversationId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request donation');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Donations</h1>
          <p className="text-gray-600">
            Showing {posts.length > 0 ? `${posts.length}` : '0'} donations
          </p>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="w-full lg:w-72 lg:shrink-0">
            <PostFilters
              type="donation"
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Posts Grid */}
            <PostGrid
              posts={posts}
              type="donation"
              loading={loading}
              onCTAClick={handleNeed}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
