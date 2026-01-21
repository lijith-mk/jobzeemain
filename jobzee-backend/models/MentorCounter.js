const mongoose = require('mongoose');

const mentorCounterSchema = new mongoose.Schema({
  name: { type: String, default: 'mentorCounter' },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

mentorCounterSchema.statics.nextMentorId = async function() {
  const counter = await this.findOneAndUpdate(
    { name: 'mentorCounter' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqPadded = String(counter.seq).padStart(4, '0');
  return `MENTOR-${seqPadded}`;
};

module.exports = mongoose.model('MentorCounter', mentorCounterSchema);

