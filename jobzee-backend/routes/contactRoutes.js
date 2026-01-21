const express = require('express');
const router = express.Router();
const { createQuery } = require('../controllers/contactController');

router.post('/', createQuery);

module.exports = router;


