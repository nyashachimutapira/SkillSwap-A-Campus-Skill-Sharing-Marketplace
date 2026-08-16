const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  content: { type: String, required: true, trim: true },
  is_read: { type: Boolean, default: false },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false,
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

messageSchema.virtual('id').get(function getId() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Message', messageSchema);
