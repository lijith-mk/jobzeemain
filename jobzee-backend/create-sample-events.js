const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Event = require('./models/Event');
const Employer = require('./models/Employer');

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

const createSampleEvents = async () => {
  await connectDB();
  
  try {
    // First, let's check if there are any employers in the database
    const employers = await Employer.find({});
    if (employers.length === 0) {
      console.log('❌ No employers found in database. Please create an employer first.');
      return;
    }
    
    const employerId = employers[0]._id;
    console.log(`Using employer: ${employers[0].companyName} (${employerId})`);
    
    // Create sample events
    const sampleEvents = [
      {
        title: "React Developer Workshop",
        description: "Join us for an intensive workshop on React development. Learn the latest features and best practices.",
        type: "free",
        mode: "online",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
        categories: ["Technology", "Web Development"],
        tags: ["React", "JavaScript", "Frontend"],
        employerId: employerId,
        status: "approved", // Pre-approve for visibility
        isActive: true,
        organizerCompanyName: employers[0].companyName,
        organizerEmail: employers[0].companyEmail,
        organizerPhone: employers[0].companyPhone
      },
      {
        title: "Career Fair 2025",
        description: "Annual career fair featuring top companies and networking opportunities for job seekers.",
        type: "free",
        mode: "offline",
        venueAddress: "Convention Center, Downtown, City",
        startDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours duration
        categories: ["Career", "Networking"],
        tags: ["Jobs", "Networking", "Opportunities"],
        employerId: employerId,
        status: "approved", // Pre-approve for visibility
        isActive: true,
        organizerCompanyName: employers[0].companyName,
        organizerEmail: employers[0].companyEmail,
        organizerPhone: employers[0].companyPhone
      },
      {
        title: "Advanced Node.js Masterclass",
        description: "Deep dive into advanced Node.js concepts, including performance optimization and security best practices.",
        type: "paid",
        price: 299,
        mode: "online",
        meetingLink: "https://zoom.us/j/1234567890",
        startDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        endDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
        categories: ["Technology", "Backend Development"],
        tags: ["Node.js", "JavaScript", "Backend"],
        employerId: employerId,
        status: "approved", // Pre-approve for visibility
        isActive: true,
        organizerCompanyName: employers[0].companyName,
        organizerEmail: employers[0].companyEmail,
        organizerPhone: employers[0].companyPhone
      }
    ];
    
    // Insert the sample events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`✅ Created ${createdEvents.length} sample events:`);
    
    createdEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.type}, ${event.mode})`);
    });
    
    console.log('\n🎉 Events created successfully! Users should now see events when they visit the events page.');
    
  } catch (error) {
    console.error('Error creating sample events:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

createSampleEvents();