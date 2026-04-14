import mongoose from 'mongoose';

const needPostSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['food', 'clothing', 'furniture', 'electronics', 'medical', 'books', 'other'],
      required: true,
    },
    quantityNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    images: [String],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    location: {
      city: String,
      state: String,
      pincode: String,
    },
    status: {
      type: String,
      enum: ['open', 'partially_fulfilled', 'fulfilled', 'closed'],
      default: 'open',
    },
    tags: [String],
  },
  { timestamps: true }
);

const NeedPost = mongoose.model('NeedPost', needPostSchema);

export default NeedPost;
