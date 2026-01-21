const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['registered', 'cancelled', 'attended', 'no_show'], default: 'registered' },
    ticketType: { type: String, enum: ['free', 'paid'], default: 'free' },
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed', 'n/a'], default: 'n/a' },
    orderId: { type: String },
    paymentId: { type: String },
    ticketCode: { type: String },
    attendedAt: { type: Date }
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);



