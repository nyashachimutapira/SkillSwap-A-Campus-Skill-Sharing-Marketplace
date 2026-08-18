const express = require('express');
const Booking = require('../models/booking');
const Message = require('../models/message');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  try {
    const [unreadMessages, pendingBookings, upcomingBookings, recentBookingUpdates] = await Promise.all([
      Message.countDocuments({ receiver_id: req.userId, is_read: false }),
      Booking.countDocuments({
        provider_id: req.userId,
        status: 'pending',
      }),
      Booking.countDocuments({
        $or: [{ requester_id: req.userId }, { provider_id: req.userId }],
        status: 'confirmed',
        proposed_time: { $gte: new Date() },
      }),
      Booking.find({
        $or: [{ requester_id: req.userId }, { provider_id: req.userId }],
        status: { $in: ['confirmed', 'completed', 'cancelled'] },
      })
        .populate('skill_id', 'name')
        .sort({ updated_at: -1 })
        .limit(5),
    ]);

    res.json({
      unread_messages: unreadMessages,
      pending_bookings: pendingBookings,
      upcoming_bookings: upcomingBookings,
      alerts: [
        ...(unreadMessages ? [`${unreadMessages} unread message${unreadMessages === 1 ? '' : 's'}`] : []),
        ...(pendingBookings ? [`${pendingBookings} booking request${pendingBookings === 1 ? '' : 's'} waiting for you`] : []),
        ...(upcomingBookings ? [`${upcomingBookings} confirmed upcoming booking${upcomingBookings === 1 ? '' : 's'}`] : []),
      ],
      booking_updates: recentBookingUpdates.map((booking) => ({
        id: booking.id,
        skill_name: booking.skill_id?.name || 'Session',
        status: booking.status,
        proposed_time: booking.proposed_time,
        updated_at: booking.updated_at,
        cancellation_reason: booking.cancellation_reason,
      })),
    });
  } catch (error) {
    console.error('Notifications summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
