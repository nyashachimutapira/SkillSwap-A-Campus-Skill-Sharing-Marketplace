const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = express.Router();

const publicFields = '-password_hash -__v';

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(publicFields);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, campus_location, profile_picture, availability } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { bio, campus_location, profile_picture, availability },
      { new: true, runValidators: true }
    ).select(publicFields);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users to start conversations or browse people
router.get('/', auth, async (req, res) => {
  try {
    const { search = '' } = req.query;
    const filters = {
      _id: { $ne: req.userId },
    };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filters.$or = [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
        { campus_location: regex },
      ];
    }

    const users = await User.find(filters)
      .select(publicFields)
      .sort({ first_name: 1, last_name: 1 })
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(publicFields);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
