const mongoose = require('mongoose');

const shopPaymentSchema = new mongoose.Schema({
  // Linkages
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', sparse: true },
  userType: { type: String, enum: ['user', 'employer'], required: true },

  // Amount
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },

  // Gateway (Razorpay by default)
  gateway: { type: String, enum: ['razorpay', 'stripe', 'paypal', 'other'], default: 'razorpay' },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true, sparse: true },
  razorpaySignature: { type: String, sparse: true },

  // Status
  status: {
    type: String,
    enum: ['initiated', 'pending', 'success', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
    default: 'initiated',
    index: true
  },

  // Timestamps
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  failedAt: { type: Date },
  refundedAt: { type: Date },

  // Errors
  failureReason: { type: String },
  errorCode: { type: String },
  errorDescription: { type: String },

  // Meta
  userAgent: { type: String },
  ipAddress: { type: String },
  notes: { type: Map, of: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

shopPaymentSchema.index({ user: 1, createdAt: -1 });
shopPaymentSchema.index({ employer: 1, createdAt: -1 });

shopPaymentSchema.methods.markSuccessful = function(paymentId, signature){
  this.status = 'success';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.completedAt = new Date();
  return this.save();
};

shopPaymentSchema.methods.markFailed = function(reason, code, description){
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.errorCode = code;
  this.errorDescription = description;
  return this.save();
};

shopPaymentSchema.statics.getStats = function({ startDate, endDate } = {}){
  const match = {};
  if (startDate || endDate){
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ['$status','success'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status','failed'] }, 1, 0] } },
        amount: { $sum: '$amount' },
        successAmount: { $sum: { $cond: [{ $eq: ['$status','success'] }, '$amount', 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('ShopPayment', shopPaymentSchema);
