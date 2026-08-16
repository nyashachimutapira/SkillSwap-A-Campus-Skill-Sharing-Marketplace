const express = require('express');
const Booking = require('../models/booking');
const Review = require('../models/review');
const auth = require('../middleware/auth');
const router = express.Router();

const serializeReview = (review) => {
  const data = review.toJSON ? review.toJSON() : review;
  return {
    ...data,
    reviewer_id: data.reviewer_id?.id || data.reviewer_id?._id || data.reviewer_id,
    reviewer_name: data.reviewer_id?.first_name,
    reviewer_last_name: data.reviewer_id?.last_name,
    reviewer_picture: data.reviewer_id?.profile_picture,
  };
};

// Get reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee_id: req.params.userId })
      .populate('reviewer_id', 'first_name last_name profile_picture')
      .sort({ created_at: -1 });

    res.json(reviews.map(serializeReview));
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { reviewee_id, booking_id, rating, comment } = req.body;

    const booking = await Booking.findOne({ _id: booking_id, status: 'completed' });
    if (!booking) {
      return res.status(400).json({ error: 'Booking must be completed to review' });
    }

    const isRequester = booking.requester_id.toString() === req.userId;
    const isProvider = booking.provider_id.toString() === req.userId;
    if (!isRequester && !isProvider) {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    const existingReview = await Review.exists({
      reviewer_id: req.userId,
      booking_id,
    });
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const review = await Review.create({
      reviewer_id: req.userId,
      reviewee_id,
      booking_id,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
