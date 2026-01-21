const Invoice = require('../models/Invoice');

// GET /api/invoices
const listInvoices = async (req, res) => {
	try {
		const { page = 1, limit = 10, startDate, endDate } = req.query;
		const skip = (page - 1) * limit;
		const match = { employerId: req.employer.id };

		if (startDate || endDate) {
			match.invoiceDate = {};
			if (startDate) match.invoiceDate.$gte = new Date(startDate);
			if (endDate) match.invoiceDate.$lte = new Date(endDate);
		}

		const [invoices, total] = await Promise.all([
			Invoice.find(match)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.lean(),
			Invoice.countDocuments(match)
		]);

		res.status(200).json({
			success: true,
			invoices,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total
			}
		});
	} catch (error) {
		console.error('Error listing invoices:', error);
		res.status(500).json({ success: false, message: 'Failed to list invoices' });
	}
};

// GET /api/invoices/:invoiceNumber
const getInvoice = async (req, res) => {
	try {
		const { invoiceNumber } = req.params;
		const invoice = await Invoice.findOne({ invoiceNumber, employerId: req.employer.id }).lean();
		if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
		res.status(200).json({ success: true, invoice });
	} catch (error) {
		console.error('Error getting invoice:', error);
		res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
	}
};

module.exports = { listInvoices, getInvoice };
