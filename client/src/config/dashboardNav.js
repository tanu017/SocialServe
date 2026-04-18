export function getDonatorSidebarLinks(unreadCount) {
  return [
    { label: 'Overview', to: '/dashboard/donator', icon: 'grid' },
    { label: 'Profile', to: '/dashboard/donator/profile', icon: 'user' },
    { label: 'My Posts', to: '/dashboard/donator/posts', icon: 'list' },
    { label: 'Create Post', to: '/dashboard/donator/posts/new', icon: 'plus' },
    { label: 'Messages', to: '/dashboard/donator/messages', icon: 'chat', badge: unreadCount },
  ];
}

export function getReceiverSidebarLinks(unreadCount) {
  return [
    { label: 'Overview', to: '/dashboard/receiver', icon: 'grid' },
    { label: 'Profile', to: '/dashboard/receiver/profile', icon: 'user' },
    { label: 'My Needs', to: '/dashboard/receiver/needs', icon: 'list' },
    { label: 'Post a Need', to: '/dashboard/receiver/needs/new', icon: 'plus' },
    { label: 'Messages', to: '/dashboard/receiver/messages', icon: 'chat', badge: unreadCount },
  ];
}
