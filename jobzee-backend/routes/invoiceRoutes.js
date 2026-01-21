const express = require('express');
const router = express.Router();
const { listInvoices, getInvoice } = require('../controllers/invoiceController');
const { employerAuth } = require('../middleware/employerAuth');

router.get('/', employerAuth, listInvoices);
router.get('/:invoiceNumber', employerAuth, getInvoice);

module.exports = router;



