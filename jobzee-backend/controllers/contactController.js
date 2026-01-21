const ContactQuery = require('../models/ContactQuery');

exports.createQuery = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errorType: 'validation_error'
      });
    }

    const doc = await ContactQuery.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      metadata: {
        ip: req.ip || null,
        userAgent: req.get('User-Agent') || null,
        origin: req.get('Origin') || null
      }
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return next(err);
  }
};


