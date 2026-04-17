import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNeeds, helpNeed } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import PostFilters from '../../components/posts/PostFilters';
import PostGrid from '../../components/posts/PostGrid';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 12;

export default function BrowseNeedsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
        const response = await getNeeds({ ...filters, page: currentPage, limit: PAGE_SIZE });
        const responseData = response?.data || {};
        const data = responseData?.data || {};
        const posts = data?.posts || responseData?.needs || responseData || [];
        const pages =
          data?.pages ??
          data?.pagination?.pages ??
          responseData?.totalPages ??
          (data?.total != null ? Math.ceil(Number(data.total) / PAGE_SIZE) : 1);
        setPosts(Array.isArray(posts) ? posts : []);
        setTotalPages(Number.isFinite(Number(pages)) ? Number(pages) : 1);
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
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    window.scrollTo(0, 0);
  };

  const handleHelp = async (postId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to offer help.');
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
