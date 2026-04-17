import { useMemo } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';

export default function AdminLayout({ children, pageTitle }) {
  const sidebarLinks = useMemo(
    () => [
      { label: 'Overview', to: '/admin', icon: 'grid', end: true },
      { label: 'Users', to: '/admin/users', icon: 'list' },
      { label: 'Donations', to: '/admin/donations', icon: 'list' },
      { label: 'Needs', to: '/admin/needs', icon: 'list' },
      { label: 'Settings', to: '/admin/settings', icon: 'list' }
    ],
    []
  );

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      pageTitle={pageTitle}
      sidebarHeaderBadge="Admin Panel"
      sidebarHeaderBadgeClassName="bg-red-100 text-red-700"
    >
      {children}
    </DashboardLayout>
  );
}
