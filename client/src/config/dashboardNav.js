import { canUseMessagingAndPosting } from '../utils/verification';

export function getDonatorSidebarLinks(unreadCount, user) {
  const core = [
    { label: 'Overview', to: '/dashboard/donator', icon: 'grid' },
    { label: 'Profile', to: '/dashboard/donator/profile', icon: 'user' },
    { label: 'My Posts', to: '/dashboard/donator/posts', icon: 'list' },
  ];

  if (!canUseMessagingAndPosting(user)) {
    return [
      ...core,
      {
        label: 'Verification',
        to: '/account/pending-verification',
        icon: 'lock',
      },
    ];
  }

  return [
    ...core,
    { label: 'Create Post', to: '/dashboard/donator/posts/new', icon: 'plus' },
    { label: 'Messages', to: '/dashboard/donator/messages', icon: 'chat', badge: unreadCount },
  ];
}

export function getReceiverSidebarLinks(unreadCount, user) {
  const core = [
    { label: 'Overview', to: '/dashboard/receiver', icon: 'grid' },
    { label: 'Profile', to: '/dashboard/receiver/profile', icon: 'user' },
    { label: 'My Needs', to: '/dashboard/receiver/needs', icon: 'list' },
  ];

  if (!canUseMessagingAndPosting(user)) {
    return [
      ...core,
      {
        label: 'Verification',
        to: '/account/pending-verification',
        icon: 'lock',
      },
    ];
  }

  return [
    ...core,
    { label: 'Post a Need', to: '/dashboard/receiver/needs/new', icon: 'plus' },
    { label: 'Messages', to: '/dashboard/receiver/messages', icon: 'chat', badge: unreadCount },
  ];
}
