const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  requester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  proposed_time: { type: Date, required: true },
  duration_minutes: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  credits_transferred: { type: Number, default: 0 },
  notes: { type: String, trim: true, default: '' },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

bookingSchema.virtual('id').get(function getId() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Booking', bookingSchema);
