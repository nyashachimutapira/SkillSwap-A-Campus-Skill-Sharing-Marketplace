const express = require('express');
const Skill = require('../models/skill');
const auth = require('../middleware/auth');
const router = express.Router();

const serializeSkill = (skill) => {
  const data = skill.toJSON ? skill.toJSON() : skill;
  const user = data.user_id || {};

  return {
    ...data,
    user_id: user.id || user._id || data.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    campus_location: user.campus_location,
  };
};

// Get all skills (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, is_offering, search } = req.query;
    const filters = {};

    if (category) {
      filters.category = category;
    }

    if (is_offering !== undefined) {
      filters.is_offering = is_offering === 'true';
    }

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skills = await Skill.find(filters)
      .populate('user_id', 'first_name last_name campus_location')
      .sort({ created_at: -1 });

    res.json(skills.map(serializeSkill));
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's skills
router.get('/my-skills', auth, async (req, res) => {
  try {
    const skills = await Skill.find({ user_id: req.userId }).sort({ created_at: -1 });
    res.json(skills);
  } catch (error) {
    console.error('Get my skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create skill
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, credits_per_hour, is_offering } = req.body;

    const skill = await Skill.create({
      user_id: req.userId,
      name,
      description,
      category,
      credits_per_hour,
      is_offering,
    });

    res.status(201).json(skill);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update skill
router.put('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skill.user_id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updatedSkill);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete skill
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skill.user_id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await skill.deleteOne();
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
    const regex = new RegExp(skillName, 'i');

    const skills = await Skill.find({
      is_offering: true,
      $or: [{ name: regex }, { description: regex }],
    }).populate('user_id', 'first_name last_name campus_location');

    const rankedSkills = skills
      .map((skill) => {
        const data = serializeSkill(skill);
        const nameScore = regex.test(data.name) ? 2 : 1;
        const locationScore = data.campus_location === campus_location ? 1 : 0;
        return { ...data, match_score: nameScore + locationScore };
      })
      .sort((a, b) => b.match_score - a.match_score || a.credits_per_hour - b.credits_per_hour)
      .slice(0, 10);

    res.json(rankedSkills);
  } catch (error) {
    console.error('Match skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
