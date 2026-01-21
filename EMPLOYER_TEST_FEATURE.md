# Employer Test Creation Feature

## Overview
Employers can now create and manage tests when posting jobs, similar to how admins create tests. This allows employers to screen candidates with custom assessments during the job application process.

## Key Features

### 1. Test Templates Support
Employers can create tests using the same templates available to admins:
- **MCQ (Multiple Choice Questions)**
- **Coding Questions**
- **Essay Questions**
- **Mixed Tests** (combination of different question types)

### 2. Test Categories
- Technical
- Aptitude
- Reasoning
- Language
- General

### 3. Test Management
- Create tests with custom questions
- Edit existing tests
- Delete tests (if not linked to jobs)
- Activate/deactivate tests
- Manage questions (add, edit, delete, reorder)

## Database Changes

### Test Model Updates
**File:** `models/Test.js`

Added support for employer-created tests:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  refPath: 'createdByModel',
},
createdByModel: {
  type: String,
  enum: ['Admin', 'Employer'],
  default: 'Admin',
}
```

### Job Model Updates
**File:** `models/Job.js`

Added test reference fields:
```javascript
testId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Test',
},
requiresTest: {
  type: Boolean,
  default: false,
}
```

## API Endpoints

### Base URL
All employer test endpoints are under `/api/employer-tests`

### Authentication
All endpoints require employer authentication using the `employerAuth` middleware.

---

### 1. Get All Tests Created by Employer
**GET** `/api/employer-tests`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isActive` (optional): Filter by active status (true/false)
- `type` (optional): Filter by test type (mcq, coding, mixed, essay)
- `category` (optional): Filter by category (technical, aptitude, etc.)

**Response:**
```json
{
  "success": true,
  "tests": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

---

### 2. Get Specific Test
**GET** `/api/employer-tests/:testId`

**Response:**
```json
{
  "success": true,
  "test": {
    "_id": "...",
    "title": "JavaScript Developer Assessment",
    "type": "mixed",
    "questionCount": 10,
    "questions": [...]
  }
}
```

---

### 3. Create New Test
**POST** `/api/employer-tests`

**Request Body:**
```json
{
  "title": "JavaScript Developer Assessment",
  "description": "Comprehensive test for JS developers",
  "jobRole": "Frontend Developer",
  "skill": "JavaScript",
  "type": "mixed",
  "category": "technical",
  "difficulty": "medium",
  "duration": 60,
  "totalMarks": 100,
  "passingMarks": 60,
  "tags": ["javascript", "react", "frontend"],
  "instructions": "Answer all questions. No negative marking."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test created successfully. Add questions to activate it.",
  "test": {...}
}
```

---

### 4. Update Test
**PUT** `/api/employer-tests/:testId`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "duration": 90,
  "isActive": true
}
```

---

### 5. Delete Test
**DELETE** `/api/employer-tests/:testId`

**Note:** Cannot delete tests that are linked to job postings.

**Response:**
```json
{
  "success": true,
  "message": "Test deleted successfully"
}
```

---

### 6. Add Question to Test
**POST** `/api/employer-tests/:testId/questions`

**MCQ Example:**
```json
{
  "questionText": "What is closure in JavaScript?",
  "type": "mcq",
  "options": [
    "A function inside another function",
    "A way to create private variables",
    "Both A and B",
    "None of the above"
  ],
  "correctAnswer": "Both A and B",
  "marks": 5,
  "explanation": "Closures are functions that have access to variables from outer function scope",
  "difficulty": "medium"
}
```

**Coding Question Example:**
```json
{
  "questionText": "Implement a function to reverse a string",
  "type": "coding",
  "marks": 10,
  "codingDetails": {
    "problemStatement": "Write a function that reverses a string",
    "inputFormat": "A single string",
    "outputFormat": "Reversed string",
    "sampleInput": "hello",
    "sampleOutput": "olleh",
    "testCases": [
      {
        "input": "hello",
        "expectedOutput": "olleh",
        "isHidden": false
      }
    ],
    "starterCode": {
      "javascript": "function reverseString(str) {\n  // Your code here\n}",
      "python": "def reverse_string(s):\n    # Your code here\n    pass"
    }
  }
}
```

---

### 7. Get All Questions for Test
**GET** `/api/employer-tests/:testId/questions`

---

### 8. Update Question
**PUT** `/api/employer-tests/:testId/questions/:questionId`

---

### 9. Delete Question
**DELETE** `/api/employer-tests/:testId/questions/:questionId`

**Note:** Automatically deactivates test if it becomes empty.

---

### 10. Toggle Test Active Status
**PATCH** `/api/employer-tests/:testId/toggle-active`

**Note:** Cannot activate test without questions.

---

## Job Posting with Tests

### Updated Job Creation
**POST** `/api/employers/jobs`

**Request Body:**
```json
{
  "title": "Frontend Developer",
  "description": "...",
  "location": "Remote",
  "jobType": "full-time",
  "experienceLevel": "mid",
  "testId": "test_id_here",
  "requiresTest": true,
  ...
}
```

**Validation:**
- Test must exist and belong to the employer
- Test must be active
- Test must have at least one question

### Updated Job Update
**PUT** `/api/employers/jobs/:jobId`

Can update `testId` and `requiresTest` fields.

---

## Security Features

### Test Ownership Validation
- Employers can only access tests they created
- Tests are validated when linked to jobs
- Middleware `checkTestOwnership` ensures proper authorization

### Test Validation
- Tests must be active to be used in jobs
- Tests must have questions to be activated
- Cannot delete tests linked to active jobs

---

## Workflow Example

### 1. Create a Test
```bash
POST /api/employer-tests
{
  "title": "React Developer Test",
  "type": "mixed",
  "duration": 45,
  "totalMarks": 50
}
```

### 2. Add MCQ Questions
```bash
POST /api/employer-tests/:testId/questions
{
  "questionText": "What is JSX?",
  "type": "mcq",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "C",
  "marks": 5
}
```

### 3. Add Coding Question
```bash
POST /api/employer-tests/:testId/questions
{
  "questionText": "Implement useState hook",
  "type": "coding",
  "marks": 15,
  "codingDetails": {...}
}
```

### 4. Activate Test
```bash
PATCH /api/employer-tests/:testId/toggle-active
```

### 5. Link to Job
```bash
POST /api/employers/jobs
{
  "title": "React Developer",
  "testId": "test_id",
  "requiresTest": true,
  ...
}
```

---

## Frontend Integration Guide

### 1. Test Creation Flow
```javascript
// Step 1: Create test
const createTest = async (testData) => {
  const response = await fetch('/api/employer-tests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });
  return response.json();
};

// Step 2: Add questions
const addQuestion = async (testId, questionData) => {
  const response = await fetch(`/api/employer-tests/${testId}/questions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(questionData)
  });
  return response.json();
};

// Step 3: Activate test
const activateTest = async (testId) => {
  const response = await fetch(`/api/employer-tests/${testId}/toggle-active`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### 2. Job Posting with Test
```javascript
const postJobWithTest = async (jobData, testId) => {
  const response = await fetch('/api/employers/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...jobData,
      testId: testId,
      requiresTest: true
    })
  });
  return response.json();
};
```

### 3. Fetch Employer Tests
```javascript
const getMyTests = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/employer-tests?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

---

## UI/UX Recommendations

### Job Posting Form
Add a section for test selection:
```
[ ] Require test for this position
    [Dropdown: Select existing test] or [Button: Create new test]
```

### Test Management Dashboard
- List all tests with status indicators (Active/Inactive)
- Quick actions: Edit, Delete, View Questions, Toggle Status
- Filter by type, category, status
- Show question count and test details

### Test Creation Wizard
**Step 1:** Basic Test Info
- Title, Description, Type, Category
- Duration, Marks, Passing Marks

**Step 2:** Add Questions
- Question type selector
- Dynamic form based on question type
- Preview questions as added
- Reorder questions

**Step 3:** Review & Activate
- Summary of test
- Preview all questions
- Activate test button

---

## Error Handling

### Common Errors

1. **Test Not Found**
```json
{
  "success": false,
  "message": "Test not found"
}
```

2. **Unauthorized Access**
```json
{
  "success": false,
  "message": "You do not have permission to access this test"
}
```

3. **Cannot Activate Empty Test**
```json
{
  "success": false,
  "message": "Cannot activate test without questions"
}
```

4. **Cannot Delete Linked Test**
```json
{
  "success": false,
  "message": "Cannot delete test that is linked to job postings"
}
```

5. **Invalid Test for Job**
```json
{
  "success": false,
  "message": "Test must be active and contain questions"
}
```

---

## Testing Guide

### Manual Testing Steps

1. **Create Test**
   - Login as employer
   - POST to `/api/employer-tests` with test data
   - Verify test is created with `isActive: false`

2. **Add Questions**
   - POST questions to `/api/employer-tests/:testId/questions`
   - Verify question count increments
   - Test different question types (MCQ, coding, essay)

3. **Activate Test**
   - PATCH to toggle active status
   - Verify test becomes active

4. **Link to Job**
   - Create job with `testId`
   - Verify validation (test must be active and have questions)
   - Verify job is created with test reference

5. **Try Unauthorized Access**
   - Try to access another employer's test
   - Verify 403 error

6. **Delete Test**
   - Try to delete test linked to job (should fail)
   - Unlink test from job
   - Delete test successfully

---

## Migration Notes

### For Existing Tests
All existing tests created by admins will have:
- `createdByModel: 'Admin'`
- They remain unaffected and continue to work

### For New Tests
Employer-created tests will have:
- `createdByModel: 'Employer'`
- `createdBy: <employer_id>`

No migration script needed as we used backward-compatible changes.

---

## Best Practices

### For Employers
1. Create tests before posting jobs
2. Ensure tests are active and have questions
3. Use appropriate difficulty levels
4. Provide clear instructions
5. Test your tests before publishing

### For Developers
1. Always validate test ownership
2. Check test status before linking to jobs
3. Handle errors gracefully
4. Provide user-friendly error messages
5. Implement proper loading states

---

## Future Enhancements

1. **Test Templates Library**
   - Pre-built test templates for common roles
   - Community-shared test templates

2. **Test Analytics**
   - Pass/fail rates
   - Average scores
   - Time taken statistics

3. **Question Bank**
   - Reusable question library
   - Import questions across tests

4. **Auto-grading for Essays**
   - AI-powered essay evaluation
   - Keyword matching

5. **Test Preview**
   - Employers can preview test as candidates would see it

6. **Bulk Operations**
   - Import questions from CSV/JSON
   - Export test data

---

## Support

For issues or questions:
- Check error messages in API responses
- Verify authentication tokens
- Ensure proper request format
- Check test ownership and status

---

## Version History

**v1.0.0** - Initial Release
- Test creation for employers
- Question management (MCQ, coding, essay)
- Job linking with tests
- Test activation/deactivation
- Ownership validation
