# Employer Test Feature - Quick Reference

## Quick Setup Steps

### 1. Create a Test
```bash
POST /api/employer-tests
Authorization: Bearer <employer_token>
Content-Type: application/json

{
  "title": "Test Title",
  "type": "mcq", // or "coding", "essay", "mixed"
  "duration": 30,
  "totalMarks": 100,
  "passingMarks": 40
}
```

### 2. Add Questions (MCQ)
```bash
POST /api/employer-tests/:testId/questions

{
  "questionText": "Your question here?",
  "type": "mcq",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "marks": 5
}
```

### 3. Add Questions (Coding)
```bash
POST /api/employer-tests/:testId/questions

{
  "questionText": "Problem title",
  "type": "coding",
  "marks": 10,
  "codingDetails": {
    "problemStatement": "Description",
    "sampleInput": "Input example",
    "sampleOutput": "Output example",
    "testCases": [
      {
        "input": "test input",
        "expectedOutput": "expected output"
      }
    ]
  }
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
  "title": "Job Title",
  "description": "Job description",
  "location": "Location",
  "jobType": "full-time",
  "experienceLevel": "mid",
  "testId": "<test_id>",
  "requiresTest": true
}
```

## All Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employer-tests` | Get all my tests |
| GET | `/api/employer-tests/:testId` | Get specific test |
| POST | `/api/employer-tests` | Create new test |
| PUT | `/api/employer-tests/:testId` | Update test |
| DELETE | `/api/employer-tests/:testId` | Delete test |
| POST | `/api/employer-tests/:testId/questions` | Add question |
| GET | `/api/employer-tests/:testId/questions` | Get all questions |
| PUT | `/api/employer-tests/:testId/questions/:questionId` | Update question |
| DELETE | `/api/employer-tests/:testId/questions/:questionId` | Delete question |
| PATCH | `/api/employer-tests/:testId/toggle-active` | Toggle test status |

## Test Types

- **mcq**: Multiple Choice Questions
- **coding**: Programming challenges
- **essay**: Written responses
- **mixed**: Combination of types

## Test Categories

- technical
- aptitude
- reasoning
- language
- general

## Question Types Details

### MCQ Question
Required fields:
- `questionText`
- `type: "mcq"`
- `options` (array, min 2)
- `correctAnswer`
- `marks`

### Coding Question
Required fields:
- `questionText`
- `type: "coding"`
- `marks`
- `codingDetails.problemStatement`
- `codingDetails.testCases`

### Essay Question
Required fields:
- `questionText`
- `type: "essay"`
- `marks`
- `essayDetails.wordLimit` (optional)

## Important Validation Rules

1. **Test Activation**
   - Test must have at least 1 question
   - Use toggle-active endpoint to activate

2. **Job Linking**
   - Test must be active
   - Test must belong to the employer
   - Test must have questions

3. **Test Deletion**
   - Cannot delete if linked to any job
   - First remove test from all jobs

4. **Question Deletion**
   - Automatically deactivates test if last question removed
   - Reorders remaining questions

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Test not found" | Invalid testId | Check test ID |
| "Permission denied" | Accessing another employer's test | Use your own tests |
| "Cannot activate without questions" | No questions added | Add questions first |
| "Cannot delete linked test" | Test used in job | Remove from jobs first |
| "Test must be active" | Using inactive test in job | Activate test first |

## Frontend Integration Example

```javascript
// Complete workflow
class TestManager {
  constructor(token) {
    this.token = token;
    this.baseUrl = '/api/employer-tests';
  }

  async createTest(data) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async addQuestion(testId, questionData) {
    const response = await fetch(`${this.baseUrl}/${testId}/questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionData)
    });
    return response.json();
  }

  async activateTest(testId) {
    const response = await fetch(`${this.baseUrl}/${testId}/toggle-active`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }

  async getMyTests(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}

// Usage
const testManager = new TestManager(employerToken);

// Create test
const test = await testManager.createTest({
  title: 'React Developer Test',
  type: 'mixed',
  duration: 45,
  totalMarks: 50
});

// Add MCQ
await testManager.addQuestion(test.test._id, {
  questionText: 'What is React?',
  type: 'mcq',
  options: ['Library', 'Framework', 'Language', 'None'],
  correctAnswer: 'Library',
  marks: 5
});

// Activate
await testManager.activateTest(test.test._id);
```

## Files Modified

1. **Backend Models**
   - `models/Test.js` - Added employer support
   - `models/Job.js` - Added test reference

2. **Backend Routes**
   - `routes/employerTestRoutes.js` - New file (complete test CRUD)
   - `index.js` - Added employer test routes

3. **Backend Controllers**
   - `controllers/employerController.js` - Updated job creation/update

4. **Documentation**
   - `EMPLOYER_TEST_FEATURE.md` - Complete guide
   - `EMPLOYER_TEST_QUICK_REFERENCE.md` - This file

## Testing Checklist

- [ ] Create test as employer
- [ ] Add MCQ question
- [ ] Add coding question
- [ ] Add essay question
- [ ] Activate test
- [ ] Post job with test
- [ ] Update job test
- [ ] Try to access another employer's test (should fail)
- [ ] Delete question
- [ ] Delete test (without job link)
- [ ] Try to delete test with job link (should fail)
- [ ] Get all employer tests with filters

## Next Steps for Frontend

1. **Create Test Management UI**
   - Test list page
   - Test creation form
   - Question builder (different types)
   - Test preview

2. **Update Job Posting Form**
   - Add test selection dropdown
   - Show "Create New Test" button
   - Display selected test details

3. **Add Test Analytics (Future)**
   - Test performance metrics
   - Candidate scores
   - Pass/fail rates

## Support

Full documentation: `EMPLOYER_TEST_FEATURE.md`
