const mongoose = require('mongoose');

const ContactQuerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /.+@.+\..+/
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    },
    metadata: {
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
      origin: { type: String, default: null }
    }
  },
  { timestamps: true }
);

ContactQuerySchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('ContactQuery', ContactQuerySchema);


