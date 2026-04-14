import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /conversations - Find all conversations for the current user
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar role')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /conversations/:id/messages - Get all messages in a conversation
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /conversations/:id/messages - Create a new message
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to message in this conversation' });
    }

    // Create message
    const message = new Message({
      conversation: req.params.id,
      sender: req.user._id,
      text: req.body.text,
    });

    await message.save();

    // Update conversation last message and timestamp
    conversation.lastMessage = req.body.text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /conversations/:id/read - Mark all messages as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this conversation' });
    }

    // Add user to readBy of all messages in this conversation that don't have them
    await Message.updateMany(
      {
        conversation: req.params.id,
        readBy: { $ne: req.user._id },
      },
      { $push: { readBy: req.user._id } }
    );

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
