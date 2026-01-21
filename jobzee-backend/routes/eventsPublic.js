const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const EventPayment = require('../models/EventPayment');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const { sendTicketEmail } = require('../utils/emailService');
const NotificationService = require('../services/notificationService');

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// GET /api/events?type=free|paid&mode=online|offline&date=upcoming|past&category=...&sort=recent|popular|price_low|price_high
router.get('/', async (req, res) => {
  try {
    const { type, mode, date, category, sort } = req.query;
    const filter = { status: 'approved', isActive: true };
    if (type === 'free') filter.type = 'free';
    if (type === 'paid') filter.type = 'paid';
    if (mode === 'online') filter.mode = 'online';
    if (mode === 'offline') filter.mode = 'offline';
    if (category) filter.$or = [{ categories: category }, { tags: category }];

    // Date filter
    const now = new Date();
    if (date === 'upcoming') filter.endDateTime = { $gte: now };
    if (date === 'past') filter.endDateTime = { $lt: now };

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'recent') sortOption = { startDateTime: 1 };
    if (sort === 'price_low') sortOption = { price: 1 };
    if (sort === 'price_high') sortOption = { price: -1 };
    // popularity placeholder: by attendeesCount desc
    if (sort === 'popular') sortOption = { attendeesCount: -1 };

    const events = await Event.find(filter).sort(sortOption).limit(100).lean();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Public events list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

module.exports = router;

// Get single approved event by id
// User stats for events (requires user auth)
router.get('/user/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const [totalApprovedEvents, myAgg] = await Promise.all([
      Event.countDocuments({ status: 'approved', isActive: true }),
      EventRegistration.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: null,
          uniqueEvents: { $addToSet: '$eventId' },
          certificates: { $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] } }
        } },
        { $project: { _id: 0, uniqueEventsCount: { $size: '$uniqueEvents' }, certificates: 1 } }
      ])
    ]);

    const my = myAgg[0] || { uniqueEventsCount: 0, certificates: 0 };
    res.json({ success: true, stats: {
      totalApprovedEvents,
      uniqueEvents: my.uniqueEventsCount,
      certificatesIssued: my.certificates
    }});
  } catch (error) {
    console.error('Public user stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user stats' });
  }
});

router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, status: 'approved', isActive: true }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    console.error('Public get event error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// Register for event (free and paid)
router.post('/:eventId/register', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findOne({ _id: eventId, status: 'approved', isActive: true }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.seatsLimit && event.attendeesCount >= event.seatsLimit) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    if (event.type === 'free') {
      const result = await EventRegistration.updateOne(
        { eventId, userId },
        {
          $setOnInsert: {
            ticketType: 'free',
            amountPaid: 0,
            currency: 'INR',
            paymentStatus: 'n/a',
            status: 'registered',
            ticketCode: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
          }
        },
        { upsert: true }
      );

      if (result?.upsertedCount === 1) {
        await Event.updateOne({ _id: eventId }, { $inc: { attendeesCount: 1 } });
      }
      
      // Always create ticket for free events (check if ticket already exists first)
      let ticket = await Ticket.findOne({ eventId, userId, status: 'valid' });
      if (!ticket) {
        ticket = await Ticket.create({
          eventId: new mongoose.Types.ObjectId(eventId),
          userId: new mongoose.Types.ObjectId(userId),
          employerId: new mongoose.Types.ObjectId(event.employerId),
          ticketType: 'Free',
          ticketPrice: 0,
          metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            source: 'web'
          }
        });
      }
      
      const doc = await EventRegistration.findOne({ eventId, userId }).lean();
      
      // Send ticket email
      try {
        const user = await User.findById(userId).select('name email').lean();
        if (user && user.email) {
          await sendTicketEmail(user.email, user.name, ticket, event);
          console.log('Ticket email sent successfully to:', user.email);
        }
      } catch (emailError) {
        console.error('Failed to send ticket email:', emailError);
        // Don't fail the registration if email fails
      }

      // Create notification for employer
      try {
        const user = await User.findById(userId).select('name').lean();
        if (user) {
          await NotificationService.notifyNewRegistration(
            event.employerId, 
            eventId, 
            event.title, 
            user.name
          );
        }
      } catch (notificationError) {
        console.error('Failed to create registration notification:', notificationError);
        // Don't fail the registration if notification fails
      }
      
      return res.json({ success: true, registration: doc, ticket });
    }

    const instance = getRazorpayInstance();
    if (!instance) return res.status(500).json({ success: false, message: 'Payments are not configured' });

    const amountPaise = Math.round(Number(event.price || 0) * 100);
    if (!amountPaise || amountPaise <= 0) return res.status(400).json({ success: false, message: 'Invalid event price' });

    // Razorpay receipt must be <= 40 chars. Use compact form: evt_<last6id>_<last10ts>
    const shortEventId = String(eventId).slice(-6);
    const shortTs = Date.now().toString().slice(-10);
    const receipt = `evt_${shortEventId}_${shortTs}`;
    const order = await instance.orders.create({ 
      amount: amountPaise, 
      currency: 'INR', 
      receipt, 
      notes: { eventId: String(eventId), userId: String(userId) } 
    });

    // Create event registration record
    const doc = await EventRegistration.findOneAndUpdate(
      { eventId, userId },
      {
        $set: {
          ticketType: 'paid',
          amountPaid: event.price,
          currency: 'INR',
          paymentStatus: 'pending',
          orderId: order.id,
          status: 'registered'
        },
        $setOnInsert: {
          ticketCode: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
        }
      },
      { new: true, upsert: true }
    );

    // Create event payment record
    const eventPayment = await EventPayment.create({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(userId),
      eventRegistrationId: doc._id,
      amount: event.price,
      currency: 'INR',
      razorpayOrderId: order.id,
      razorpayReceipt: receipt,
      status: 'initiated',
      eventTitle: event.title,
      eventType: event.type,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      notes: {
        eventId: String(eventId),
        userId: String(userId),
        eventMode: event.mode,
        eventStartDate: event.startDateTime
      }
    });

    return res.json({ 
      success: true, 
      order, 
      registration: doc, 
      paymentId: eventPayment._id,
      key: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error('Register event error:', error);
    res.status(500).json({ success: false, message: 'Failed to register for event' });
  }
});

// Verify payment for paid ticket
router.post('/:eventId/verify', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(500).json({ success: false, message: 'Payments are not configured' });

    const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    
    if (expected !== razorpay_signature) {
      // Update both EventRegistration and EventPayment records for failed payment
      await Promise.all([
        EventRegistration.findOneAndUpdate(
          { eventId, userId, orderId: razorpay_order_id },
          { $set: { paymentStatus: 'failed', paymentId: razorpay_payment_id } }
        ),
        EventPayment.updatePaymentStatus(razorpay_order_id, 'failed', {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          failureReason: 'Signature verification failed'
        })
      ]);
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update EventRegistration record
    const reg = await EventRegistration.findOneAndUpdate(
      { eventId, userId, orderId: razorpay_order_id },
      { $set: { paymentStatus: 'paid', paymentId: razorpay_payment_id } },
      { new: true }
    );
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    // Update EventPayment record
    const eventPayment = await EventPayment.updatePaymentStatus(razorpay_order_id, 'success', {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'razorpay', // You can extract this from Razorpay response if needed
      completedAt: new Date()
    });

    if (!eventPayment) {
      console.error('EventPayment record not found for order:', razorpay_order_id);
    }

    // Increment event attendees count
    await Event.updateOne({ _id: eventId }, { $inc: { attendeesCount: 1 } });
    
    // Get event details for ticket creation
    const event = await Event.findById(eventId);
    
    // Create ticket for paid event after successful payment (check if ticket already exists first)
    let ticket = await Ticket.findOne({ eventId, userId, status: 'valid' });
    if (!ticket) {
      ticket = await Ticket.create({
        eventId: new mongoose.Types.ObjectId(eventId),
        userId: new mongoose.Types.ObjectId(userId),
        employerId: new mongoose.Types.ObjectId(event.employerId),
        ticketType: 'Paid',
        ticketPrice: event.price,
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          source: 'web'
        }
      });
    }
    
    // Send ticket email
    try {
      const user = await User.findById(userId).select('name email').lean();
      if (user && user.email) {
        await sendTicketEmail(user.email, user.name, ticket, event);
        console.log('Ticket email sent successfully to:', user.email);
      }
    } catch (emailError) {
      console.error('Failed to send ticket email:', emailError);
      // Don't fail the payment if email fails
    }

    // Create notifications for employer
    try {
      const user = await User.findById(userId).select('name').lean();
      if (user) {
        // Notify about new registration
        await NotificationService.notifyNewRegistration(
          event.employerId, 
          eventId, 
          event.title, 
          user.name
        );
        
        // Notify about payment received
        await NotificationService.notifyPaymentReceived(
          event.employerId, 
          eventId, 
          event.title, 
          event.price, 
          user.name
        );
      }
    } catch (notificationError) {
      console.error('Failed to create payment notifications:', notificationError);
      // Don't fail the payment if notification fails
    }
    
    res.json({ 
      success: true, 
      registration: reg,
      payment: eventPayment,
      ticket
    });
  } catch (error) {
    console.error('Verify event payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

// Get my registration
router.get('/:eventId/registration', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const reg = await EventRegistration.findOne({ eventId, userId }).lean();
    res.json({ success: true, registration: reg || null });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registration' });
  }
});

// Get event payment details
router.get('/:eventId/payment', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const payment = await EventPayment.findOne({ eventId, userId })
      .populate('eventId', 'title type price startDateTime endDateTime')
      .populate('userId', 'name email')
      .lean();
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Get event payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
});

// Get all payments for a user
router.get('/user/payments', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    
    const payments = await EventPayment.find(filter)
      .populate('eventId', 'title type price startDateTime endDateTime bannerUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await EventPayment.countDocuments(filter);
    
    res.json({ 
      success: true, 
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// Get user's registered events (My Events)
router.get('/user/my-events', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    
    const registrations = await EventRegistration.find(filter)
      .populate('eventId', 'title description type price startDateTime endDateTime mode venueAddress meetingLink organizerCompanyName bannerUrl categories tags')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await EventRegistration.countDocuments(filter);
    
    res.json({ 
      success: true, 
      events: registrations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user events' });
  }
});

// GET /api/events/analytics - Get event analytics for employer


