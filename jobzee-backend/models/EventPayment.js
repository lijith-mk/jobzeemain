const mongoose = require('mongoose');

const eventPaymentSchema = new mongoose.Schema({
  // Core identifiers
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventRegistrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventRegistration',
    required: true,
    index: true
  },
  
  // Transaction details
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    default: 'INR',
    required: true
  },
  
  // Razorpay transaction data
  razorpayOrderId: { 
    type: String, 
    required: true,
    unique: true
  },
  razorpayPaymentId: { 
    type: String,
    sparse: true, // Only present for successful payments
    index: true
  },
  razorpaySignature: { 
    type: String,
    sparse: true
  },
  razorpayReceipt: { 
    type: String,
    required: true
  },
  
  // Payment status and lifecycle
  status: {
    type: String,
    enum: [
      'initiated',    // Order created, payment not attempted
      'pending',      // Payment initiated, waiting for completion
      'success',      // Payment completed successfully
      'failed',       // Payment failed
      'cancelled',    // User cancelled payment
      'refunded',     // Payment was refunded
      'partially_refunded', // Partial refund
      'disputed'      // Payment under dispute
    ],
    default: 'initiated',
    required: true,
    index: true
  },
  
  // Payment method details
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'other'],
    default: 'other'
  },
  paymentMethodDetails: {
    type: String, // e.g., "Visa ending in 1234", "UPI ID", "HDFC Bank"
    default: ''
  },
  
  // Timestamps for different stages
  initiatedAt: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  completedAt: { 
    type: Date 
  },
  failedAt: { 
    type: Date 
  },
  refundedAt: { 
    type: Date 
  },
  
  // Additional metadata
  failureReason: { 
    type: String 
  },
  refundReason: { 
    type: String 
  },
  refundAmount: { 
    type: Number,
    min: 0
  },
  
  // User and system information
  userAgent: { 
    type: String 
  },
  ipAddress: { 
    type: String 
  },
  
  // Event-specific information
  eventTitle: { 
    type: String,
    required: true
  },
  eventType: { 
    type: String,
    enum: ['free', 'paid'],
    required: true
  },
  
  // Notes and additional data
  notes: { 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventPaymentSchema.index({ eventId: 1, userId: 1 });
eventPaymentSchema.index({ status: 1, createdAt: -1 });
eventPaymentSchema.index({ razorpayOrderId: 1 });

// Static methods
eventPaymentSchema.statics.createPayment = async function(paymentData) {
  return await this.create(paymentData);
};

eventPaymentSchema.statics.findByOrderId = async function(orderId) {
  return await this.findOne({ razorpayOrderId: orderId });
};

eventPaymentSchema.statics.findByEventAndUser = async function(eventId, userId) {
  return await this.findOne({ eventId, userId });
};

eventPaymentSchema.statics.updatePaymentStatus = async function(orderId, status, additionalData = {}) {
  const updateData = { status, ...additionalData };
  
  if (status === 'success') {
    updateData.completedAt = new Date();
  } else if (status === 'failed') {
    updateData.failedAt = new Date();
  } else if (status === 'refunded') {
    updateData.refundedAt = new Date();
  }
  
  return await this.findOneAndUpdate(
    { razorpayOrderId: orderId },
    { $set: updateData },
    { new: true }
  );
};

module.exports = mongoose.model('EventPayment', eventPaymentSchema);
