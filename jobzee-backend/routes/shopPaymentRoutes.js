const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { employerAuth } = require('../middleware/employerAuth');
const ShopPayment = require('../models/ShopPayment');

// Allow user or employer auth
const allowUserOrEmployer = (req, res, next) => {
  auth(req, res, (userErr) => {
    if (!userErr) return next();
    employerAuth(req, res, (empErr) => {
      if (!empErr) return next();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    });
  });
};

// GET /api/shop-payments - list payments for current user
router.get('/', allowUserOrEmployer, async (req, res) => {
  try {
    const query = { };
    if (req.user) { query.user = req.user.id; }
    else if (req.employer) { query.employer = req.employer.id; }
    const payments = await ShopPayment.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, payments });
  } catch (e) {
    console.error('List shop payments error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// GET /api/shop-payments/:id
router.get('/:id', allowUserOrEmployer, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user ? { user: req.user.id } : { employer: req.employer.id };
    const payment = await ShopPayment.findOne({ _id: id, ...owner }).lean();
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
});

module.exports = router;
