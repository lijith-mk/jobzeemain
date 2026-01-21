const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Product description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  
  // Pricing
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR', // Changed from 'USD' to 'INR' for Razorpay compatibility
    enum: ['USD', 'INR', 'EUR', 'GBP']
  },
  discount: {
    percentage: { type: Number, min: 0, max: 100 },
    amount: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date }
  },

  // Product Details
  category: { 
    type: String, 
    required: [true, 'Product category is required'],
    enum: [
      'Books', 'Courses', 'Templates', 'Tools', 'Certificates', 
      'Consultation', 'Resume Services', 'Interview Prep', 
      'Career Coaching', 'Skills Assessment', 'Other'
    ]
  },
  tags: [{ 
    type: String, 
    trim: true 
  }],
  brand: {
    type: String,
    trim: true
  },
  
  // Images and Media
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  video: {
    url: { type: String },
    thumbnail: { type: String }
  },

  // Inventory Management
  stock: { 
    type: Number, 
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  isUnlimited: {
    type: Boolean,
    default: false // For digital products
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Product Type & Delivery
  productType: {
    type: String,
    enum: ['physical', 'digital', 'service'],
    required: [true, 'Product type is required']
  },
  deliveryInfo: {
    type: { type: String, enum: ['instant', 'email', 'download', 'shipping'] },
    estimatedDelivery: { type: String }, // e.g., "2-3 business days"
    downloadLink: { type: String }, // For digital products
    instructions: { type: String }
  },

  // SEO and Marketing
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'draft'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Seller Information (Admin/Staff managed products)
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Product seller is required']
  },
  sellerName: {
    type: String,
    required: true
  },

  // Statistics
  views: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },

  // Reviews (Embedded for performance)
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer' },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    isVerifiedPurchase: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    isHidden: { type: Boolean, default: false }
  }],

  // Additional Features
  specifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true }
  }],
  faqs: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  
  // Timestamps for soft delete
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'rating.average': -1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount) return this.price;
  
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) return this.price;
  if (this.discount.endDate && now > this.discount.endDate) return this.price;
  
  if (this.discount.percentage) {
    return this.price * (1 - this.discount.percentage / 100);
  }
  if (this.discount.amount) {
    return Math.max(0, this.price - this.discount.amount);
  }
  return this.price;
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         this.isVisible && 
         (this.isUnlimited || this.stock > 0) &&
         !this.deletedAt;
});

// Pre-save middleware to generate slug
productSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure slug uniqueness
    const existingProduct = await this.constructor.findOne({ slug: this.slug });
    if (existingProduct) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { 
    category, 
    status: 'active', 
    isVisible: true,
    deletedAt: null
  };
  
  return this.find(query)
    .populate('seller', 'name email')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

productSchema.statics.getFeaturedProducts = function(limit = 10) {
  return this.find({ 
    isFeatured: true, 
    status: 'active', 
    isVisible: true,
    deletedAt: null
  })
  .populate('seller', 'name')
  .sort({ createdAt: -1 })
  .limit(limit);
};

productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
    isVisible: true,
    deletedAt: null
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.minPrice || options.maxPrice) {
    query.price = {};
    if (options.minPrice) query.price.$gte = options.minPrice;
    if (options.maxPrice) query.price.$lte = options.maxPrice;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .populate('seller', 'name')
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Instance methods
productSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  
  // Recalculate rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.incrementSales = function(quantity = 1) {
  this.sales += quantity;
  if (!this.isUnlimited) {
    this.stock = Math.max(0, this.stock - quantity);
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);