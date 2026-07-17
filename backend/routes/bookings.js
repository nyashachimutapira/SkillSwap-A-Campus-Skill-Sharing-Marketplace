const express = require('express');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
        requester.first_name as requester_name, 
        requester.last_name as requester_last_name,
        provider.first_name as provider_name,
        provider.last_name as provider_last_name,
        s.name as skill_name
      FROM bookings b
      JOIN users requester ON b.requester_id = requester.id
      JOIN users provider ON b.provider_id = provider.id
      JOIN skills s ON b.skill_id = s.id
      WHERE b.requester_id = $1 OR b.provider_id = $1
      ORDER BY b.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create booking request
router.post('/', auth, async (req, res) => {
  try {
    const { provider_id, skill_id, proposed_time, duration_minutes, notes } = req.body;

    // Check if requester has enough credits
    const skillResult = await pool.query(
      'SELECT credits_per_hour FROM skills WHERE id = $1',
      [skill_id]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const creditsPerHour = skillResult.rows[0].credits_per_hour;
    const creditsNeeded = Math.ceil((duration_minutes / 60) * creditsPerHour);

    const userResult = await pool.query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows[0].credit_balance < creditsNeeded) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    const result = await pool.query(
      'INSERT INTO bookings (requester_id, provider_id, skill_id, proposed_time, duration_minutes, notes, credits_transferred) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.userId, provider_id, skill_id, proposed_time, duration_minutes, notes, creditsNeeded]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Check if user is involved in booking
    const bookingCheck = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [req.params.id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    if (booking.requester_id !== req.userId && booking.provider_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Handle credit transfer on completion
    if (status === 'completed' && booking.status !== 'completed') {
      await pool.query('BEGIN');

      // Deduct credits from requester
      await pool.query(
        'UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2',
        [booking.credits_transferred, booking.requester_id]
      );

      // Add credits to provider
      await pool.query(
        'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2',
        [booking.credits_transferred, booking.provider_id]
      );

      // Record transactions
      await pool.query(
        'INSERT INTO credit_transactions (user_id, amount, transaction_type, booking_id, description) VALUES ($1, $2, $3, $4, $5)',
        [booking.requester_id, -booking.credits_transferred, 'spent', booking.id, 'Skill exchange']
      );

      await pool.query(
        'INSERT INTO credit_transactions (user_id, amount, transaction_type, booking_id, description) VALUES ($1, $2, $3, $4, $5)',
        [booking.provider_id, booking.credits_transferred, 'earned', booking.id, 'Skill exchange']
      );

      await pool.query('COMMIT');
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking status error:', error);
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
