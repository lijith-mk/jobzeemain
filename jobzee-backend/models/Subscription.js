const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  planId: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  period: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time', 'forever'],
    default: 'monthly'
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  // Razorpay details
  orderId: { type: String, index: true },
  paymentId: { type: String },
  signature: { type: String },
  receipt: { type: String },

  // Lifecycle
  status: {
    type: String,
    enum: ['created', 'active', 'expired', 'cancelled', 'failed'],
    default: 'created',
    index: true
  },
  startDate: { type: Date },
  endDate: { type: Date },

  // Extra
  notes: { type: Map, of: String }
}, {
  timestamps: true
});

subscriptionSchema.index({ employerId: 1, createdAt: -1 });
subscriptionSchema.index({ employerId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);



