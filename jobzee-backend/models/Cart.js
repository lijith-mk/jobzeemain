const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative']
  },
  // Snapshot of product details at time of adding to cart
  productSnapshot: {
    name: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    isAvailable: { type: Boolean, default: true }
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  // User identification - either regular user or employer
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
  
  // Cart items
  items: [cartItemSchema],
  
  // Cart totals (calculated fields)
  subtotal: {
    type: Number,
    default: 0,
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
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative']
  },
  
  // Cart metadata
  currency: {
    type: String,
    default: 'INR', // Changed from 'USD' to 'INR' for Razorpay compatibility
    enum: ['USD', 'INR', 'EUR', 'GBP']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Session info for guest users (future feature)
  sessionId: {
    type: String,
    sparse: true
  },
  
  // Applied coupons or discounts
  appliedCoupons: [{
    code: { type: String, required: true },
    discount: { type: Number, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    appliedAt: { type: Date, default: Date.now }
  }],
  
  // Delivery/shipping info
  shippingInfo: {
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    method: {
      type: String,
      enum: ['standard', 'express', 'digital', 'pickup'],
      default: 'standard'
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Cart expiry (auto-cleanup old carts)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
cartSchema.index({ user: 1, isActive: 1 });
cartSchema.index({ employer: 1, isActive: 1 });
cartSchema.index({ userType: 1, isActive: 1 });
cartSchema.index({ sessionId: 1 }, { sparse: true });

// Virtual for total items count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique products count
cartSchema.virtual('productCount').get(function() {
  return this.items.length;
});

// Validation to ensure either user or employer is set
cartSchema.pre('validate', function(next) {
  if (this.userType === 'user' && !this.user) {
    return next(new Error('User ID is required when userType is "user"'));
  }
  if (this.userType === 'employer' && !this.employer) {
    return next(new Error('Employer ID is required when userType is "employer"'));
  }
  if ((this.user && this.employer) || (!this.user && !this.employer && !this.sessionId)) {
    return next(new Error('Cart must belong to either a user, employer, or have a session ID'));
  }
  next();
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    const price = item.discountedPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  // Calculate applied coupon discounts
  const couponDiscount = this.appliedCoupons.reduce((sum, coupon) => {
    if (coupon.type === 'percentage') {
      return sum + (this.subtotal * coupon.discount / 100);
    }
    return sum + coupon.discount;
  }, 0);
  
  this.discount = couponDiscount;
  
  // Calculate tax (simple 10% for now - can be made configurable)
  this.tax = (this.subtotal - this.discount) * 0.1;
  
  // Calculate total
  this.total = this.subtotal - this.discount + this.tax + (this.shippingInfo?.cost || 0);
  
  // Update last modified
  this.lastUpdated = new Date();
  
  next();
});

// Static methods
cartSchema.statics.findActiveCart = function(userId, userType) {
  const query = { isActive: true };
  query[userType] = userId;
  query.userType = userType;
  
  return this.findOne(query).populate('items.product');
};

cartSchema.statics.createCart = async function(userId, userType, items = []) {
  // Check if active cart exists
  let cart = await this.findActiveCart(userId, userType);
  
  if (!cart) {
    const cartData = {
      userType,
      items: [],
      isActive: true
    };
    cartData[userType] = userId;
    
    cart = new this(cartData);
  }
  
  // Add items if provided
  for (const item of items) {
    await cart.addItem(item.productId, item.quantity);
  }
  
  return cart.save();
};

cartSchema.statics.getCartStats = function(userId, userType) {
  const matchStage = { isActive: true };
  matchStage[userType] = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        totalValue: { $sum: '$total' },
        averageCartValue: { $avg: '$total' }
      }
    }
  ]);
};

// Instance methods
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product || !product.isAvailable) {
    throw new Error('Product is not available');
  }
  
  // Check stock for physical products
  if (!product.isUnlimited && product.stock < quantity) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }
  
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex((item) => {
    const itemPid = (item.product && item.product._id) ? item.product._id.toString() : item.product.toString();
    return itemPid === productId.toString();
  });
  
  if (existingItemIndex > -1) {
    // Update quantity of existing item
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    
    // Check stock again for the new quantity
    if (!product.isUnlimited && product.stock < newQuantity) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }
    
    this.items[existingItemIndex].quantity = newQuantity;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    const cartItem = {
      product: productId,
      quantity,
      price: product.price,
      discountedPrice: product.discountedPrice,
      productSnapshot: {
        name: product.name,
        image: product.images?.[0]?.url,
        category: product.category,
        isAvailable: product.isAvailable
      }
    };
    
    this.items.push(cartItem);
  }
  
  return this.save();
};

cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  if (quantity <= 0) {
    return this.removeItem(productId);
  }
  
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product || !product.isAvailable) {
    throw new Error('Product is not available');
  }
  
  // Check stock
  if (!product.isUnlimited && product.stock < quantity) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }
  
  const itemIndex = this.items.findIndex((item) => {
    const itemPid = (item.product && item.product._id) ? item.product._id.toString() : item.product.toString();
    return itemPid === productId.toString();
  });
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  this.items[itemIndex].quantity = quantity;
  this.items[itemIndex].addedAt = new Date();
  
  return this.save();
};

cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter((item) => {
    const itemPid = (item.product && item.product._id) ? item.product._id.toString() : item.product.toString();
    return itemPid !== productId.toString();
  });
  
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.appliedCoupons = [];
  this.discount = 0;
  
  return this.save();
};

cartSchema.methods.applyCoupon = function(couponCode, discount, type = 'percentage') {
  // Remove existing coupon if reapplying
  this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== couponCode);
  
  // Add new coupon
  this.appliedCoupons.push({
    code: couponCode,
    discount,
    type
  });
  
  return this.save();
};

cartSchema.methods.removeCoupon = function(couponCode) {
  this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== couponCode);
  
  return this.save();
};

cartSchema.methods.updateShippingInfo = function(shippingInfo) {
  this.shippingInfo = { ...this.shippingInfo, ...shippingInfo };
  
  return this.save();
};

cartSchema.methods.markInactive = function() {
  this.isActive = false;
  
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);