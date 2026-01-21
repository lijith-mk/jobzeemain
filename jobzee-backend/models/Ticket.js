const mongoose = require('mongoose');
const crypto = require('crypto');
const QRCode = require('qrcode');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    index: true
  },
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
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true,
    index: true
  },
  ticketType: {
    type: String,
    enum: ['Free', 'Paid'],
    required: true
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  qrData: {
    type: String,
    unique: true
  },
  qrImageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['valid', 'used', 'cancelled'],
    default: 'valid',
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  // Additional metadata
  metadata: {
    ip: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ticketSchema.index({ eventId: 1, userId: 1 });
ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ employerId: 1, status: 1 });
ticketSchema.index({ issuedAt: -1 });

// Virtual for ticket age
ticketSchema.virtual('age').get(function() {
  return Date.now() - this.issuedAt.getTime();
});

// Virtual for isExpired (tickets expire after 1 year)
ticketSchema.virtual('isExpired').get(function() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return this.issuedAt < oneYearAgo;
});

// Static method to generate unique ticket ID
ticketSchema.statics.generateTicketId = function() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TCKT-${dateStr}-${randomNum}`;
};

// Static method to generate QR data with signature
ticketSchema.statics.generateQRData = function(ticketId, eventId, userId) {
  const data = `${ticketId}|${eventId}|${userId}`;
  const signature = crypto.createHmac('sha256', process.env.TICKET_SECRET || 'default-secret')
    .update(data)
    .digest('hex')
    .slice(0, 16);
  return `${data}|${signature}`;
};

// Static method to verify QR data
ticketSchema.statics.verifyQRData = function(qrData) {
  try {
    const parts = qrData.split('|');
    if (parts.length !== 4) return null;
    
    const [ticketId, eventId, userId, signature] = parts;
    const data = `${ticketId}|${eventId}|${userId}`;
    const expectedSignature = crypto.createHmac('sha256', process.env.TICKET_SECRET || 'default-secret')
      .update(data)
      .digest('hex')
      .slice(0, 16);
    
    if (signature !== expectedSignature) return null;
    
    return { ticketId, eventId, userId };
  } catch (error) {
    return null;
  }
};

// Static method to generate QR code image
ticketSchema.statics.generateQRCodeImage = async function(qrData) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Instance method to mark ticket as used
ticketSchema.methods.markAsUsed = function() {
  if (this.status === 'valid') {
    this.status = 'used';
    this.usedAt = new Date();
    return this.save();
  }
  throw new Error('Ticket cannot be marked as used');
};

// Instance method to cancel ticket
ticketSchema.methods.cancel = function() {
  if (this.status === 'valid') {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    return this.save();
  }
  throw new Error('Ticket cannot be cancelled');
};

// Pre-save middleware to generate ticket ID and QR data if not provided
ticketSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.ticketId) {
      this.ticketId = this.constructor.generateTicketId();
    }
    if (!this.qrData) {
      this.qrData = this.constructor.generateQRData(this.ticketId, this.eventId, this.userId);
    }
    if (!this.qrImageUrl) {
      try {
        this.qrImageUrl = await this.constructor.generateQRCodeImage(this.qrData);
      } catch (error) {
        console.error('Failed to generate QR code image:', error);
      }
    }
  }
  next();
});

// Pre-save middleware to validate ticket price based on type
ticketSchema.pre('save', function(next) {
  if (this.ticketType === 'Free' && this.ticketPrice > 0) {
    return next(new Error('Free tickets must have price 0'));
  }
  if (this.ticketType === 'Paid' && this.ticketPrice <= 0) {
    return next(new Error('Paid tickets must have price greater than 0'));
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
