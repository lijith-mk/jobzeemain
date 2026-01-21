const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Core identifiers
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true,
    index: true
  },
  planId: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
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
    unique: true,
    index: true
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
  
  // Error tracking
  failureReason: { 
    type: String 
  },
  errorCode: { 
    type: String 
  },
  errorDescription: { 
    type: String 
  },
  
  // Refund information
  refundAmount: { 
    type: Number,
    default: 0,
    min: 0
  },
  refundReason: { 
    type: String 
  },
  refundId: { 
    type: String 
  },
  
  // Metadata
  userAgent: { 
    type: String 
  },
  ipAddress: { 
    type: String 
  },
  notes: { 
    type: Map, 
    of: String 
  },
  
  // Admin actions
  adminNotes: { 
    type: String 
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
paymentSchema.index({ employerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ initiatedAt: -1 });

// Virtual for payment duration
paymentSchema.virtual('paymentDuration').get(function() {
  if (this.completedAt && this.initiatedAt) {
    return this.completedAt - this.initiatedAt;
  }
  return null;
});

// Virtual for is successful
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'success';
});

// Virtual for is refunded
paymentSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded' || this.status === 'partially_refunded';
});

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(employerId, startDate, endDate) {
  const match = { employerId: new mongoose.Types.ObjectId(employerId) };
  
  if (startDate || endDate) {
    match.initiatedAt = {};
    if (startDate) match.initiatedAt.$gte = new Date(startDate);
    if (endDate) match.initiatedAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalAmount: { $sum: '$amount' },
        successfulAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] }
        },
        refundedAmount: { $sum: '$refundAmount' }
      }
    }
  ]);
};

// Instance method to mark as successful
paymentSchema.methods.markSuccessful = function(paymentId, signature, paymentMethod, paymentMethodDetails) {
  this.status = 'success';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.completedAt = new Date();
  this.paymentMethod = paymentMethod;
  this.paymentMethodDetails = paymentMethodDetails;
  return this.save();
};

// Instance method to mark as failed
paymentSchema.methods.markFailed = function(reason, errorCode, errorDescription) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.errorCode = errorCode;
  this.errorDescription = errorDescription;
  return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(refundAmount, refundReason, refundId, adminId) {
  this.refundAmount = refundAmount;
  this.refundReason = refundReason;
  this.refundId = refundId;
  this.refundedAt = new Date();
  this.processedBy = adminId;
  
  if (refundAmount >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);



