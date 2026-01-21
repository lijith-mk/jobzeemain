# Test Grading System - Complete Guide

## Overview
The test grading system now supports manual grading by admins for coding and essay questions, with full visibility for both admins and users.

## Features Implemented

### 1. **Admin Can View All User Answers**
Admins can now view complete test submissions including:
- MCQ answers (with correct/incorrect status)
- Coding question answers (user's code submission)
- Essay answers (user's written response)
- Question details including expected answers/solutions

### 2. **Manual Grading Workflow**
Admins can:
- View tests pending review
- Assign marks to individual questions
- Add grading notes/feedback for each question
- Provide overall admin feedback
- Mark tests as graded

### 3. **User View Updates**
Users can now see:
- Their grading status (auto-graded, pending-review, graded)
- Marks obtained for each question
- Admin grading notes and feedback
- When their test was graded and by whom

---

## API Endpoints

### Admin Endpoints

#### 1. Get Tests Pending Review
```http
GET /api/admin/tests/pending-review?page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "attempts": [
    {
      "_id": "attemptId",
      "userId": {
        "_id": "userId",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "testId": {
        "_id": "testId",
        "title": "JavaScript Coding Test",
        "type": "coding"
      },
      "score": 0,
      "totalMarks": 100,
      "gradingStatus": "pending-review",
      "completedAt": "2026-01-13T10:00:00.000Z"
    }
  ],
  "groupedByTest": [
    {
      "testId": "testId",
      "testTitle": "JavaScript Coding Test",
      "testType": "coding",
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

#### 2. Get All Test Attempts (with Filters)
```http
GET /api/admin/tests/attempts?testId=<testId>&gradingStatus=pending-review&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `testId` (optional) - Filter by specific test
- `gradingStatus` (optional) - Filter by status: `auto-graded`, `pending-review`, `graded`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "attempts": [...],
  "stats": {
    "auto-graded": 50,
    "pending-review": 15,
    "graded": 35
  },
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 5
  }
}
```

#### 3. Get Detailed Test Result (Admin View)
```http
GET /api/admin/tests/attempts/:resultId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "result": {
    "_id": "attemptId",
    "userId": {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "testId": {
      "_id": "testId",
      "title": "JavaScript Coding Test"
    },
    "score": 0,
    "totalMarks": 100,
    "gradingStatus": "pending-review",
    "completedAt": "2026-01-13T10:00:00.000Z",
    "questionResults": [
      {
        "_id": "answerId",
        "questionId": "questionId",
        "questionText": "Write a function to reverse a string",
        "questionType": "coding",
        "userAnswer": "function reverse(str) { return str.split('').reverse().join(''); }",
        "correctAnswer": "Manual Grading Required",
        "marks": 20,
        "marksObtained": 0,
        "manuallyGraded": false,
        "gradingNotes": "",
        "codingDetails": {
          "expectedSolution": "function reverse(str) { ... }",
          "testCases": [...]
        }
      },
      {
        "questionId": "questionId2",
        "questionText": "Explain closures in JavaScript",
        "questionType": "essay",
        "userAnswer": "A closure is a function that has access to...",
        "correctAnswer": "Manual Grading Required",
        "marks": 30,
        "marksObtained": 0,
        "essayDetails": {
          "expectedAnswer": "Closures are functions that retain access...",
          "gradingCriteria": "Check for understanding of scope, lexical environment..."
        }
      }
    ]
  }
}
```

#### 4. Grade Test Attempt
```http
PUT /api/admin/tests/attempts/:resultId/grade
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionGrades": [
    {
      "questionId": "questionId1",
      "marksObtained": 18,
      "gradingNotes": "Good solution, but could be optimized"
    },
    {
      "questionId": "questionId2",
      "marksObtained": 25,
      "gradingNotes": "Clear explanation with good examples"
    }
  ],
  "feedback": "Overall good performance. Keep practicing edge cases."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grades updated successfully",
  "result": {
    "_id": "attemptId",
    "score": 43,
    "totalMarks": 100,
    "percentage": 43.00,
    "passed": true,
    "gradingStatus": "graded",
    "gradedAt": "2026-01-13T12:00:00.000Z",
    "questionsGraded": 2
  }
}
```

### User Endpoints

#### Get Test Result (User View)
```http
GET /api/tests/results/:resultId
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "result": {
    "_id": "attemptId",
    "userId": "userId",
    "testId": "testId",
    "testTitle": "JavaScript Coding Test",
    "score": 43,
    "totalMarks": 100,
    "percentage": 43.00,
    "passed": true,
    "gradingStatus": "graded",
    "gradedAt": "2026-01-13T12:00:00.000Z",
    "adminFeedback": "Overall good performance. Keep practicing edge cases.",
    "completedAt": "2026-01-13T10:00:00.000Z",
    "questionResults": [
      {
        "questionId": "questionId1",
        "questionText": "Write a function to reverse a string",
        "questionType": "coding",
        "userAnswer": "function reverse(str) { return str.split('').reverse().join(''); }",
        "marks": 20,
        "marksObtained": 18,
        "manuallyGraded": true,
        "gradingNotes": "Good solution, but could be optimized",
        "codingDetails": {
          "expectedSolution": "function reverse(str) { ... }"
        }
      }
    ]
  }
}
```

---

## Database Schema Updates

### TestAttempt Model
Added field:
```javascript
adminFeedback: {
  type: String,
  default: ''
}
```

### Answer Model (Already Present)
Key fields for grading:
```javascript
{
  marksObtained: Number,
  manuallyGraded: Boolean,
  gradingNotes: String,
  userAnswer: String,
  codingDetails: Mixed,
  essayDetails: Mixed
}
```

---

## Grading Status Flow

```
User submits test
        ↓
System auto-grades MCQ questions
        ↓
Has coding/essay questions?
    ├─ No  → gradingStatus: "auto-graded" (Done)
    ├─ Yes → gradingStatus: "pending-review"
              ↓
         Admin views submission
              ↓
         Admin assigns marks
              ↓
         gradingStatus: "graded"
              ↓
         User sees updated marks
```

---

## Frontend Implementation Guide

### 1. Admin Dashboard - Pending Reviews
```javascript
// Fetch tests needing review
const response = await fetch('/api/admin/tests/pending-review', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();

// Display list of pending reviews
data.attempts.forEach(attempt => {
  console.log(`${attempt.userId.name} - ${attempt.testId.title}`);
  console.log(`Submitted: ${attempt.completedAt}`);
});
```

### 2. Admin Grading Interface
```javascript
// Get full test details
const response = await fetch(`/api/admin/tests/attempts/${attemptId}`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const { result } = await response.json();

// Display each question with user's answer
result.questionResults.forEach(question => {
  if (question.questionType === 'coding') {
    console.log('Code submitted:', question.userAnswer);
    console.log('Expected solution:', question.codingDetails.expectedSolution);
  } else if (question.questionType === 'essay') {
    console.log('Essay:', question.userAnswer);
    console.log('Model answer:', question.essayDetails.expectedAnswer);
  }
});

// Submit grades
const gradeResponse = await fetch(`/api/admin/tests/attempts/${attemptId}/grade`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionGrades: [
      {
        questionId: 'q1',
        marksObtained: 18,
        gradingNotes: 'Good work!'
      }
    ],
    feedback: 'Overall excellent performance'
  })
});
```

### 3. User Results Display
```javascript
// Fetch user's result
const response = await fetch(`/api/tests/results/${resultId}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
const { result } = await response.json();

// Display grading status
if (result.gradingStatus === 'pending-review') {
  console.log('Your answers are being reviewed by our team');
} else if (result.gradingStatus === 'graded') {
  console.log('Grading completed!');
  console.log('Admin feedback:', result.adminFeedback);
  
  // Show individual question marks
  result.questionResults.forEach(q => {
    console.log(`${q.questionText}: ${q.marksObtained}/${q.marks}`);
    if (q.gradingNotes) {
      console.log(`Feedback: ${q.gradingNotes}`);
    }
  });
}
```

---

## Key Features Summary

✅ **Admin can see all user answers** including coding and essay responses  
✅ **Manual marking system** with per-question grading  
✅ **Grading notes** for each question  
✅ **Overall admin feedback** for the entire test  
✅ **Grading status tracking** (auto-graded, pending-review, graded)  
✅ **User visibility** of marks and feedback  
✅ **Automatic score recalculation** after manual grading  
✅ **Pass/fail status update** based on manual marks  
✅ **Filter and search** for tests needing review  
✅ **Grouped view** of pending tests by test type  

---

## Testing the System

### 1. Create a Coding Test
```javascript
// Create test with coding questions
POST /api/admin/tests
{
  "title": "JavaScript Fundamentals",
  "type": "coding",
  "questions": [
    {
      "type": "coding",
      "questionText": "Write a function to reverse a string",
      "marks": 20,
      "codingDetails": {
        "expectedSolution": "function reverse(str) { return str.split('').reverse().join(''); }"
      }
    }
  ]
}
```

### 2. User Takes Test
```javascript
// User submits test
POST /api/tests/:testId/submit
{
  "answers": {
    "questionId1": "function reverse(str) { return str.split('').reverse().join(''); }"
  }
}
// Response: gradingStatus: "pending-review"
```

### 3. Admin Grades Test
```javascript
// Admin views pending tests
GET /api/admin/tests/pending-review

// Admin grades the attempt
PUT /api/admin/tests/attempts/:attemptId/grade
{
  "questionGrades": [
    {
      "questionId": "questionId1",
      "marksObtained": 18,
      "gradingNotes": "Correct solution"
    }
  ]
}
```

### 4. User Views Results
```javascript
// User checks result
GET /api/tests/results/:resultId
// Response includes:
// - gradingStatus: "graded"
// - marksObtained: 18
// - gradingNotes: "Correct solution"
```

---

## Best Practices

1. **Always validate marks** - Ensure marksObtained ≤ maximum marks
2. **Provide constructive feedback** - Help users improve
3. **Grade consistently** - Use grading criteria from question details
4. **Regular monitoring** - Check pending-review queue regularly
5. **Clear communication** - Inform users about grading timeline

---

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- `404`: Test attempt not found
- `400`: Invalid request data (e.g., marks exceed maximum)
- `401`: Unauthorized (missing or invalid token)
- `500`: Server error

---

## Future Enhancements

- Email notifications when grading is complete
- Bulk grading for multiple attempts
- Grading templates for common feedback
- Analytics dashboard for grading efficiency
- Auto-grading for basic coding questions using test cases

---

Last Updated: January 13, 2026
