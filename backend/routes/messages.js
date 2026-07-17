const express = require('express');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const router = express.Router();

// Get conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT 
        CASE 
          WHEN sender_id = $1 THEN receiver_id 
          ELSE sender_id 
        END as other_user_id,
        u.first_name,
        u.last_name,
        u.profile_picture,
        MAX(m.created_at) as last_message_time
      FROM messages m
      JOIN users u ON CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END = u.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      GROUP BY other_user_id, u.first_name, u.last_name, u.profile_picture
      ORDER BY last_message_time DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages with specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, 
        sender.first_name as sender_name,
        sender.last_name as sender_last_name,
        receiver.first_name as receiver_name,
        receiver.last_name as receiver_last_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC`,
      [req.userId, req.params.userId]
    );

    // Mark messages as read
    await pool.query(
      'UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2',
      [req.userId, req.params.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver_id, content, booking_id } = req.body;

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content, booking_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, receiver_id, content, booking_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
