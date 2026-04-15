import React from 'react';
import PostCard from './PostCard';

const PostGrid = ({ posts, type, loading, onCTAClick }) => {
  // Skeleton loader for loading state
  const SkeletonCard = () => (
    <div className="bg-gray-200 rounded-xl border border-gray-200 overflow-hidden animate-pulse h-96">
      <div className="h-48 bg-gray-300"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mt-4"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-8 bg-gray-300 rounded"></div>
          <div className="flex-1 h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );

  // Loading state: show skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Empty state: no posts found
  if (!posts || posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">No posts found.</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
        </div>
      </div>
    );
  }

  // Grid with posts
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posts.map((post) => (
        <PostCard
          key={post._id || Math.random()}
          post={post}
          type={type}
          onCTAClick={onCTAClick}
        />
      ))}
    </div>
  );
};

export default PostGrid;
