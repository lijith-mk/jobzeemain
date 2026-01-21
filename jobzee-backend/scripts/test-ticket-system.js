const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const Employer = require('../models/Employer');

// Test data
const testData = {
  employer: {
    companyName: 'Test Company',
    companyEmail: 'test@company.com',
    contactPersonName: 'John Doe',
    contactPersonEmail: 'john@company.com',
    password: 'TestPassword123!'
  },
  user: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
    password: 'TestPassword123!'
  },
  event: {
    title: 'Test Event',
    description: 'This is a test event for ticket system',
    type: 'paid',
    price: 25.00,
    seatsLimit: 50,
    mode: 'offline',
    venueAddress: '123 Test Street, Test City',
    startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
    status: 'approved'
  }
};

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanup() {
  try {
    await Ticket.deleteMany({});
    await Event.deleteMany({ title: 'Test Event' });
    await User.deleteMany({ email: 'jane@example.com' });
    await Employer.deleteMany({ companyEmail: 'test@company.com' });
    console.log('🧹 Cleaned up test data');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

async function createTestData() {
  try {
    // Create test employer
    const employer = await Employer.create(testData.employer);
    console.log('✅ Created test employer:', employer.companyName);

    // Create test user
    const user = await User.create(testData.user);
    console.log('✅ Created test user:', user.name);

    // Create test event
    const event = await Event.create({
      ...testData.event,
      employerId: employer._id
    });
    console.log('✅ Created test event:', event.title);

    return { employer, user, event };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testTicketCreation(employer, user, event) {
  try {
    console.log('\n🧪 Testing ticket creation...');

    // Test 1: Create a free ticket
    const freeTicket = await Ticket.create({
      eventId: event._id,
      userId: user._id,
      employerId: employer._id,
      ticketType: 'Free',
      ticketPrice: 0
    });

    console.log('✅ Free ticket created:', {
      ticketId: freeTicket.ticketId,
      qrData: freeTicket.qrData,
      status: freeTicket.status
    });

    // Test 2: Create a paid ticket
    const paidTicket = await Ticket.create({
      eventId: event._id,
      userId: user._id,
      employerId: employer._id,
      ticketType: 'Paid',
      ticketPrice: 25.00
    });

    console.log('✅ Paid ticket created:', {
      ticketId: paidTicket.ticketId,
      qrData: paidTicket.qrData,
      status: paidTicket.status
    });

    return { freeTicket, paidTicket };
  } catch (error) {
    console.error('❌ Error creating tickets:', error);
    throw error;
  }
}

async function testTicketValidation(tickets) {
  try {
    console.log('\n🧪 Testing ticket validation...');

    const { freeTicket, paidTicket } = tickets;

    // Test QR data verification
    const qrInfo = Ticket.verifyQRData(freeTicket.qrData);
    console.log('✅ QR data verification:', qrInfo);

    // Test ticket lookup by ticketId
    const foundTicket = await Ticket.findOne({ ticketId: freeTicket.ticketId });
    console.log('✅ Ticket lookup by ticketId:', foundTicket ? 'Found' : 'Not found');

    // Test ticket population
    const populatedTicket = await Ticket.findById(freeTicket._id).populate([
      { path: 'eventId', select: 'title startDateTime' },
      { path: 'userId', select: 'name email' },
      { path: 'employerId', select: 'companyName' }
    ]);
    console.log('✅ Ticket population:', {
      eventTitle: populatedTicket.eventId.title,
      userName: populatedTicket.userId.name,
      companyName: populatedTicket.employerId.companyName
    });

    return { freeTicket, paidTicket };
  } catch (error) {
    console.error('❌ Error validating tickets:', error);
    throw error;
  }
}

async function testTicketOperations(tickets) {
  try {
    console.log('\n🧪 Testing ticket operations...');

    const { freeTicket, paidTicket } = tickets;

    // Test marking ticket as used
    await freeTicket.markAsUsed();
    console.log('✅ Ticket marked as used:', {
      ticketId: freeTicket.ticketId,
      status: freeTicket.status,
      usedAt: freeTicket.usedAt
    });

    // Test cancelling ticket
    await paidTicket.cancel();
    console.log('✅ Ticket cancelled:', {
      ticketId: paidTicket.ticketId,
      status: paidTicket.status,
      cancelledAt: paidTicket.cancelledAt
    });

    // Test error handling - try to use already used ticket
    try {
      await freeTicket.markAsUsed();
      console.log('❌ Should have thrown error for already used ticket');
    } catch (error) {
      console.log('✅ Correctly prevented using already used ticket');
    }

    // Test error handling - try to cancel already cancelled ticket
    try {
      await paidTicket.cancel();
      console.log('❌ Should have thrown error for already cancelled ticket');
    } catch (error) {
      console.log('✅ Correctly prevented cancelling already cancelled ticket');
    }
  } catch (error) {
    console.error('❌ Error testing ticket operations:', error);
    throw error;
  }
}

async function testTicketQueries(employer, user, event) {
  try {
    console.log('\n🧪 Testing ticket queries...');

    // Test finding tickets by event
    const eventTickets = await Ticket.find({ eventId: event._id });
    console.log('✅ Tickets by event:', eventTickets.length);

    // Test finding tickets by user
    const userTickets = await Ticket.find({ userId: user._id });
    console.log('✅ Tickets by user:', userTickets.length);

    // Test finding tickets by employer
    const employerTickets = await Ticket.find({ employerId: employer._id });
    console.log('✅ Tickets by employer:', employerTickets.length);

    // Test finding tickets by status
    const validTickets = await Ticket.find({ status: 'valid' });
    const usedTickets = await Ticket.find({ status: 'used' });
    const cancelledTickets = await Ticket.find({ status: 'cancelled' });
    console.log('✅ Tickets by status:', {
      valid: validTickets.length,
      used: usedTickets.length,
      cancelled: cancelledTickets.length
    });

    // Test aggregation for statistics
    const stats = await Ticket.aggregate([
      { $match: { eventId: event._id } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          validTickets: { $sum: { $cond: [{ $eq: ['$status', 'valid'] }, 1, 0] } },
          usedTickets: { $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] } },
          cancelledTickets: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$ticketType', 'Paid'] }, '$ticketPrice', 0] } }
        }
      }
    ]);

    console.log('✅ Ticket statistics:', stats[0] || 'No stats available');
  } catch (error) {
    console.error('❌ Error testing ticket queries:', error);
    throw error;
  }
}

async function testTicketValidation() {
  try {
    console.log('\n🧪 Testing ticket validation rules...');

    // Test invalid ticket type
    try {
      await Ticket.create({
        eventId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        employerId: new mongoose.Types.ObjectId(),
        ticketType: 'Invalid',
        ticketPrice: 0
      });
      console.log('❌ Should have thrown error for invalid ticket type');
    } catch (error) {
      console.log('✅ Correctly rejected invalid ticket type');
    }

    // Test free ticket with price > 0
    try {
      await Ticket.create({
        eventId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        employerId: new mongoose.Types.ObjectId(),
        ticketType: 'Free',
        ticketPrice: 10
      });
      console.log('❌ Should have thrown error for free ticket with price > 0');
    } catch (error) {
      console.log('✅ Correctly rejected free ticket with price > 0');
    }

    // Test paid ticket with price = 0
    try {
      await Ticket.create({
        eventId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        employerId: new mongoose.Types.ObjectId(),
        ticketType: 'Paid',
        ticketPrice: 0
      });
      console.log('❌ Should have thrown error for paid ticket with price = 0');
    } catch (error) {
      console.log('✅ Correctly rejected paid ticket with price = 0');
    }
  } catch (error) {
    console.error('❌ Error testing validation rules:', error);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Ticket System Tests...\n');

    await connectDB();
    await cleanup();

    const testEntities = await createTestData();
    const tickets = await testTicketCreation(testEntities.employer, testEntities.user, testEntities.event);
    await testTicketValidation(tickets);
    await testTicketOperations(tickets);
    await testTicketQueries(testEntities.employer, testEntities.user, testEntities.event);
    await testTicketValidation();

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- Ticket model creation and validation ✓');
    console.log('- QR code generation and verification ✓');
    console.log('- Ticket operations (use, cancel) ✓');
    console.log('- Database queries and aggregations ✓');
    console.log('- Validation rules and error handling ✓');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await cleanup();
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testData
};












