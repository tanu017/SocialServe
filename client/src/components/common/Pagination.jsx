import { useMemo } from 'react';

const ELLIPSIS = 'ellipsis';

function buildPageItems(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, ELLIPSIS, totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      ELLIPSIS,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ];
  }
  return [1, ELLIPSIS, currentPage - 1, currentPage, currentPage + 1, ELLIPSIS, totalPages];
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const items = useMemo(
    () => (totalPages > 1 ? buildPageItems(totalPages, currentPage) : []),
    [totalPages, currentPage]
  );

  if (totalPages <= 1) {
    return null;
  }

  const pillClass =
    'rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-200';
  const inactivePillClass = `${pillClass} bg-white hover:bg-gray-50`;
  const activePillClass = `${pillClass} bg-green-600 text-white border-green-600`;

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 ${
          currentPage === 1 ? 'cursor-not-allowed opacity-40' : ''
        }`}
      >
        ← Prev
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span
            key={`e-${index}`}
            className="px-2 py-1.5 text-sm font-medium text-gray-500"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={item === currentPage ? activePillClass : inactivePillClass}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 ${
          currentPage === totalPages ? 'cursor-not-allowed opacity-40' : ''
        }`}
      >
        Next →
      </button>
    </div>
  );
}
