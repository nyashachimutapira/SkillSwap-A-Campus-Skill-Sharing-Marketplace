const express = require('express');
const { pool } = require('../server');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all skills (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, is_offering, search } = req.query;
    let query = `
      SELECT s.*, u.first_name, u.last_name, u.campus_location 
      FROM skills s 
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND s.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (is_offering !== undefined) {
      query += ` AND s.is_offering = $${paramCount}`;
      params.push(is_offering === 'true');
      paramCount++;
    }

    if (search) {
      query += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's skills
router.get('/my-skills', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create skill
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, credits_per_hour, is_offering } = req.body;

    const result = await pool.query(
      'INSERT INTO skills (user_id, name, description, category, credits_per_hour, is_offering) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, name, description, category, credits_per_hour, is_offering]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update skill
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, credits_per_hour, is_offering } = req.body;

    // Check ownership
    const skillCheck = await pool.query(
      'SELECT user_id FROM skills WHERE id = $1',
      [req.params.id]
    );

    if (skillCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skillCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      'UPDATE skills SET name = $1, description = $2, category = $3, credits_per_hour = $4, is_offering = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, description, category, credits_per_hour, is_offering, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete skill
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check ownership
    const skillCheck = await pool.query(
      'SELECT user_id FROM skills WHERE id = $1',
      [req.params.id]
    );

    if (skillCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skillCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM skills WHERE id = $1', [req.params.id]);
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Skill matching algorithm
router.get('/match/:skillName', async (req, res) => {
  try {
    const { skillName } = req.params;
    const { campus_location } = req.query;

    let query = `
      SELECT s.*, u.first_name, u.last_name, u.campus_location,
        (CASE WHEN s.name ILIKE $1 THEN 2 ELSE 1 END) +
        (CASE WHEN u.campus_location = $2 THEN 1 ELSE 0 END) as match_score
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_offering = true
        AND (s.name ILIKE $1 OR s.description ILIKE $1)
      ORDER BY match_score DESC, s.credits_per_hour ASC
      LIMIT 10
    `;

    const result = await pool.query(query, [`%${skillName}%`, campus_location]);
    res.json(result.rows);
  } catch (error) {
    console.error('Match skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
