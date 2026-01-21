const mongoose = require('mongoose');
require('dotenv').config();

// Import old and new models
const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Answer = require('../models/Answer');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobzee', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateTests() {
  try {
    console.log('🔄 Starting migration from embedded to modular structure...\n');

    // Find all existing tests with embedded questions
    const oldTests = await mongoose.connection.db.collection('tests').find({}).toArray();
    
    console.log(`📋 Found ${oldTests.length} tests to migrate\n`);

    let migratedTests = 0;
    let migratedQuestions = 0;

    for (const oldTest of oldTests) {
      if (oldTest.questions && oldTest.questions.length > 0) {
        console.log(`📝 Migrating test: ${oldTest.title}`);
        console.log(`   Questions: ${oldTest.questions.length}`);

        // Create questions in separate collection
        const questions = oldTest.questions.map((q, index) => ({
          testId: oldTest._id,
          questionText: q.questionText,
          type: q.type || 'mcq',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          marks: q.marks || 1,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          order: index + 1,
          isActive: true,
        }));

        // Insert questions
        const insertedQuestions = await Question.insertMany(questions);
        migratedQuestions += insertedQuestions.length;

        // Update test document - remove embedded questions, add questionCount
        await mongoose.connection.db.collection('tests').updateOne(
          { _id: oldTest._id },
          {
            $unset: { questions: '' },
            $set: { 
              questionCount: insertedQuestions.length,
              isActive: oldTest.isActive !== undefined ? oldTest.isActive : false
            }
          }
        );

        migratedTests++;
        console.log(`   ✅ Migrated ${insertedQuestions.length} questions\n`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`✅ Migrated ${migratedTests} tests`);
    console.log(`✅ Created ${migratedQuestions} questions in separate collection`);

    // Show collection stats
    const testCount = await Test.countDocuments();
    const questionCount = await Question.countDocuments();
    
    console.log('\n📊 Current database stats:');
    console.log(`   Tests: ${testCount}`);
    console.log(`   Questions: ${questionCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateTestResults() {
  try {
    console.log('\n🔄 Starting migration of test results to attempts/answers...\n');

    // Find all existing test results
    const oldResults = await mongoose.connection.db.collection('testresults').find({}).toArray();
    
    console.log(`📋 Found ${oldResults.length} test results to migrate\n`);

    let migratedAttempts = 0;
    let migratedAnswers = 0;

    for (const oldResult of oldResults) {
      console.log(`📝 Migrating test result: ${oldResult.testTitle}`);

      // Create test attempt
      const attempt = await TestAttempt.create({
        userId: oldResult.userId,
        testId: oldResult.testId,
        testTitle: oldResult.testTitle,
        score: oldResult.score,
        totalMarks: oldResult.totalMarks,
        passingMarks: oldResult.passingMarks,
        percentage: oldResult.percentage,
        correctAnswers: oldResult.correctAnswers,
        totalQuestions: oldResult.totalQuestions,
        passed: oldResult.passed,
        timeTaken: oldResult.timeTaken,
        autoSubmit: oldResult.autoSubmit || false,
        completedAt: oldResult.completedAt,
        status: 'completed'
      });

      migratedAttempts++;

      // Create answers if questionResults exist
      if (oldResult.questionResults && oldResult.questionResults.length > 0) {
        const answers = oldResult.questionResults.map(qr => ({
          attemptId: attempt._id,
          questionId: qr.questionId,
          questionText: qr.questionText,
          userAnswer: qr.userAnswer,
          correctAnswer: qr.correctAnswer,
          isCorrect: qr.isCorrect,
          marks: qr.marks,
          marksObtained: qr.marksObtained,
          explanation: qr.explanation || ''
        }));

        await Answer.insertMany(answers);
        migratedAnswers += answers.length;
        console.log(`   ✅ Created attempt with ${answers.length} answers\n`);
      }
    }

    console.log('\n🎉 Test results migration completed!');
    console.log(`✅ Migrated ${migratedAttempts} test attempts`);
    console.log(`✅ Created ${migratedAnswers} answers in separate collection`);

    // Show collection stats
    const attemptCount = await TestAttempt.countDocuments();
    const answerCount = await Answer.countDocuments();
    
    console.log('\n📊 Current database stats:');
    console.log(`   Test Attempts: ${attemptCount}`);
    console.log(`   Answers: ${answerCount}`);

  } catch (error) {
    console.error('❌ Test results migration failed:', error);
    throw error;
  }
}

async function runMigration() {
  try {
    await migrateTests();
    await migrateTestResults();
    
    console.log('\n\n✨ All migrations completed successfully!');
    console.log('You can now safely use the modular database structure.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
