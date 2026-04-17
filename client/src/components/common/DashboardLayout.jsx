import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const iconClassName = 'h-4 w-4';

const Icons = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName}>
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClassName}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V11a5 5 0 1 1 10 0v3.2a2 2 0 0 0 .6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
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

const deriveTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'dashboard';
  if (lastSegment === 'donator' || lastSegment === 'receiver' || lastSegment === 'admin') {
    return 'Overview';
  }
  return lastSegment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const renderIcon = (icon) => {
  if (typeof icon === 'string' && Icons[icon]) return Icons[icon];
  return icon || Icons.grid;
};

const normalizePath = (path = '') => {
  if (!path) return '/';
  return path !== '/' ? path.replace(/\/+$/, '') : path;
};

export default function DashboardLayout({
  sidebarLinks = [],
  children,
  pageTitle,
  sidebarHeaderBadge,
  sidebarHeaderBadgeClassName = 'bg-rose-100 text-rose-700'
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const currentPath = normalizePath(location.pathname);

  const isLinkMatch = (link) => {
    const linkPath = normalizePath(link.to);
    const requiresExact =
      Boolean(link.end) ||
      linkPath === '/dashboard/donator' ||
      linkPath === '/dashboard/receiver' ||
      linkPath === '/admin';

    if (requiresExact) {
      return currentPath === linkPath;
    }

    return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`);
  };

  const activeLinkPath = sidebarLinks
    .filter((link) => isLinkMatch(link))
    .map((link) => normalizePath(link.to))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 p-4">
          {sidebarHeaderBadge ? (
            <span
              className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${sidebarHeaderBadgeClassName}`}
            >
              {sidebarHeaderBadge}
            </span>
          ) : null}
          <Link to="/" className="block text-xl font-bold text-[#1D9E75]">
            GiveHub
          </Link>
          <div className="mt-4 flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-semibold text-green-800">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium uppercase text-green-800">
                {user?.role || 'member'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {sidebarLinks.map((link) => {
            const isActive = normalizePath(link.to) === activeLinkPath;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-green-50 font-medium text-green-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              <span className="flex items-center gap-2">
                {renderIcon(link.icon)}
                {link.label}
              </span>
              {(link.badge > 0 || (String(link.label).toLowerCase() === 'messages' && unreadCount > 0)) ? (
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {link.badge > 0 ? link.badge : unreadCount}
                </span>
              ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex items-center justify-between border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle || deriveTitle(location.pathname)}</h1>
          <div className={`relative ${unreadCount > 0 ? 'text-green-600' : 'text-gray-600'}`} aria-live="polite">
            {Icons.bell}
            {unreadCount > 0 ? (
              <span className="absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
