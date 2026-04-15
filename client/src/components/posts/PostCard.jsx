import React from 'react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, type, onCTAClick }) => {
  const navigate = useNavigate();

  // Handle null/undefined post gracefully
  if (!post || !type) {
    return null;
  }

  // Extract post details with fallbacks
  const {
    _id = '',
    title = 'Untitled',
    description = '',
    category = 'General',
    condition = 'good',
    urgency = 'medium',
    quantity = 1,
    unit = 'pcs',
    location = { city: 'Unknown', state: 'Unknown' },
    images = [],
    postedBy = {},
    status = 'open',
  } = post;

  const posterName = postedBy?.name || 'Anonymous';
  const isVerified = postedBy?.isVerified || false;

  // Condition badge colors for donations
  const conditionColorMap = {
    new: { bg: 'bg-blue-100', text: 'text-blue-800' },
    good: { bg: 'bg-green-100', text: 'text-green-800' },
    fair: { bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  // Urgency badge colors for needs
  const urgencyColorMap = {
    critical: { bg: 'bg-red-100', text: 'text-red-800' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    low: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };

  // Determine which badge to use
  const badgeType = type === 'donation' ? condition : urgency;
  const badgeColorMap = type === 'donation' ? conditionColorMap : urgencyColorMap;
  const badgeColor = badgeColorMap[badgeType] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  // Location display
  const locationDisplay = `📍 ${location?.city || 'Unknown'}, ${location?.state || 'Unknown'}`;

  // Navigation and click handlers
  const handleCardClick = (e) => {
    // Don't navigate if clicking on buttons or interactive elements
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/posts/${type}/${_id}`);
  };

  const handleCTAClick = () => {
    if (onCTAClick) {
      onCTAClick(post);
    }
  };

  const ctaButtonText = type === 'donation' ? 'I Need This' : 'I Can Help';
  const ctaButtonColor = type === 'donation' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="h-48 bg-gray-100 overflow-hidden rounded-t-xl flex items-center justify-center">
        {images && images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-sm font-medium">No image</div>
        )}
      </div>

      {/* Body Section */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Badge Row */}
        <div className="flex items-center justify-between">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full capitalize font-medium">
            {category}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${badgeColor.bg} ${badgeColor.text}`}>
            {badgeType}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm mt-2 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
          {description}
        </p>

        {/* Quantity + Unit */}
        <div className="text-sm text-gray-700 mt-2">
          Qty: {quantity} {unit}
        </div>

        {/* Location */}
        <div className="text-xs text-gray-500 mt-1">
          {locationDisplay}
        </div>

        {/* Poster Info Row */}
        <div className="flex items-center gap-2 mt-3 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {posterName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-700 font-medium">{posterName}</span>
          {isVerified && <span className="text-green-600 text-xs">✓</span>}
        </div>

        {/* Status Badge - Only show if not 'open' */}
        {status && status !== 'open' && (
          <div className="mb-3">
            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full capitalize font-medium">
              {status}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleCTAClick}
            className={`flex-1 ${ctaButtonColor} text-white rounded-lg py-2 text-sm font-medium transition-colors`}
          >
            {ctaButtonText}
          </button>
          <button
            onClick={() => navigate(`/posts/${type}/${_id}`)}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
