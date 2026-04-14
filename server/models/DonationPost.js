import mongoose from 'mongoose';

const donationPostSchema = new mongoose.Schema(
  {
    donator: {
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 6;
        },
        message: 'Maximum 6 images allowed.',
      },
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair'],
      required: true,
    },
    location: {
      city: String,
      state: String,
      pincode: String,
    },
    pickupAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'donated', 'cancelled'],
      default: 'open',
    },
    chosenReceiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: [String],
  },
  { timestamps: true }
);

const DonationPost = mongoose.model('DonationPost', donationPostSchema);

export default DonationPost;
