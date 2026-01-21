const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Job = require('./models/Job');
const Event = require('./models/Event');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const checkData = async () => {
  await connectDB();
  
  try {
    // Check jobs
    console.log('\n=== JOBS CHECK ===');
    const activeJobs = await Job.find({
      status: { $in: ['active', 'approved'] },
      expiresAt: { $gt: new Date() }
    });
    
    console.log(`Found ${activeJobs.length} active/approved jobs`);
    
    if (activeJobs.length > 0) {
      console.log('\nSample jobs:');
      activeJobs.slice(0, 3).forEach(job => {
        console.log(`- ${job.title} at ${job.company} (${job.status})`);
      });
    } else {
      console.log('No active jobs found');
      
      // Check if there are any jobs at all
      const allJobs = await Job.find({});
      console.log(`Total jobs in database: ${allJobs.length}`);
      
      if (allJobs.length > 0) {
        console.log('\nAll jobs status:');
        allJobs.forEach(job => {
          console.log(`- ${job.title}: ${job.status}, expires: ${job.expiresAt}`);
        });
      }
    }
    
    // Check events
    console.log('\n=== EVENTS CHECK ===');
    const activeEvents = await Event.find({
      status: 'approved',
      isActive: true
    });
    
    console.log(`Found ${activeEvents.length} approved and active events`);
    
    if (activeEvents.length > 0) {
      console.log('\nSample events:');
      activeEvents.slice(0, 3).forEach(event => {
        console.log(`- ${event.title} (${event.status}), mode: ${event.mode}`);
      });
    } else {
      console.log('No approved events found');
      
      // Check if there are any events at all
      const allEvents = await Event.find({});
      console.log(`Total events in database: ${allEvents.length}`);
      
      if (allEvents.length > 0) {
        console.log('\nAll events status:');
        allEvents.forEach(event => {
          console.log(`- ${event.title}: ${event.status}, active: ${event.isActive}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

checkData();