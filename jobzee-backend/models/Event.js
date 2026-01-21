const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['free', 'paid'], required: true },
    price: { type: Number, default: 0 },
    // Organizer contact info (displayed to users)
    organizerCompanyName: { type: String, trim: true },
    organizerEmail: { type: String, trim: true },
    organizerPhone: { type: String, trim: true },
    seatsLimit: { type: Number, default: null },
    mode: { type: String, enum: ['online', 'offline'], required: true },
    meetingLink: { type: String },
    venueAddress: { type: String },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    bannerUrl: { type: String },
    images: [{ type: String }],
    categories: [{ type: String }],
    tags: [{ type: String }],
    visibility: { type: String, enum: ['public', 'restricted'], default: 'public' },
    restrictedToRoles: [{ type: String }],
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    isActive: { type: Boolean, default: true },
    attendeesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);


