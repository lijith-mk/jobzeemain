const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

invoiceCounterSchema.statics.nextInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const counter = await this.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqPadded = String(counter.seq).padStart(4, '0');
  return `INV-${year}-${seqPadded}`;
};

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema);



