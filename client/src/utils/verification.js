/** Donators/receivers need admin verification; admins are always allowed. */
export function canUseMessagingAndPosting(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.isVerified === true;
}
