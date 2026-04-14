import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length >= 2;
        },
        message: 'A conversation must have at least 2 participants',
      },
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    postType: {
      type: String,
      enum: ['donation', 'need'],
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index on participants for fast lookup
conversationSchema.index({ participants: 1 });

export default mongoose.model('Conversation', conversationSchema);
