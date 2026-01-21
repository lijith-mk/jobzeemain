const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');

// =============================
// Candidate Endpoints
// =============================

// GET /api/interviews/my - list interviews for authenticated candidate
exports.listCandidateInterviews = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const interviews = await Interview.find({ candidateId: req.user.id })
      .sort({ scheduledAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('applicationId', 'jobTitle companyName applicationStatus')
      .populate('jobId', 'title company location');

    return res.json({ interviews });
  } catch (err) {
    console.error('List candidate interviews error:', err);
    return res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};

// PATCH /api/interviews/:id/respond - candidate accepts/declines an interview
exports.respondToInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, note } = req.body;

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response. Use accepted or declined.' });
    }

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Ensure the authenticated user is the candidate for this interview
    if (interview.candidateId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    interview.candidateResponse = {
      status: response,
      note: note || interview.candidateResponse?.note || undefined,
      respondedAt: new Date()
    };

    await interview.save();

    return res.json({ message: 'Response recorded', interview });
  } catch (err) {
    console.error('Respond to interview error:', err);
    return res.status(500).json({ message: 'Failed to record response' });
  }
};

// Employer schedules an interview for an application (path param)
exports.scheduleInterview = async (req, res) => {
	try {
		const { applicationId } = req.params;
		const {
			round,
			scheduledAt,
			timezone,
			duration,
			locationType,
			locationDetails,
			interviewers,
		} = req.body;

		const application = await Application.findById(applicationId);
		if (!application) {
			return res.status(404).json({ message: 'Application not found' });
		}

		// Verify the employer owns the job
		const job = await Job.findOne({ _id: application.jobId, employerId: req.employer.id });
		if (!job) {
			return res.status(403).json({ message: 'Access denied' });
		}

		const interview = await Interview.create({
			jobId: application.jobId,
			applicationId: application._id,
			employerId: req.employer.id,
			candidateId: application.userId,
			round,
			scheduledAt: new Date(scheduledAt),
			timezone,
			duration,
			locationType,
			locationDetails,
			interviewers: Array.isArray(interviewers) ? interviewers : []
		});

		// Link interview to application and set status
		application.interviews = application.interviews || [];
		application.interviews.push(interview._id);
		application.applicationStatus = 'interview-scheduled';
		application.lastStatusUpdate = new Date();
		await application.save();

		// Also reflect in job.applicants status if present
		const jobApplicant = job.applicants.find(a => a.userId.toString() === application.userId.toString());
		if (jobApplicant) {
			jobApplicant.status = 'interview-scheduled';
			await job.save();
		}

		return res.status(201).json({ message: 'Interview scheduled', interview });
	} catch (err) {
		console.error('Schedule interview error:', err);
		return res.status(500).json({ message: 'Failed to schedule interview' });
	}
};

// Employer schedules an interview via POST /api/interviews
exports.createInterview = async (req, res) => {
	try {
		const {
			applicationId,
			round,
			scheduledAt,
			timezone,
			duration,
			locationType,
			locationDetails,
			note,
			interviewers
		} = req.body;

		const application = await Application.findById(applicationId);
		if (!application) {
			return res.status(404).json({ message: 'Application not found' });
		}

		const job = await Job.findOne({ _id: application.jobId, employerId: req.employer.id });
		if (!job) {
			return res.status(403).json({ message: 'Access denied' });
		}

		const interview = await Interview.create({
			jobId: application.jobId,
			applicationId: application._id,
			employerId: req.employer.id,
			candidateId: application.userId,
			round,
			scheduledAt: new Date(scheduledAt),
			timezone,
			duration,
			locationType,
			locationDetails,
			note,
			interviewers: Array.isArray(interviewers) ? interviewers : []
		});

		application.interviews = application.interviews || [];
		application.interviews.push(interview._id);
		application.applicationStatus = 'interview-scheduled';
		application.lastStatusUpdate = new Date();
		await application.save();

		const jobApplicant = job.applicants.find(a => a.userId.toString() === application.userId.toString());
		if (jobApplicant) {
			jobApplicant.status = 'interview-scheduled';
			await job.save();
		}

		return res.status(201).json({ message: 'Interview scheduled', interview });
	} catch (err) {
		console.error('Create interview error:', err);
		return res.status(500).json({ message: 'Failed to create interview' });
	}
};

// List interviews for the authenticated employer
exports.listEmployerInterviews = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const interviews = await Interview.find({ employerId: req.employer.id })
      .sort({ scheduledAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('applicationId', 'applicantName applicantEmail jobTitle companyName applicationStatus')
      .populate('jobId', 'title company location');
    res.json({ interviews });
  } catch (err) {
    console.error('List employer interviews error:', err);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};

// Alias: GET /api/interviews/employer/:employerId
exports.listByEmployerId = async (req, res) => {
  try {
    const { employerId } = req.params;
    if (req.employer.id.toString() !== employerId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { limit = 50, offset = 0 } = req.query;
    const interviews = await Interview.find({ employerId })
      .sort({ scheduledAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('applicationId', 'applicantName applicantEmail jobTitle companyName applicationStatus')
      .populate('jobId', 'title company location');
    res.json({ interviews });
  } catch (err) {
    console.error('List interviews by employerId error:', err);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};


