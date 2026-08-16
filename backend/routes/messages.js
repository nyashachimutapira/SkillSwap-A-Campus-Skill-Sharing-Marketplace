const express = require('express');
const Message = require('../models/message');
const auth = require('../middleware/auth');
const router = express.Router();

const serializeMessage = (message) => {
  const data = message.toJSON ? message.toJSON() : message;
  return {
    ...data,
    sender_id: data.sender_id?.id || data.sender_id?._id || data.sender_id,
    receiver_id: data.receiver_id?.id || data.receiver_id?._id || data.receiver_id,
    sender_name: data.sender_id?.first_name,
    sender_last_name: data.sender_id?.last_name,
    receiver_name: data.receiver_id?.first_name,
    receiver_last_name: data.receiver_id?.last_name,
  };
};

// Get conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender_id: req.userId }, { receiver_id: req.userId }],
    })
      .populate('sender_id', 'first_name last_name profile_picture')
      .populate('receiver_id', 'first_name last_name profile_picture')
      .sort({ created_at: -1 });

    const conversations = new Map();
    messages.forEach((message) => {
      const data = message.toJSON();
      const sentByMe = data.sender_id.id === req.userId;
      const otherUser = sentByMe ? data.receiver_id : data.sender_id;

      if (!conversations.has(otherUser.id)) {
        conversations.set(otherUser.id, {
          other_user_id: otherUser.id,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          profile_picture: otherUser.profile_picture,
          last_message_time: data.created_at,
        });
      }
    });

    res.json(Array.from(conversations.values()));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages with specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender_id: req.userId, receiver_id: req.params.userId },
        { sender_id: req.params.userId, receiver_id: req.userId },
      ],
    })
      .populate('sender_id', 'first_name last_name')
      .populate('receiver_id', 'first_name last_name')
      .sort({ created_at: 1 });

    await Message.updateMany(
      { receiver_id: req.userId, sender_id: req.params.userId },
      { is_read: true }
    );

    res.json(messages.map(serializeMessage));
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver_id, content, booking_id } = req.body;

    const message = await Message.create({
      sender_id: req.userId,
      receiver_id,
      content,
      booking_id: booking_id || null,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
