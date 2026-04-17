import Conversation from '../models/Conversation.js';
import NeedPost from '../models/NeedPost.js';
import DonationPost from '../models/DonationPost.js';

/**
 * Attach `{ _id, title }` for each conversation's related need/donation post so the client can show context.
 */
export async function enrichConversationsWithRelatedPosts(conversations) {
  if (!conversations?.length) return [];

  const needIds = [];
  const donationIds = [];
  for (const c of conversations) {
    const pid = c.relatedPost?._id ?? c.relatedPost;
    if (!pid) continue;
    if (c.postType === 'need') needIds.push(pid);
    else if (c.postType === 'donation') donationIds.push(pid);
  }

  const [needs, donations] = await Promise.all([
    needIds.length ? NeedPost.find({ _id: { $in: needIds } }).select('title').lean() : [],
    donationIds.length
      ? DonationPost.find({ _id: { $in: donationIds } }).select('title').lean()
      : [],
  ]);

  const needMap = Object.fromEntries(needs.map((n) => [String(n._id), n]));
  const donationMap = Object.fromEntries(donations.map((d) => [String(d._id), d]));

  return conversations.map((c) => {
    const plain = typeof c.toObject === 'function' ? c.toObject() : { ...c };
    const pid = plain.relatedPost?._id ?? plain.relatedPost;
    const pidStr = pid != null ? String(pid) : '';
    const post =
      plain.postType === 'need'
        ? needMap[pidStr]
        : plain.postType === 'donation'
          ? donationMap[pidStr]
          : null;

    plain.relatedPost = post
      ? { _id: post._id, title: post.title }
      : pidStr
        ? { _id: pid, title: null }
        : null;

    return plain;
  });
}

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
