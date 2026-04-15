import React from 'react';

const PostFilters = ({ type, filters, onChange }) => {
  if (!type) return null;

  const categories = ['all', 'food', 'clothing', 'furniture', 'electronics', 'medical', 'books', 'other'];
  const sortOptions = ['newest', 'oldest', 'quantity'];

  const handleCategoryChange = (e) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    onChange({ ...filters, category: value });
  };

  const handleCityChange = (e) => {
    onChange({ ...filters, city: e.target.value });
  };

  const handleConditionOrUrgencyChange = (value) => {
    const filterKey = type === 'donation' ? 'condition' : 'urgency';
    const filterValue = value === 'all' ? '' : value;
    onChange({ ...filters, [filterKey]: filterValue });
  };

  const handleSortChange = (e) => {
    onChange({ ...filters, sortBy: e.target.value });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const conditionOrUrgencyOptions = type === 'donation'
    ? ['all', 'new', 'good', 'fair']
    : ['all', 'critical', 'high', 'medium', 'low'];

  const conditionOrUrgencyLabel = type === 'donation' ? 'Condition' : 'Urgency';
  const currentConditionOrUrgency = type === 'donation' ? filters.condition : filters.urgency;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-gray-400 mb-2 font-semibold">Category</h3>
        <select
          value={filters.category || 'all'}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat === 'all' ? '' : cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-gray-400 mb-2 font-semibold">City</h3>
        <input
          type="text"
          value={filters.city || ''}
          onChange={handleCityChange}
          placeholder="Enter city name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Condition/Urgency Filter */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-gray-400 mb-2 font-semibold">{conditionOrUrgencyLabel}</h3>
        <div className="space-y-2">
          {conditionOrUrgencyOptions.map((option) => (
            <label key={option} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={conditionOrUrgencyLabel}
                value={option}
                checked={currentConditionOrUrgency === (option === 'all' ? '' : option) || (option === 'all' && !currentConditionOrUrgency)}
                onChange={() => handleConditionOrUrgencyChange(option)}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-700 cursor-pointer">
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort By Filter */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-gray-400 mb-2 font-semibold">Sort By</h3>
        <select
          value={filters.sortBy || 'newest'}
          onChange={handleSortChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((sort) => (
            <option key={sort} value={sort}>
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={handleClearFilters}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default PostFilters;
