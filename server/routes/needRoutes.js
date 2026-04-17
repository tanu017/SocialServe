import express from 'express';
import NeedPost from '../models/NeedPost.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPlatformSettings } from '../utils/platformSettings.js';
import { multerUpload, uploadToCloudinary } from '../middleware/upload.js';
import { findOrCreateConversationForPair } from '../utils/conversationHelpers.js';

const router = express.Router();

// 1. GET / — Get all open need posts with filters
router.get('/', async (req, res) => {
  try {
    const { category, city, urgency, receiverId, page = 1, limit = 12 } = req.query;

    const filter = { status: 'open' };

    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;
    if (city) filter['location.city'] = city;
    if (receiverId) filter.receiver = receiverId;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await NeedPost.countDocuments(filter);
    const posts = await NeedPost.find(filter)
      .populate('receiver', 'name avatar isVerified organizationName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts,
        total,
        page: pageNum,
        pages,
        pagination: {
          total,
          page: pageNum,
          pages,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 2. POST / — Create a new need post with image uploads
router.post('/', protect, authorize('receiver'), multerUpload, async (req, res) => {
  try {
    const platformSettings = await getPlatformSettings();
    if (!platformSettings.allowNewNeedPosts) {
      return res.status(403).json({
        success: false,
        message: 'Creating new need posts is temporarily disabled.',
      });
    }

    const {
      title,
      description,
      category,
      quantityNeeded,
      unit,
      urgency,
      location,
      tags,
    } = req.body;

    // Parse location if it's a JSON string
    let parsedLocation = location;
    if (typeof location === 'string') {
      parsedLocation = JSON.parse(location);
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'SocialServe/needs');
        imageUrls.push(imageUrl);
      }
    }

    const newPost = new NeedPost({
      title,
      description,
      category,
      quantityNeeded,
      unit,
      urgency,
      location: parsedLocation,
      images: imageUrls,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      receiver: req.user._id,
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      message: 'Need post created successfully',
      data: newPost,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 3. GET /me — Get all posts by the current receiver
router.get('/me', protect, authorize('receiver'), async (req, res) => {
  try {
    const posts = await NeedPost.find({ receiver: req.user._id })
      .populate('receiver', 'name avatar isVerified organizationName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Your posts retrieved successfully',
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 4. GET /:id — Get a single need post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await NeedPost.findById(req.params.id).populate(
      'receiver',
      'name avatar role isVerified organizationName'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    res.json({
      success: true,
      message: 'Post retrieved successfully',
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 5. PUT /:id — Update a need post
router.put('/:id', protect, authorize('receiver'), multerUpload, async (req, res) => {
  try {
    const post = await NeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    // Check if the user is the receiver
    if (post.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
        data: null,
      });
    }

    const {
      title,
      description,
      category,
      quantityNeeded,
      unit,
      urgency,
      location,
      status,
      tags,
    } = req.body;

    // Update allowed fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (category) post.category = category;
    if (quantityNeeded) post.quantityNeeded = quantityNeeded;
    if (unit) post.unit = unit;
    if (urgency) post.urgency = urgency;
    if (location) {
      post.location = typeof location === 'string' ? JSON.parse(location) : location;
    }
    if (status) post.status = status;
    if (tags) {
      post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Handle new images
    if (req.files && req.files.images) {
      const imageUrls = [];
      for (const file of req.files.images) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'SocialServe/needs');
        imageUrls.push(imageUrl);
      }
      post.images = imageUrls;
    }

    await post.save();

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 6. DELETE /:id — Delete a need post
router.delete('/:id', protect, authorize('receiver'), async (req, res) => {
  try {
    const post = await NeedPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    // Check if the user is the receiver
    if (post.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
        data: null,
      });
    }

    await NeedPost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

// 7. POST /:id/help — Offer help for a need (create/retrieve conversation)
router.post('/:id/help', protect, authorize('donator'), async (req, res) => {
  try {
    // Find the need post
    const post = await NeedPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        data: null,
      });
    }

    const { conversation, created } = await findOrCreateConversationForPair({
      userIdA: req.user._id,
      userIdB: post.receiver,
      relatedPostId: post._id,
      postType: 'need',
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Conversation created successfully' : 'Conversation already exists',
      data: {
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
});

export default router;
