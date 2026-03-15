require('dotenv').config();
const mongoose = require('mongoose');
const Employer = require('../models/Employer');
const Job = require('../models/Job');

async function run() {
  const email = (process.argv[2] || '').toLowerCase().trim();
  if (!email) {
    console.error('Usage: node scripts/checkEmployerJobCount.js employer@email.com');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv')
    ? process.env.MONGODB_URI
    : process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Mongo URI missing in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    const employer = await Employer.findOne({ companyEmail: email });
    if (!employer) {
      console.log(`Employer not found for ${email}`);
      process.exit(0);
    }

    const total = await Job.countDocuments({ employerId: employer._id });
    const byStatus = await Job.aggregate([
      { $match: { employerId: employer._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const latest = await Job.find({ employerId: employer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status createdAt');

    console.log('Employer:', employer.companyName, `(${employer.companyEmail})`, employer._id.toString());
    console.log('Total jobs:', total);
    console.log('Status breakdown:', byStatus);
    console.log('Latest 10 titles:');
    latest.forEach((job, idx) => {
      console.log(`${idx + 1}. ${job.title} [${job.status}] ${job.createdAt?.toISOString?.() || job.createdAt}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

run();
