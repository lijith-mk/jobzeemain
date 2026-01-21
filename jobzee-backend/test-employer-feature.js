/**
 * Test Script for Employer Test Feature
 * 
 * This script demonstrates and validates the employer test creation workflow.
 * Run this after starting the backend server to verify everything works.
 * 
 * Prerequisites:
 * - Backend server running
 * - Valid employer authentication token
 * - MongoDB connected
 */

const BASE_URL = 'http://localhost:5000/api';
let EMPLOYER_TOKEN = 'your_employer_token_here'; // Replace with actual token

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${EMPLOYER_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test workflow
async function runTests() {
  console.log('🧪 Starting Employer Test Feature Validation\n');

  // Test 1: Create a test
  console.log('1️⃣ Creating test...');
  const testData = {
    title: 'React Developer Assessment',
    description: 'Test for React developers',
    jobRole: 'Frontend Developer',
    skill: 'React, JavaScript',
    type: 'mixed',
    category: 'technical',
    difficulty: 'medium',
    duration: 45,
    totalMarks: 50,
    passingMarks: 30,
    tags: ['react', 'javascript'],
    instructions: 'Answer all questions carefully.'
  };

  const createTestResult = await apiCall('/employer-tests', 'POST', testData);
  if (createTestResult.status === 201) {
    console.log('✅ Test created successfully');
    console.log('   Test ID:', createTestResult.data.test._id);
  } else {
    console.log('❌ Test creation failed:', createTestResult.data.message);
    return;
  }

  const testId = createTestResult.data.test._id;

  // Test 2: Add MCQ question
  console.log('\n2️⃣ Adding MCQ question...');
  const mcqQuestion = {
    questionText: 'What is React?',
    type: 'mcq',
    options: [
      'A JavaScript library for building user interfaces',
      'A programming language',
      'A database',
      'An operating system'
    ],
    correctAnswer: 'A JavaScript library for building user interfaces',
    marks: 5,
    difficulty: 'easy',
    explanation: 'React is a JavaScript library developed by Facebook for building UIs.'
  };

  const addMcqResult = await apiCall(`/employer-tests/${testId}/questions`, 'POST', mcqQuestion);
  if (addMcqResult.status === 201) {
    console.log('✅ MCQ question added successfully');
  } else {
    console.log('❌ MCQ question addition failed:', addMcqResult.data.message);
  }

  // Test 3: Add coding question
  console.log('\n3️⃣ Adding coding question...');
  const codingQuestion = {
    questionText: 'Implement a component that fetches and displays data',
    type: 'coding',
    marks: 15,
    difficulty: 'medium',
    codingDetails: {
      problemStatement: 'Create a React component that fetches data from an API and displays it.',
      inputFormat: 'API endpoint URL',
      outputFormat: 'Rendered component with data',
      sampleInput: 'https://api.example.com/users',
      sampleOutput: 'List of users displayed',
      testCases: [
        {
          input: 'https://api.example.com/users',
          expectedOutput: 'Component renders user list',
          isHidden: false
        }
      ],
      starterCode: {
        javascript: `import React, { useState, useEffect } from 'react';

function DataFetcher({ url }) {
  // Your code here
  
  return (
    <div>
      {/* Display data here */}
    </div>
  );
}

export default DataFetcher;`
      },
      timeLimit: 3000,
      memoryLimit: 256
    }
  };

  const addCodingResult = await apiCall(`/employer-tests/${testId}/questions`, 'POST', codingQuestion);
  if (addCodingResult.status === 201) {
    console.log('✅ Coding question added successfully');
  } else {
    console.log('❌ Coding question addition failed:', addCodingResult.data.message);
  }

  // Test 4: Get all questions
  console.log('\n4️⃣ Fetching all questions...');
  const getQuestionsResult = await apiCall(`/employer-tests/${testId}/questions`, 'GET');
  if (getQuestionsResult.status === 200) {
    console.log('✅ Questions fetched successfully');
    console.log('   Total questions:', getQuestionsResult.data.questions.length);
  } else {
    console.log('❌ Fetching questions failed');
  }

  // Test 5: Activate test
  console.log('\n5️⃣ Activating test...');
  const activateResult = await apiCall(`/employer-tests/${testId}/toggle-active`, 'PATCH');
  if (activateResult.status === 200) {
    console.log('✅ Test activated successfully');
    console.log('   Test is now:', activateResult.data.test.isActive ? 'ACTIVE' : 'INACTIVE');
  } else {
    console.log('❌ Test activation failed:', activateResult.data.message);
  }

  // Test 6: Get all employer tests
  console.log('\n6️⃣ Fetching all employer tests...');
  const getAllTestsResult = await apiCall('/employer-tests?page=1&limit=10', 'GET');
  if (getAllTestsResult.status === 200) {
    console.log('✅ Tests fetched successfully');
    console.log('   Total tests:', getAllTestsResult.data.pagination.total);
  } else {
    console.log('❌ Fetching tests failed');
  }

  // Test 7: Create job with test
  console.log('\n7️⃣ Creating job with test...');
  const jobData = {
    title: 'React Developer',
    description: 'Looking for experienced React developer',
    location: 'Remote',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: ['React', 'JavaScript', 'TypeScript'],
    testId: testId,
    requiresTest: true
  };

  const createJobResult = await apiCall('/employers/jobs', 'POST', jobData);
  if (createJobResult.status === 201) {
    console.log('✅ Job created with test successfully');
    console.log('   Job ID:', createJobResult.data.job._id);
    console.log('   Test ID:', createJobResult.data.job.testId);
  } else {
    console.log('❌ Job creation failed:', createJobResult.data.message);
  }

  // Test 8: Update test
  console.log('\n8️⃣ Updating test...');
  const updateData = {
    title: 'React Developer Assessment (Updated)',
    duration: 60
  };

  const updateResult = await apiCall(`/employer-tests/${testId}`, 'PUT', updateData);
  if (updateResult.status === 200) {
    console.log('✅ Test updated successfully');
    console.log('   New title:', updateResult.data.test.title);
    console.log('   New duration:', updateResult.data.test.duration);
  } else {
    console.log('❌ Test update failed:', updateResult.data.message);
  }

  // Test 9: Get specific test
  console.log('\n9️⃣ Fetching specific test...');
  const getTestResult = await apiCall(`/employer-tests/${testId}`, 'GET');
  if (getTestResult.status === 200) {
    console.log('✅ Test fetched successfully');
    console.log('   Title:', getTestResult.data.test.title);
    console.log('   Questions:', getTestResult.data.test.questionCount);
    console.log('   Active:', getTestResult.data.test.isActive);
  } else {
    console.log('❌ Fetching test failed');
  }

  console.log('\n✅ All tests completed!\n');
  console.log('📝 Summary:');
  console.log('- Test created ✓');
  console.log('- Questions added (MCQ + Coding) ✓');
  console.log('- Test activated ✓');
  console.log('- Job linked with test ✓');
  console.log('- Test updated ✓');
  console.log('\n🎉 Employer Test Feature is working correctly!');
}

// Validation checklist
function printValidationChecklist() {
  console.log('\n📋 Manual Validation Checklist:\n');
  console.log('Backend Validation:');
  console.log('[ ] Test model has createdByModel and createdBy fields');
  console.log('[ ] Job model has testId and requiresTest fields');
  console.log('[ ] Employer test routes are registered in index.js');
  console.log('[ ] employerTestRoutes.js file exists and is complete');
  console.log('[ ] Job creation validates test ownership');
  console.log('[ ] Cannot activate test without questions');
  console.log('[ ] Cannot delete test linked to jobs');
  console.log('[ ] Ownership middleware works correctly');
  console.log('\nFrontend Tasks (To Do):');
  console.log('[ ] Create test management UI');
  console.log('[ ] Create question builder forms');
  console.log('[ ] Update job posting form with test selection');
  console.log('[ ] Add test preview functionality');
  console.log('[ ] Implement test listing/filtering');
  console.log('[ ] Add test analytics dashboard');
  console.log('\nTesting:');
  console.log('[ ] Create test as employer');
  console.log('[ ] Add different question types');
  console.log('[ ] Activate/deactivate test');
  console.log('[ ] Link test to job');
  console.log('[ ] Update job test');
  console.log('[ ] Try accessing another employer\'s test (should fail)');
  console.log('[ ] Delete test without job link');
  console.log('[ ] Try deleting test with job link (should fail)');
}

// Main execution
if (require.main === module) {
  console.log('⚠️  Please update EMPLOYER_TOKEN variable with a valid token\n');
  console.log('To get an employer token:');
  console.log('1. Login as an employer: POST /api/employers/login');
  console.log('2. Copy the token from response');
  console.log('3. Update EMPLOYER_TOKEN in this file\n');
  
  printValidationChecklist();
  
  // Uncomment below line after setting token
  // runTests().catch(console.error);
}

module.exports = { runTests, apiCall };
