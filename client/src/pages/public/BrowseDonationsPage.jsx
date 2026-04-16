import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDonations, needDonation } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import PostFilters from '../../components/posts/PostFilters';
import PostGrid from '../../components/posts/PostGrid';

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
        const response = await getDonations({ ...filters, page: currentPage });
        const responseData = response?.data || {};
        const data = responseData?.data || {};
        const posts = data?.posts || responseData?.donations || responseData || [];
        const pages = data?.pagination?.pages || responseData?.totalPages || 1;
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
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleNeed = async (postId) => {
    if (!isAuthenticated) {
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

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>

              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
