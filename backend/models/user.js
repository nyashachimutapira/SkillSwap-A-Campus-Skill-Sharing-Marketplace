const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password_hash: { type: String, required: true },
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  bio: { type: String, trim: true, default: '' },
  campus_location: { type: String, trim: true, default: '' },
  profile_picture: { type: String, trim: true, default: '' },
  availability: { type: String, trim: true, default: '' },
  credit_balance: { type: Number, default: 0 },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.virtual('id').get(function getId() {
  return this._id.toHexString();
});

userSchema.virtual('skills', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'user_id',
});

module.exports = mongoose.model('User', userSchema);
