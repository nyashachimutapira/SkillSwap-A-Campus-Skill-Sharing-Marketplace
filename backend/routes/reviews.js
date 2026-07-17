const express = require('express');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const router = express.Router();

// Get reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, 
        reviewer.first_name as reviewer_name,
        reviewer.last_name as reviewer_last_name,
        reviewer.profile_picture as reviewer_picture
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { reviewee_id, booking_id, rating, comment } = req.body;

    // Check if booking exists and is completed
    const bookingCheck = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND status = $2',
      [booking_id, 'completed']
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Booking must be completed to review' });
    }

    const booking = bookingCheck.rows[0];

    // Check if user was part of the booking
    if (booking.requester_id !== req.userId && booking.provider_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    // Check if review already exists
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE reviewer_id = $1 AND booking_id = $2',
      [req.userId, booking_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (reviewer_id, reviewee_id, booking_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, reviewee_id, booking_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
