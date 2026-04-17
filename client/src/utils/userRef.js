/**
 * Resolves a Mongo user ref from API JSON: populated object, or raw ObjectId string.
 */
export function getUserRefId(ref) {
  if (ref == null) return null;
  if (typeof ref === 'string') return ref;
  const id = ref._id ?? ref.id;
  return id != null ? String(id) : null;
}
