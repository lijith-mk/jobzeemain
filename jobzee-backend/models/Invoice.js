const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true, index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },

  invoiceNumber: { type: String, required: true, unique: true, index: true },
  invoiceDate: { type: Date, default: Date.now },

  // Billing info snapshot
  billTo: {
    companyName: String,
    companyEmail: String,
    companyPhone: String,
    address: {
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },

  // Line item (single plan purchase)
  items: [{
    description: String,
    planId: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'] },
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    amount: Number
  }],

  subtotal: Number,
  taxRate: { type: Number, default: 0 }, // e.g., 18 for 18%
  taxAmount: { type: Number, default: 0 },
  totalAmount: Number,
  currency: { type: String, default: 'INR' },

  // PDF
  pdfUrl: { type: String },
  pdfPublicId: { type: String },

  notes: { type: String },
  status: { type: String, enum: ['issued', 'void'], default: 'issued', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);



