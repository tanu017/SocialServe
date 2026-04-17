import Conversation from '../models/Conversation.js';

/**
 * One DM thread per pair of users (donator ↔ receiver).
 * When the same pair interacts from a different post, we reuse the thread and
 * refresh relatedPost + postType so the UI reflects the latest context.
 */
export async function findOrCreateConversationForPair({
  userIdA,
  userIdB,
  relatedPostId,
  postType,
}) {
  const pair = [userIdA, userIdB];

  const existing = await Conversation.findOne({
    participants: { $all: pair },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  }).sort({ lastMessageAt: -1 });

  if (existing) {
    existing.relatedPost = relatedPostId;
    existing.postType = postType;
    await existing.save();
    return { conversation: existing, created: false };
  }

  const conversation = await Conversation.create({
    participants: pair,
    relatedPost: relatedPostId,
    postType,
  });

  return { conversation, created: true };
}
