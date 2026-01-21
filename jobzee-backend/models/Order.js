const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  // Product snapshot at time of purchase
  productSnapshot: {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: String },
    sku: { type: String },
    productType: { type: String, enum: ['physical', 'digital', 'service'] }
  },
  // For digital products
  deliveryInfo: {
    downloadLink: { type: String },
    accessKey: { type: String },
    expiresAt: { type: Date },
    downloadCount: { type: Number, default: 0 },
    maxDownloads: { type: Number, default: 3 }
  },
  // Item-level status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  trackingInfo: {
    trackingNumber: { type: String },
    carrier: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date }
  }
}, { _id: true, timestamps: true });

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required']
  },
  
  // Customer information - either user or employer
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    sparse: true
  },
  userType: {
    type: String,
    enum: ['user', 'employer'],
    required: [true, 'User type is required']
  },
  
  // Customer snapshot (in case user details change)
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String }
  },
  
  // Order items
  items: [orderItemSchema],
  
  // Order totals
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'INR', 'EUR', 'GBP']
  },
  
  // Applied discounts/coupons
  appliedCoupons: [{
    code: { type: String, required: true },
    discount: { type: Number, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true }
  }],
  
  // Billing and shipping addresses
  billingAddress: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    landmark: { type: String }
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    landmark: { type: String }
  },
  
  // Order status and tracking
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'shipped', 
      'delivered', 'cancelled', 'refunded', 'partially_refunded'
    ],
    default: 'pending'
  },
  orderNotes: { type: String },
  adminNotes: { type: String }, // Internal notes for admin use
  
  // Payment information
  paymentInfo: {
    method: {
      type: String,
      enum: ['razorpay', 'stripe', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paidAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    refundAmount: { type: Number, default: 0 }
  },
  
  // Shipping information
  shippingInfo: {
    method: {
      type: String,
      enum: ['standard', 'express', 'digital', 'pickup'],
      default: 'standard'
    },
    provider: { type: String }, // e.g., "FedEx", "UPS", etc.
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date }
  },
  
  // Order timeline
  timeline: [{
    status: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'timeline.updatedByType'
    },
    updatedByType: {
      type: String,
      enum: ['User', 'Employer', 'Admin']
    }
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  },
  userAgent: { type: String },
  ipAddress: { type: String },
  
  // Special flags
  isGift: { type: Boolean, default: false },
  giftMessage: { type: String },
  isExpedited: { type: Boolean, default: false },
  requiresSignature: { type: Boolean, default: false },
  
  // Cancellation/Return information
  cancellation: {
    reason: { type: String },
    requestedAt: { type: Date },
    approvedAt: { type: Date },
    refundAmount: { type: Number },
    refundStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed']
    },
    notes: { type: String }
  },
  
  // Invoice information
  invoice: {
    number: { type: String },
    generatedAt: { type: Date },
    dueDate: { type: Date },
    url: { type: String } // URL to generated invoice PDF
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ employer: 1, createdAt: -1 });
orderSchema.index({ userType: 1, status: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ 'paymentInfo.razorpayOrderId': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for can cancel
orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status) && 
         !this.cancellation?.approvedAt;
});

// Virtual for can return
orderSchema.virtual('canReturn').get(function() {
  return this.status === 'delivered' && 
         this.orderAge <= 30 && // 30 days return policy
         !this.cancellation?.approvedAt;
});

// Ensure orderNumber exists before validation (required field)
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
    // Best-effort uniqueness check
    try {
      const existing = await this.constructor.findOne({ orderNumber: this.orderNumber });
      if (existing) {
        this.orderNumber = `${this.orderNumber}-${Date.now()}`;
      }
    } catch (_) {}
  }
  next();
});

// Pre-save middleware to update timeline
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      message: `Order status updated to ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

// Validation to ensure either user or employer is set
orderSchema.pre('validate', function(next) {
  if (this.userType === 'user' && !this.user) {
    return next(new Error('User ID is required when userType is "user"'));
  }
  if (this.userType === 'employer' && !this.employer) {
    return next(new Error('Employer ID is required when userType is "employer"'));
  }
  if (this.user && this.employer) {
    return next(new Error('Order cannot belong to both user and employer'));
  }
  next();
});

// Static methods
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

orderSchema.statics.findByCustomer = function(customerId, userType, options = {}) {
  const query = {};
  query[userType] = customerId;
  query.userType = userType;
  
  return this.find(query)
    .populate('items.product')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

orderSchema.statics.getOrderStats = function(customerId, userType, startDate, endDate) {
  const matchStage = {};
  matchStage[userType] = mongoose.Types.ObjectId(customerId);
  matchStage.userType = userType;
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        pendingOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'confirmed', 'processing']] }, 1, 0]
          }
        }
      }
    }
  ]);
};

orderSchema.statics.findPendingOrders = function() {
  return this.find({
    status: { $in: ['pending', 'confirmed'] },
    'paymentInfo.status': 'paid'
  })
  .populate('user employer', 'name email companyName companyEmail')
  .populate('items.product')
  .sort({ createdAt: -1 });
};

// Instance methods
orderSchema.methods.updateStatus = function(newStatus, message, updatedBy = null, updatedByType = null) {
  this.status = newStatus;
  
  const timelineEntry = {
    status: newStatus,
    message: message || `Order status updated to ${newStatus}`,
    timestamp: new Date()
  };
  
  if (updatedBy && updatedByType) {
    timelineEntry.updatedBy = updatedBy;
    timelineEntry.updatedByType = updatedByType;
  }
  
  this.timeline.push(timelineEntry);
  
  // Update specific timestamps
  if (newStatus === 'shipped') {
    this.shippingInfo.shippedAt = new Date();
  } else if (newStatus === 'delivered') {
    this.shippingInfo.deliveredAt = new Date();
  }
  
  return this.save();
};

// Removed updatePaymentStatus method to prevent ParallelSaveError
// Use findOneAndUpdate instead for atomic operations

orderSchema.methods.addTrackingInfo = function(trackingNumber, carrier, estimatedDelivery) {
  this.shippingInfo.trackingNumber = trackingNumber;
  this.shippingInfo.provider = carrier;
  if (estimatedDelivery) {
    this.shippingInfo.estimatedDelivery = estimatedDelivery;
  }
  
  this.timeline.push({
    status: this.status,
    message: `Tracking number assigned: ${trackingNumber}`,
    timestamp: new Date()
  });
  
  return this.save();
};

orderSchema.methods.requestCancellation = function(reason) {
  if (!this.canCancel) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  
  this.cancellation = {
    reason,
    requestedAt: new Date(),
    refundStatus: 'pending'
  };
  
  this.timeline.push({
    status: this.status,
    message: `Cancellation requested: ${reason}`,
    timestamp: new Date()
  });
  
  return this.save();
};

orderSchema.methods.approveCancellation = function(refundAmount = null) {
  this.cancellation.approvedAt = new Date();
  this.cancellation.refundAmount = refundAmount || this.total;
  this.cancellation.refundStatus = 'approved';
  
  this.updateStatus('cancelled', 'Order cancellation approved');
  
  return this.save();
};

orderSchema.methods.processRefund = function(refundAmount) {
  this.paymentInfo.refundAmount = (this.paymentInfo.refundAmount || 0) + refundAmount;
  this.paymentInfo.refundedAt = new Date();
  
  if (this.paymentInfo.refundAmount >= this.total) {
    this.paymentInfo.status = 'refunded';
    this.status = 'refunded';
  } else {
    this.paymentInfo.status = 'partially_refunded';
    this.status = 'partially_refunded';
  }
  
  this.timeline.push({
    status: this.status,
    message: `Refund processed: ${this.currency} ${refundAmount}`,
    timestamp: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);