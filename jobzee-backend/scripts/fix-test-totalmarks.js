/**
 * Migration Script: Fix Test Total Marks
 * 
 * This script recalculates and updates the totalMarks for all existing tests
 * based on the sum of marks from all their questions.
 * 
 * Run with: node scripts/fix-test-totalmarks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Test = require('../models/Test');
const Question = require('../models/Question');

const fixTestTotalMarks = async () => {
  try {
    console.log('🔧 Starting Test Total Marks Fix...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all tests
    const tests = await Test.find();
    console.log(`📊 Found ${tests.length} tests to process\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    const details = [];

    for (const test of tests) {
      // Get all questions for this test
      const questions = await Question.find({ testId: test._id });
      const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      const oldTotalMarks = test.totalMarks;

      if (calculatedTotalMarks !== oldTotalMarks) {
        // Update the test
        test.totalMarks = calculatedTotalMarks;
        await test.save();
        
        updatedCount++;
        details.push({
          testId: test._id,
          title: test.title,
          questionCount: questions.length,
          oldMarks: oldTotalMarks,
          newMarks: calculatedTotalMarks,
          difference: calculatedTotalMarks - oldTotalMarks
        });

        console.log(`✅ Updated: ${test.title}`);
        console.log(`   Questions: ${questions.length} | Old Marks: ${oldTotalMarks} | New Marks: ${calculatedTotalMarks}`);
        console.log(`   Question marks breakdown: ${questions.map(q => q.marks).join(', ')}\n`);
      } else {
        unchangedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Total tests processed: ${tests.length}`);
    console.log(`   Tests updated: ${updatedCount}`);
    console.log(`   Tests unchanged: ${unchangedCount}\n`);

    if (details.length > 0) {
      console.log('📋 Detailed Changes:');
      console.table(details);
    }

    console.log('\n✨ Migration completed successfully!');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error fixing test total marks:', error);
    process.exit(1);
  }
};

// Run the migration
fixTestTotalMarks();
