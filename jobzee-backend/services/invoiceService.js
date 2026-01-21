const PDFDocument = require('pdfkit');
const { WritableStreamBuffer } = require('stream-buffers');
const cloudinary = require('../config/cloudinary');
const InvoiceCounter = require('../models/InvoiceCounter');
const Invoice = require('../models/Invoice');
const Employer = require('../models/Employer');
const emailService = require('./emailService');

async function generateInvoiceNumber() {
	return await InvoiceCounter.nextInvoiceNumber();
}

function renderInvoicePdf(invoiceData) {
	const doc = new PDFDocument({ size: 'A4', margin: 50 });
	const streamBuffer = new WritableStreamBuffer();
	doc.pipe(streamBuffer);

	// Header
	doc
		.fontSize(20)
		.fillColor('#111827')
		.text('Invoice', { align: 'left' })
		.moveDown(0.5);

	// Meta
	doc
		.fontSize(10)
		.fillColor('#374151')
		.text(`Invoice No: ${invoiceData.invoiceNumber}`)
		.text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`)
		.text(`Currency: ${invoiceData.currency}`)
		.moveDown(1);

	// Bill To
	doc
		.fontSize(12)
		.fillColor('#111827')
		.text('Bill To:', { underline: true })
		.moveDown(0.3)
		.fontSize(10)
		.fillColor('#374151')
		.text(invoiceData.billTo.companyName)
		.text(invoiceData.billTo.companyEmail)
		.text(invoiceData.billTo.companyPhone || '')
		.text(`${invoiceData.billTo.address?.address || ''}`)
		.text(`${invoiceData.billTo.address?.city || ''}, ${invoiceData.billTo.address?.state || ''} ${invoiceData.billTo.address?.zipCode || ''}`)
		.text(`${invoiceData.billTo.address?.country || ''}`)
		.moveDown(1);

	// Items Table
	doc
		.fontSize(12)
		.fillColor('#111827')
		.text('Description', 50, doc.y)
		.text('Qty', 350, doc.y)
		.text('Unit Price', 400, doc.y)
		.text('Amount', 480, doc.y)
		.moveDown(0.5);

	doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#E5E7EB');

	invoiceData.items.forEach((item) => {
		doc.moveDown(0.5);
		doc.fontSize(10).fillColor('#374151');
		doc.text(item.description, 50, doc.y);
		doc.text(String(item.quantity), 350, doc.y);
		doc.text(item.unitPrice.toFixed(2), 400, doc.y);
		doc.text(item.amount.toFixed(2), 480, doc.y);
	});

	doc.moveDown(1);
	doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#E5E7EB');
	
	// Totals
	doc.moveDown(0.5);
	doc.fontSize(10).fillColor('#111827');
	doc.text(`Subtotal: ${invoiceData.subtotal.toFixed(2)}`, 400, doc.y, { align: 'left' });
	doc.text(`Tax (${invoiceData.taxRate}%): ${invoiceData.taxAmount.toFixed(2)}`, 400, doc.y, { align: 'left' });
	doc.text(`Total: ${invoiceData.totalAmount.toFixed(2)}`, 400, doc.y, { align: 'left' });

	// Footer
	doc.moveDown(2);
	doc.fontSize(9).fillColor('#6B7280');
	doc.text('Thank you for your business!', { align: 'center' });

	doc.end();
	return new Promise((resolve, reject) => {
		streamBuffer.on('finish', () => {
			try {
				const buffer = streamBuffer.getContents();
				resolve(buffer);
			} catch (error) {
				reject(new Error(`Failed to get PDF buffer: ${error.message}`));
			}
		});
		
		streamBuffer.on('error', (error) => {
			reject(new Error(`PDF generation error: ${error.message}`));
		});
	});
}

async function uploadInvoiceToCloudinary(pdfBuffer, invoiceNumber) {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload_stream({
			resource_type: 'raw',
			folder: 'jobzee/invoices',
			public_id: invoiceNumber,
			format: 'pdf'
		}, (error, result) => {
			if (error) return reject(error);
			resolve(result);
		}).end(pdfBuffer);
	});
}

async function createAndSendInvoice({ employerId, payment, subscription, plan }) {
	const employer = await Employer.findById(employerId).lean();
	if (!employer) throw new Error('Employer not found for invoice');

	const invoiceNumber = await generateInvoiceNumber();

	const taxRate = Number(process.env.GST_RATE || 18);
	const subtotal = Number(payment.amount || 0);
	const taxAmount = Math.round((subtotal * taxRate) / 100);
	const totalAmount = subtotal + taxAmount;

	const invoiceDoc = {
		employerId,
		paymentId: payment._id,
		subscriptionId: subscription?._id,
		invoiceNumber,
		invoiceDate: new Date(),
		billTo: {
			companyName: employer.companyName,
			companyEmail: employer.companyEmail,
			companyPhone: employer.companyPhone,
			address: employer.headquarters || {}
		},
		items: [{
			description: `${plan?.name || plan?.planId || 'Subscription'} Plan`,
			planId: plan?.planId,
			quantity: 1,
			unitPrice: subtotal,
			amount: subtotal
		}],
		subtotal,
		taxRate,
		taxAmount,
		totalAmount,
		currency: payment.currency || 'INR',
		status: 'issued'
	};

	let pdfBuffer, upload;
	try {
		pdfBuffer = await renderInvoicePdf(invoiceDoc);
		upload = await uploadInvoiceToCloudinary(pdfBuffer, invoiceNumber);
	} catch (error) {
		console.error('Invoice generation failed:', error);
		throw new Error(`Invoice generation failed: ${error.message}`);
	}

	invoiceDoc.pdfUrl = upload.secure_url;
	invoiceDoc.pdfPublicId = upload.public_id;

	const saved = await Invoice.create(invoiceDoc);

	// Email invoice (if email configured)
	try {
		if (emailService && emailService.isConfigured) {
			await emailService.transporter.sendMail({
				from: emailService.getEmailConfig().from,
				to: employer.companyEmail,
				subject: `Invoice ${invoiceNumber} - ${emailService.getEmailConfig().appName}`,
				text: `Hi ${employer.companyName},\n\nAttached is your invoice ${invoiceNumber}.\nTotal: ${totalAmount} ${invoiceDoc.currency}.`,
				html: `<p>Hi ${employer.companyName},</p><p>Please find your invoice <strong>${invoiceNumber}</strong>.</p><p>Total: <strong>${totalAmount} ${invoiceDoc.currency}</strong>.</p><p>You can also download it <a href="${upload.secure_url}">here</a>.</p>`,
				attachments: [
					{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
				]
			});
		}
	} catch (e) {
		console.warn('Failed to email invoice:', e?.message || e);
	}

	return saved;
}

module.exports = {
	createAndSendInvoice
};



