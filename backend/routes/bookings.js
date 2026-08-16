const express = require('express');
const Booking = require('../models/booking');
const Skill = require('../models/skill');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = express.Router();

const serializeBooking = (booking) => {
  const data = booking.toJSON ? booking.toJSON() : booking;
  return {
    ...data,
    requester_id: data.requester_id?.id || data.requester_id?._id || data.requester_id,
    provider_id: data.provider_id?.id || data.provider_id?._id || data.provider_id,
    skill_id: data.skill_id?.id || data.skill_id?._id || data.skill_id,
    requester_name: data.requester_id?.first_name,
    requester_last_name: data.requester_id?.last_name,
    provider_name: data.provider_id?.first_name,
    provider_last_name: data.provider_id?.last_name,
    skill_name: data.skill_id?.name,
  };
};

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ requester_id: req.userId }, { provider_id: req.userId }],
    })
      .populate('requester_id', 'first_name last_name')
      .populate('provider_id', 'first_name last_name')
      .populate('skill_id', 'name')
      .sort({ created_at: -1 });

    res.json(bookings.map(serializeBooking));
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create booking request
router.post('/', auth, async (req, res) => {
  try {
    const { provider_id, skill_id, proposed_time, duration_minutes, notes } = req.body;

    const skill = await Skill.findById(skill_id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const creditsNeeded = Math.ceil((duration_minutes / 60) * skill.credits_per_hour);
    if (user.credit_balance < creditsNeeded) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    const booking = await Booking.create({
      requester_id: req.userId,
      provider_id,
      skill_id,
      proposed_time,
      duration_minutes,
      notes,
      credits_transferred: creditsNeeded,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isRequester = booking.requester_id.toString() === req.userId;
    const isProvider = booking.provider_id.toString() === req.userId;
    if (!isRequester && !isProvider) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (status === 'completed' && booking.status !== 'completed') {
      await User.findByIdAndUpdate(booking.requester_id, {
        $inc: { credit_balance: -booking.credits_transferred },
      });
      await User.findByIdAndUpdate(booking.provider_id, {
        $inc: { credit_balance: booking.credits_transferred },
      });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
