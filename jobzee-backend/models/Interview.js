const mongoose = require('mongoose');

const interviewerSubSchema = new mongoose.Schema({
	name: { type: String, trim: true },
	email: { type: String, trim: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const feedbackSubSchema = new mongoose.Schema({
	evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	score: { type: Number, min: 0, max: 10 },
	comments: { type: String },
	createdAt: { type: Date, default: Date.now }
}, { _id: false });

const candidateResponseSubSchema = new mongoose.Schema({
	status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
	note: { type: String },
	respondedAt: { type: Date }
}, { _id: false });

const interviewSchema = new mongoose.Schema({
	jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
	applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
	employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	round: { type: String, trim: true },
	scheduledAt: { type: Date, required: true },
	timezone: { type: String, required: true },
	duration: { type: Number, min: 1 },
	locationType: { type: String, enum: ['online', 'in_person', 'phone', 'other'], required: true },
	locationDetails: { type: String },
	note: { type: String },
	interviewers: [interviewerSubSchema],
	candidateResponse: { type: candidateResponseSubSchema, default: () => ({}) },
	status: { type: String, enum: ['scheduled', 'rescheduled', 'cancelled', 'completed', 'no_show'], default: 'scheduled' },
	feedbacks: [feedbackSubSchema],
	result: { type: String, enum: ['pending', 'passed', 'failed', 'offered', 'hired'], default: 'pending' }
}, { timestamps: true });

// Helpful indexes
interviewSchema.index({ applicationId: 1, scheduledAt: -1 });
interviewSchema.index({ candidateId: 1, scheduledAt: -1 });
interviewSchema.index({ employerId: 1, scheduledAt: -1 });

module.exports = mongoose.model('Interview', interviewSchema);


