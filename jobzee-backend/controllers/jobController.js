const Job = require('../models/Job');
const UserNotification = require('../models/UserNotification');
const User = require('../models/User');

// Report a job as suspicious
exports.reportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason = 'other', details = '' } = req.body || {};

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Prevent duplicate reports from the same user
    const alreadyReported = job.reports?.some(r => String(r.userId) === String(req.user.id));
    if (alreadyReported) {
      return res.status(409).json({ message: 'You have already reported this job' });
    }

    job.reports.push({
      userId: req.user.id,
      reason,
      details: String(details).trim().slice(0, 1000)
    });
    job.reportCount = (job.reportCount || 0) + 1;

    // Flag job when threshold reached (e.g., 3 reports)
    const FLAG_THRESHOLD = 3;
    if (job.reportCount >= FLAG_THRESHOLD) {
      job.isFlagged = true;
      if (job.status === 'active') {
        job.status = 'pending';
      }
    }

    await job.save();

    return res.status(201).json({
      message: 'Report submitted successfully',
      reportCount: job.reportCount,
      isFlagged: job.isFlagged
    });
  } catch (err) {
    console.error('Report job error:', err);
    return res.status(500).json({ message: 'Failed to submit report' });
  }
};

// Create job match notifications for users when new jobs are posted
exports.createJobMatchNotifications = async (jobId) => {
  try {
    const job = await Job.findById(jobId);
    if (!job) return;

    // Find users whose skills match the job requirements
    const matchingUsers = await User.find({
      $or: [
        { 'skills': { $in: job.skills } },
        { 'preferences.industries': job.industry },
        { 'location': { $regex: job.location, $options: 'i' } }
      ]
    }).limit(50); // Limit to avoid spam

    // Create notifications for matching users
    const notifications = matchingUsers.map(user => ({
      userId: user._id,
      type: 'job_match',
      title: 'New job match found!',
      message: `${job.title} at ${job.company} matches your profile`,
      data: { jobId, matchReason: 'Skills/Industry/Location match' },
      priority: 'medium'
    }));

    if (notifications.length > 0) {
      await UserNotification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Create job match notifications error:', error);
  }
};


