# Employer Test Performance Monitoring Guide

## Overview
Employers now have full access to performance monitoring features for all tests they create, matching the capabilities available to admins.

## Available Endpoints

### 1. Get Tests Pending Review
**Endpoint:** `GET /api/employer-tests/pending-review`

Returns all test attempts that require manual grading (essay questions, coding questions, etc.)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "attempts": [...],
  "groupedByTest": [
    {
      "testId": "...",
      "testTitle": "JavaScript Developer Test",
      "testType": "mixed",
      "attempts": [...]
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 1
  }
}
```

### 2. Get Test Statistics
**Endpoint:** `GET /api/employer-tests/statistics`

Get comprehensive statistics for all your tests or a specific test.

**Query Parameters:**
- `testId` - (Optional) Filter by specific test ID

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalTests": 5,
    "totalAttempts": 150,
    "gradedAttempts": 145,
    "pendingReviews": 5,
    "averageScore": "72.50",
    "averagePercentage": "72.50",
    "passRate": "85.00",
    "testBreakdown": [
      {
        "testId": "...",
        "testTitle": "React Developer Test",
        "attempts": 30,
        "averageScore": "75.00",
        "averagePercentage": "75.00",
        "passRate": "90.00"
      }
    ]
  }
}
```

### 3. Get All Test Attempts
**Endpoint:** `GET /api/employer-tests/attempts`

View all attempts made on your tests with filtering options.

**Query Parameters:**
- `testId` - (Optional) Filter by test ID
- `gradingStatus` - (Optional) Filter by status: `auto-graded`, `pending-review`, `graded`
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "attempts": [...],
  "stats": {
    "auto-graded": 100,
    "pending-review": 5,
    "graded": 45
  },
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

### 4. Get Detailed Test Result
**Endpoint:** `GET /api/employer-tests/attempts/:resultId`

View complete details of a specific test attempt including all answers.

**Response:**
```json
{
  "success": true,
  "result": {
    "_id": "...",
    "userId": {...},
    "testId": {...},
    "score": 75,
    "percentage": 75,
    "passed": true,
    "gradingStatus": "graded",
    "questionResults": [
      {
        "questionText": "What is React?",
        "questionType": "mcq",
        "userAnswer": "A JavaScript library",
        "correctAnswer": "A JavaScript library",
        "isCorrect": true,
        "marksObtained": 5,
        "marks": 5
      }
    ]
  }
}
```

### 5. Grade Test Attempt Manually
**Endpoint:** `PUT /api/employer-tests/attempts/:resultId/grade`

Manually grade essay questions, coding challenges, or override automatic grading.

**Request Body:**
```json
{
  "questionGrades": [
    {
      "answerId": "answer_id_1",
      "marksObtained": 8,
      "gradingNotes": "Good answer, but missing key points about performance"
    },
    {
      "answerId": "answer_id_2",
      "marksObtained": 10,
      "gradingNotes": "Excellent explanation with examples"
    }
  ],
  "feedback": "Overall good performance. Focus more on optimization techniques."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test graded successfully",
  "result": {...}
}
```

## Features

### 🎯 Performance Metrics
- Total number of tests created
- Total attempts across all tests
- Average scores and percentages
- Pass/fail rates
- Per-test breakdown of performance

### 📊 Grading Status Tracking
- **auto-graded**: MCQ tests graded automatically
- **pending-review**: Essays/coding questions awaiting manual review
- **graded**: Manually reviewed and graded by you

### 👥 Candidate Management
- View all candidates who took your tests
- See detailed answers for each question
- Track individual performance
- Compare candidates across tests

### ✍️ Manual Grading
- Grade essay questions
- Review coding submissions
- Add personalized feedback
- Assign marks for subjective questions

## Usage Examples

### Example 1: Check Pending Reviews
```javascript
// Frontend code
const checkPendingReviews = async () => {
  const response = await fetch('/api/employer-tests/pending-review', {
    headers: {
      'Authorization': `Bearer ${employerToken}`
    }
  });
  const data = await response.json();
  console.log(`${data.pagination.total} tests need your review`);
};
```

### Example 2: View Test Performance
```javascript
// Get statistics for specific test
const viewTestStats = async (testId) => {
  const response = await fetch(`/api/employer-tests/statistics?testId=${testId}`, {
    headers: {
      'Authorization': `Bearer ${employerToken}`
    }
  });
  const data = await response.json();
  console.log(`Pass Rate: ${data.statistics.passRate}%`);
  console.log(`Average Score: ${data.statistics.averageScore}`);
};
```

### Example 3: Grade an Attempt
```javascript
// Grade essay/coding questions
const gradeAttempt = async (resultId, grades) => {
  const response = await fetch(`/api/employer-tests/attempts/${resultId}/grade`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${employerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      questionGrades: grades,
      feedback: 'Good effort! Keep practicing.'
    })
  });
  return await response.json();
};
```

## Security

✅ **All endpoints are protected with employer authentication**
- Employers can only view/grade attempts for their own tests
- Test ownership is verified on every request
- Unauthorized access attempts are blocked with 403 errors

## Dashboard Integration Ideas

### Performance Overview Card
```
📊 Test Performance Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tests Created: 5
Total Attempts: 150
Pending Reviews: 5
Average Pass Rate: 85%
```

### Pending Actions Alert
```
⚠️ 5 tests require manual grading
   → React Developer Test (3 attempts)
   → Node.js Backend Test (2 attempts)
```

### Test Performance Table
```
Test Name              | Attempts | Avg Score | Pass Rate
──────────────────────────────────────────────────────────
React Developer        | 30       | 75%       | 90%
JavaScript Basics      | 45       | 82%       | 88%
Node.js Backend        | 25       | 68%       | 76%
```

## Best Practices

1. **Regular Review**: Check pending reviews daily to provide timely feedback
2. **Detailed Feedback**: Always add grading notes to help candidates improve
3. **Fair Grading**: Use consistent criteria across all attempts
4. **Monitor Trends**: Track statistics to identify difficult questions
5. **Quick Response**: Grade attempts within 24-48 hours for best candidate experience

## Related Endpoints

- Test CRUD: `/api/employer-tests/`
- Question Management: `/api/employer-questions/`
- Job Postings: `/api/employers/jobs`

## Support

For issues or questions about test monitoring, check:
- [Employer System Documentation](./docs/EMPLOYER_SYSTEM.md)
- [Test Grading Guide](./TEST_GRADING_SYSTEM.md)
- API logs in backend console
