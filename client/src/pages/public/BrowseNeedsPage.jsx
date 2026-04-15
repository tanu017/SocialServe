import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNeeds, helpNeed } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import PostFilters from '../../components/posts/PostFilters';
import PostGrid from '../../components/posts/PostGrid';

export default function BrowseNeedsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [filters, setFilters] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch needs on mount and when filters or currentPage changes
  useEffect(() => {
    const fetchNeeds = async () => {
      setLoading(true);
      try {
        const response = await getNeeds({ ...filters, page: currentPage });
        // Try both response shapes
        const posts = response.data?.data || response.data?.needs || response.data || [];
        setPosts(Array.isArray(posts) ? posts : []);
        setTotalPages(response.data?.totalPages || 1);
      } catch (error) {
        toast.error('Failed to load needs');
        console.error(error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNeeds();
  }, [filters, currentPage]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleHelp = async (postId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await helpNeed(postId);
      const conversationId = response.data?.data?.conversationId || response.data?.conversationId;
      toast.success('You offered to help! Check your messages.');
      
      // Navigate to donator dashboard messages section with conversationId
      navigate(`/dashboard/donator/messages/${conversationId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to offer help');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Needs</h1>
          <p className="text-gray-600">
            Showing {posts.length > 0 ? `${posts.length}` : '0'} needs
          </p>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="w-full lg:w-72 lg:shrink-0">
            <PostFilters
              type="need"
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Posts Grid */}
            <PostGrid
              posts={posts}
              type="need"
              loading={loading}
              onCTAClick={handleHelp}
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
