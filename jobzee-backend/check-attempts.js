const mongoose = require('mongoose');
require('dotenv').config();

const TestAttempt = require('./models/TestAttempt');
const Test = require('./models/Test');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database\n');

    // Check test attempts
    const totalAttempts = await TestAttempt.countDocuments();
    console.log(`Total Test Attempts: ${totalAttempts}`);

    const attempts = await TestAttempt.find()
      .limit(3)
      .lean();
    
    console.log('\nSample Attempts:');
    attempts.forEach((attempt, i) => {
      console.log(`\nAttempt ${i + 1}:`);
      console.log(`  ID: ${attempt._id}`);
      console.log(`  User ID: ${attempt.userId}`);
      console.log(`  Test Title: ${attempt.testTitle}`);
      console.log(`  Test ID: ${attempt.testId}`);
      console.log(`  Score: ${attempt.score}/${attempt.totalMarks}`);
      console.log(`  Status: ${attempt.status}`);
      console.log(`  Grading Status: ${attempt.gradingStatus}`);
      console.log(`  Completed: ${attempt.completedAt}`);
    });

    // Check employer tests
    const employerTests = await Test.find({ createdByModel: 'Employer' })
      .limit(5)
      .lean();
    
    console.log(`\n\nEmployer Tests: ${employerTests.length}`);
    employerTests.forEach((test, i) => {
      console.log(`\nTest ${i + 1}:`);
      console.log(`  ID: ${test._id}`);
      console.log(`  Title: ${test.title}`);
      console.log(`  Created By: ${test.createdBy}`);
      console.log(`  Created By Model: ${test.createdByModel}`);
      console.log(`  Is Active: ${test.isActive}`);
      console.log(`  Question Count: ${test.questionCount}`);
    });

    // Check if any attempts match employer tests
    if (employerTests.length > 0 && totalAttempts > 0) {
      const employerTestIds = employerTests.map(t => t._id);
      const matchingAttempts = await TestAttempt.countDocuments({
        testId: { $in: employerTestIds }
      });
      console.log(`\n\nAttempts on Employer Tests: ${matchingAttempts}`);
      
      if (matchingAttempts > 0) {
        const matched = await TestAttempt.find({
          testId: { $in: employerTestIds }
        })
        .limit(5)
        .lean();
        
        console.log('\nMatching Attempts Details:');
        matched.forEach((attempt, i) => {
          console.log(`\n  ${i + 1}. Test: ${attempt.testTitle}`);
          console.log(`     Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)`);
          console.log(`     Status: ${attempt.status} | Grading: ${attempt.gradingStatus}`);
          console.log(`     Test ID: ${attempt.testId}`);
        });
      }
    }

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
