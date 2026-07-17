const express = require('express');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, bio, campus_location, profile_picture, credit_balance, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, campus_location, profile_picture } = req.body;

    const result = await pool.query(
      'UPDATE users SET bio = $1, campus_location = $2, profile_picture = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, email, first_name, last_name, bio, campus_location, profile_picture, credit_balance',
      [bio, campus_location, profile_picture, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, bio, campus_location, profile_picture, credit_balance, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
