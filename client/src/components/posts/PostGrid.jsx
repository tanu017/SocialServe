import React from 'react';
import PostCard from './PostCard';

const PostGrid = ({ posts, type, loading, onCTAClick }) => {
  // Skeleton loader — matches PostCard layout (image h-48, body, two action buttons)
  const SkeletonCard = () => (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="h-48 animate-pulse rounded-t-xl bg-gray-200" />
      <div className="flex flex-grow flex-col p-4">
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded bg-gray-200" style={{ width: '60%' }} />
          <div className="h-3 animate-pulse rounded bg-gray-200" style={{ width: '90%' }} />
          <div className="h-3 animate-pulse rounded bg-gray-200" style={{ width: '40%' }} />
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-gray-200" />
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
          key={post?._id || Math.random()}
          post={post}
          type={type}
          onCTAClick={onCTAClick}
        />
      ))}
    </div>
  );
};

export default PostGrid;
