const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTicket,
  getTicketByTicketId,
  getUserTickets,
  getEventTickets,
  validateTicket,
  useTicket,
  cancelTicket,
  getEventTicketStats
} = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const { body, param, query } = require('express-validator');

// Public routes (no authentication required)
// Validate ticket using QR code (for event check-in)
router.post('/validate', [
  body('qrData').notEmpty().withMessage('QR data is required')
], validateTicket);

// Protected routes for users
router.use('/user', auth); // Apply user authentication middleware

// User ticket routes
router.get('/user/my-tickets', [
  query('status').optional().isIn(['valid', 'used', 'cancelled']).withMessage('Invalid status'),
  query('eventId').optional().isMongoId().withMessage('Invalid event ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getUserTickets);

router.get('/user/ticket/:ticketId', [
  param('ticketId').isMongoId().withMessage('Invalid ticket ID')
], getTicket);

router.get('/user/ticket-code/:ticketId', [
  param('ticketId').matches(/^TCKT-\d{8}-\d{4}$/).withMessage('Invalid ticket code format')
], getTicketByTicketId);

router.put('/user/ticket/:ticketId/cancel', [
  param('ticketId').isMongoId().withMessage('Invalid ticket ID')
], cancelTicket);

// Protected routes for employers
router.use('/employer', employerAuth); // Apply employer authentication middleware

// Employer ticket routes
router.post('/employer/create', [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('ticketType').isIn(['Free', 'Paid']).withMessage('Ticket type must be Free or Paid'),
  body('ticketPrice').optional().isFloat({ min: 0 }).withMessage('Ticket price must be a positive number'),
  body('source').optional().isIn(['web', 'mobile', 'api']).withMessage('Invalid source')
], createTicket);

router.get('/employer/event/:eventId/tickets', [
  param('eventId').isMongoId().withMessage('Invalid event ID'),
  query('status').optional().isIn(['valid', 'used', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getEventTickets);

router.get('/employer/event/:eventId/stats', [
  param('eventId').isMongoId().withMessage('Invalid event ID')
], getEventTicketStats);

router.put('/employer/ticket/:ticketId/use', [
  param('ticketId').isMongoId().withMessage('Invalid ticket ID')
], useTicket);

router.put('/employer/ticket/:ticketId/cancel', [
  param('ticketId').isMongoId().withMessage('Invalid ticket ID')
], cancelTicket);

router.get('/employer/ticket/:ticketId', [
  param('ticketId').isMongoId().withMessage('Invalid ticket ID')
], getTicket);

router.get('/employer/ticket-code/:ticketId', [
  param('ticketId').matches(/^TCKT-\d{8}-\d{4}$/).withMessage('Invalid ticket code format')
], getTicketByTicketId);

module.exports = router;












