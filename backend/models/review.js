const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, default: '' },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false,
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.index({ reviewer_id: 1, booking_id: 1 }, { unique: true });

reviewSchema.virtual('id').get(function getId() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Review', reviewSchema);
