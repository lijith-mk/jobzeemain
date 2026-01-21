const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const Employer = require('../models/Employer');
const EventRegistration = require('../models/EventRegistration');

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { eventId, userId, ticketType, ticketPrice } = req.body;
    const employerId = req.employer?.id || req.user?.id; // Support both employer and user creation

    // Validation
    if (!eventId || !userId || !ticketType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId, userId, ticketType'
      });
    }

    if (!['Free', 'Paid'].includes(ticketType)) {
      return res.status(400).json({
        success: false,
        message: 'ticketType must be either "Free" or "Paid"'
      });
    }

    if (ticketType === 'Paid' && (!ticketPrice || ticketPrice <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'ticketPrice must be provided and greater than 0 for paid tickets'
      });
    }

    if (ticketType === 'Free' && ticketPrice && ticketPrice > 0) {
      return res.status(400).json({
        success: false,
        message: 'Free tickets must have price 0'
      });
    }

    // Verify event exists and is approved
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Tickets can only be created for approved events'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a ticket for this event
    const existingTicket = await Ticket.findOne({ eventId, userId, status: 'valid' });
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'User already has a valid ticket for this event'
      });
    }

    // Check event capacity if seats limit is set
    if (event.seatsLimit) {
      const ticketsCount = await Ticket.countDocuments({ 
        eventId, 
        status: { $in: ['valid', 'used'] } 
      });
      if (ticketsCount >= event.seatsLimit) {
        return res.status(400).json({
          success: false,
          message: 'Event is at full capacity'
        });
      }
    }

    // Create ticket
    const ticket = await Ticket.create({
      eventId,
      userId,
      employerId: event.employerId, // Use event's employer ID
      ticketType,
      ticketPrice: ticketType === 'Free' ? 0 : ticketPrice,
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        source: req.body.source || 'web'
      }
    });

    // Populate related data for response
    await ticket.populate([
      { path: 'eventId', select: 'title startDateTime endDateTime mode venueAddress meetingLink' },
      { path: 'userId', select: 'name email' },
      { path: 'employerId', select: 'companyName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};

// Get ticket by ID
exports.getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;
    const employerId = req.employer?.id;

    const ticket = await Ticket.findById(ticketId).populate([
      { path: 'eventId', select: 'title description startDateTime endDateTime mode venueAddress meetingLink organizerCompanyName organizerEmail organizerPhone' },
      { path: 'userId', select: 'name email phone' },
      { path: 'employerId', select: 'companyName companyEmail' }
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions - user can only see their own tickets, employer can see tickets for their events
    if (userId && ticket.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (employerId && ticket.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
};

// Get ticket by ticketId (human-friendly ID)
exports.getTicketByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;
    const employerId = req.employer?.id;


    const ticket = await Ticket.findOne({ ticketId }).populate([
      { path: 'eventId', select: 'title description startDateTime endDateTime mode venueAddress meetingLink organizerCompanyName organizerEmail organizerPhone' },
      { path: 'userId', select: 'name email phone' },
      { path: 'employerId', select: 'companyName companyEmail' }
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions - ensure user owns this ticket
    // Handle both populated and non-populated userId fields
    const ticketUserId = ticket.userId?._id ? ticket.userId._id.toString() : ticket.userId?.toString();
    const requestUserId = userId?.toString();
    
    if (userId && ticketUserId !== requestUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (employerId && ticket.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });

  } catch (error) {
    console.error('Get ticket by ticketId error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
};

// Get tickets for a user
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, eventId, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (eventId) query.eventId = eventId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate([
          { path: 'eventId', select: 'title startDateTime endDateTime mode venueAddress meetingLink organizerCompanyName' },
          { path: 'employerId', select: 'companyName' }
        ])
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
};

// Get tickets for an event (employer only)
exports.getEventTickets = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify event belongs to employer
    const event = await Event.findOne({ _id: eventId, employerId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const query = { eventId, employerId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate([
          { path: 'userId', select: 'name email phone' },
          { path: 'eventId', select: 'title startDateTime endDateTime' }
        ])
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event tickets'
    });
  }
};

// Validate ticket using QR code (for event check-in)
exports.validateTicket = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    // Verify QR data signature
    const qrInfo = Ticket.verifyQRData(qrData);
    if (!qrInfo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }

    const { ticketId, eventId, userId } = qrInfo;

    // Find ticket with full details
    const ticket = await Ticket.findOne({ ticketId, eventId, userId }).populate([
      { 
        path: 'eventId', 
        select: 'title description startDateTime endDateTime mode venueAddress meetingLink organizerCompanyName organizerEmail organizerPhone bannerUrl categories tags' 
      },
      { 
        path: 'userId', 
        select: 'name email phone' 
      },
      { 
        path: 'employerId', 
        select: 'companyName companyEmail' 
      }
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if ticket is valid
    if (ticket.status !== 'valid') {
      return res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status}`,
        ticket: {
          ticketId: ticket.ticketId,
          status: ticket.status,
          usedAt: ticket.usedAt,
          cancelledAt: ticket.cancelledAt
        }
      });
    }

    // Check if ticket is expired
    if (ticket.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has expired'
      });
    }

    res.json({
      success: true,
      message: 'Ticket is valid',
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        ticketType: ticket.ticketType,
        ticketPrice: ticket.ticketPrice,
        issuedAt: ticket.issuedAt,
        event: ticket.eventId,
        user: ticket.userId,
        employer: ticket.employerId
      }
    });

  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate ticket'
    });
  }
};

// Mark ticket as used
exports.useTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const employerId = req.employer.id;

    const ticket = await Ticket.findById(ticketId).populate('eventId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if employer owns the event
    if (ticket.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (ticket.status !== 'valid') {
      return res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status} and cannot be used`
      });
    }

    await ticket.markAsUsed();

    res.json({
      success: true,
      message: 'Ticket marked as used',
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        usedAt: ticket.usedAt
      }
    });

  } catch (error) {
    console.error('Use ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use ticket',
      error: error.message
    });
  }
};

// Cancel ticket
exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;
    const employerId = req.employer?.id;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions - user can cancel their own tickets, employer can cancel tickets for their events
    if (userId && ticket.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (employerId && ticket.employerId.toString() !== employerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (ticket.status !== 'valid') {
      return res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status} and cannot be cancelled`
      });
    }

    await ticket.cancel();

    res.json({
      success: true,
      message: 'Ticket cancelled successfully',
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        cancelledAt: ticket.cancelledAt
      }
    });

  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ticket',
      error: error.message
    });
  }
};

// Get ticket statistics for an event
exports.getEventTicketStats = async (req, res) => {
  try {
    const employerId = req.employer.id;
    const { eventId } = req.params;

    // Verify event belongs to employer
    const event = await Event.findOne({ _id: eventId, employerId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const stats = await Ticket.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          validTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'valid'] }, 1, 0] }
          },
          usedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
          },
          cancelledTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$ticketType', 'Paid'] }, '$ticketPrice', 0] }
          },
          freeTickets: {
            $sum: { $cond: [{ $eq: ['$ticketType', 'Free'] }, 1, 0] }
          },
          paidTickets: {
            $sum: { $cond: [{ $eq: ['$ticketType', 'Paid'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTickets: 0,
      validTickets: 0,
      usedTickets: 0,
      cancelledTickets: 0,
      totalRevenue: 0,
      freeTickets: 0,
      paidTickets: 0
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get event ticket stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics'
    });
  }
};







