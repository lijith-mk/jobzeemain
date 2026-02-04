const mongoose = require('mongoose');

const courseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  // Payment details
  paymentId: {
    type: String,
    required: true,
    index: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'paid'
  },
  // Pricing details
  originalPrice: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    default: 18 // 18% GST in India
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Billing details
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    gstNumber: String
  },
  // Invoice metadata
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,
  notes: String,
  // PDF URL if generated
  pdfUrl: String,
  pdfPublicId: String,
  status: {
    type: String,
    enum: ['issued', 'void', 'refunded'],
    default: 'issued',
    index: true
  }
}, {
  timestamps: true
});

// Generate invoice number automatically
courseInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Count invoices for this month to generate unique number
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    
    // Format: CINV-YYYYMM-0001 (C for Course Invoice)
    this.invoiceNumber = `CINV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate tax amount if not set
  if (this.subtotal && this.taxPercentage && !this.taxAmount) {
    this.taxAmount = Math.round((this.subtotal * this.taxPercentage) / 100);
  }
  
  // Calculate total if not set
  if (!this.totalAmount && this.subtotal) {
    this.totalAmount = this.subtotal + (this.taxAmount || 0);
  }
  
  next();
});

// Indexes for faster queries
courseInvoiceSchema.index({ userId: 1, createdAt: -1 });
courseInvoiceSchema.index({ courseId: 1 });

module.exports = mongoose.model('CourseInvoice', courseInvoiceSchema);
