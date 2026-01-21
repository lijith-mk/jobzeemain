const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const {
      title,
      description,
      type,
      price,
      seatsLimit,
      mode,
      meetingLink,
      venueAddress,
      startDateTime,
      endDateTime,
      bannerUrl,
      categories,
      tags,
      visibility,
      restrictedToRoles,
      organizerCompanyName,
      organizerEmail,
      organizerPhone
    } = req.body;

    if (!title || !description || !type || !mode || !startDateTime || !endDateTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (type === 'paid' && (!price || Number(price) <= 0)) {
      return res.status(400).json({ success: false, message: 'Price must be provided for paid events' });
    }

    if (mode === 'online' && !meetingLink) {
      return res.status(400).json({ success: false, message: 'Meeting link is required for online events' });
    }

    if (mode === 'offline' && !venueAddress) {
      return res.status(400).json({ success: false, message: 'Venue address is required for offline events' });
    }

    // Build organizer defaults from employer profile if not provided
    const trimOrNull = (v) => (typeof v === 'string' ? v.trim() : v);
    let orgCompany = trimOrNull(organizerCompanyName) || undefined;
    let orgEmail = trimOrNull(organizerEmail) || undefined;
    let orgPhone = trimOrNull(organizerPhone) || undefined;
    try {
      const Employer = require('../models/Employer');
      const employer = await Employer.findById(employerId).lean();
      if (employer) {
        if (!orgCompany) orgCompany = employer.companyName;
        if (!orgEmail) orgEmail = employer.companyEmail || employer.contactPersonEmail;
        if (!orgPhone) orgPhone = employer.companyPhone || employer.contactPersonPhone;
      }
    } catch {}

    const event = await Event.create({
      employerId,
      title,
      description,
      type,
      price: type === 'paid' ? price : 0,
      organizerCompanyName: orgCompany,
      organizerEmail: orgEmail,
      organizerPhone: orgPhone,
      seatsLimit: seatsLimit || null,
      mode,
      meetingLink: mode === 'online' ? meetingLink : undefined,
      venueAddress: mode === 'offline' ? venueAddress : undefined,
      startDateTime,
      endDateTime,
      bannerUrl,
      categories: Array.isArray(categories) ? categories : (categories ? [categories] : []),
      images: Array.isArray(req.body.images) ? req.body.images : (req.body.images ? String(req.body.images).split(',').map(s=>s.trim()).filter(Boolean) : []),
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      visibility: visibility || 'public',
      restrictedToRoles: visibility === 'restricted' ? (Array.isArray(restrictedToRoles) ? restrictedToRoles : (restrictedToRoles ? [restrictedToRoles] : ['jobseeker'])) : []
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

exports.listMyEvents = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const events = await Event.find({ employerId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, events });
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ success: false, message: 'Failed to list events' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, employerId }).lean();
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;
    const deleted = await Event.findOneAndDelete({ _id: eventId, employerId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;
    const update = { ...req.body };

    // Normalize fields
    if (update.type === 'paid') {
      if (!update.price || Number(update.price) <= 0) {
        return res.status(400).json({ success: false, message: 'Price must be provided for paid events' });
      }
    } else if (update.type === 'free') {
      update.price = 0;
    }

    if (update.mode === 'online') {
      if (!update.meetingLink) return res.status(400).json({ success: false, message: 'Meeting link is required for online events' });
      update.venueAddress = undefined;
    } else if (update.mode === 'offline') {
      if (!update.venueAddress) return res.status(400).json({ success: false, message: 'Venue address is required for offline events' });
      update.meetingLink = undefined;
    }

    if (update.categories && !Array.isArray(update.categories)) update.categories = [update.categories].filter(Boolean);
    if (update.images && !Array.isArray(update.images)) update.images = String(update.images).split(',').map(s=>s.trim()).filter(Boolean);
    if (update.tags && !Array.isArray(update.tags)) update.tags = [update.tags].filter(Boolean);
    if (update.visibility !== 'restricted') update.restrictedToRoles = [];

    // Any edit resets status to pending for re-approval
    update.status = 'pending';
    update.approvedBy = undefined;
    update.approvedAt = undefined;
    update.rejectionReason = undefined;

    const event = await Event.findOneAndUpdate(
      { _id: eventId, employerId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

exports.getMyEventStats = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const EventRegistration = require('../models/EventRegistration');

    const { Types } = require('mongoose');
    const employerObjectId = new Types.ObjectId(employerId);

    const [statusAgg, registrationsAgg] = await Promise.all([
      Event.aggregate([
        { $match: { employerId: employerObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      EventRegistration.aggregate([
        { $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'ev' } },
        { $unwind: '$ev' },
        { $match: { 'ev.employerId': employerObjectId } },
        { $group: {
            _id: null,
            registrations: { $sum: 1 },
            revenue: { $sum: { $cond: [ { $and: [ { $eq: ['$ticketType','paid'] }, { $eq: ['$paymentStatus','paid'] } ] }, '$amountPaid', 0 ] } }
        } }
      ])
    ]);

    const countsByStatus = statusAgg.reduce((acc, cur) => { acc[cur._id || 'unknown'] = cur.count; acc.total = (acc.total || 0) + cur.count; return acc; }, {});
    const reg = registrationsAgg[0] || { registrations: 0, revenue: 0 };

    res.json({ success: true, stats: {
      totalEvents: countsByStatus.total || 0,
      pendingApproval: countsByStatus.pending || 0,
      approvedEvents: countsByStatus.approved || 0,
      totalRegistrations: reg.registrations || 0,
      totalRevenue: reg.revenue || 0
    }});
  } catch (error) {
    console.error('Get employer event stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event stats' });
  }
};

exports.listMyEventRegistrations = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;
    const { Types } = require('mongoose');
    const EventRegistration = require('../models/EventRegistration');

    // Ensure event belongs to employer
    const owns = await Event.exists({ _id: eventId, employerId });
    if (!owns) return res.status(404).json({ success: false, message: 'Event not found' });

    const regs = await EventRegistration.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId) } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, status: 1, ticketType: 1, amountPaid: 1, currency: 1, paymentStatus: 1, ticketCode: 1, createdAt: 1, 'user.name': 1, 'user.email': 1 } },
      { $sort: { createdAt: -1 } }
    ]);

    res.json({ success: true, registrations: regs });
  } catch (error) {
    console.error('List my event registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};


