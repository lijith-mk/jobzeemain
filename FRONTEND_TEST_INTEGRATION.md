# Employer Test Feature - Frontend Integration Guide

## 🚀 Getting Started

The employer test feature is available through dedicated API endpoints. Here's how to integrate it into your frontend.

## 📍 API Endpoints

### Base URLs
- **Tests Management**: `/api/employer-tests`
- **Questions Management**: `/api/employer-questions`
- **Quick Access**: `/api/employers/tests` (limited, use above for full features)

## 🔑 Authentication

All endpoints require employer authentication token in header:
```javascript
headers: {
  'Authorization': `Bearer ${employerToken}`
}
```

## 📊 Quick Summary Endpoint

### Get Test Summary
```javascript
GET /api/employers/tests/summary

Response:
{
  "success": true,
  "summary": {
    "totalTests": 5,
    "activeTests": 3,
    "inactiveTests": 2,
    "totalQuestions": 45
  },
  "endpoints": {
    "tests": "/api/employer-tests",
    "questions": "/api/employer-questions"
  }
}
```

## 🎯 Main Features & Endpoints

### 1. Test Management

#### List All Tests
```javascript
GET /api/employer-tests?page=1&limit=10

// Optional filters:
// - isActive=true/false
// - type=mcq/coding/essay/mixed
// - category=technical/aptitude/reasoning

fetch('/api/employer-tests?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log(data.tests); // Array of tests
  console.log(data.pagination); // Pagination info
});
```

#### Get Single Test
```javascript
GET /api/employer-tests/:testId

const testId = 'abc123';
fetch(`/api/employer-tests/${testId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log(data.test); // Test with questions
});
```

#### Create Test
```javascript
POST /api/employer-tests

const testData = {
  title: 'React Developer Test',
  description: 'Test for React developers',
  type: 'mixed', // mcq, coding, essay, mixed
  category: 'technical',
  difficulty: 'medium',
  duration: 45, // minutes
  totalMarks: 50,
  passingMarks: 30,
  instructions: 'Answer all questions carefully.'
};

fetch('/api/employer-tests', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log(data.test); // Created test
});
```

#### Update Test
```javascript
PUT /api/employer-tests/:testId

fetch(`/api/employer-tests/${testId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Title',
    duration: 60
  })
});
```

#### Delete Test
```javascript
DELETE /api/employer-tests/:testId

fetch(`/api/employer-tests/${testId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Activate/Deactivate Test
```javascript
PATCH /api/employer-tests/:testId/toggle-active

fetch(`/api/employer-tests/${testId}/toggle-active`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Question Management (Within Test)

#### Get Test Questions
```javascript
GET /api/employer-tests/:testId/questions

fetch(`/api/employer-tests/${testId}/questions`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Add Question to Test
```javascript
POST /api/employer-tests/:testId/questions

// MCQ Question
const mcqQuestion = {
  questionText: 'What is React?',
  type: 'mcq',
  options: ['Library', 'Framework', 'Language', 'Tool'],
  correctAnswer: 'Library',
  marks: 5,
  difficulty: 'easy'
};

// Coding Question
const codingQuestion = {
  questionText: 'Implement useState hook',
  type: 'coding',
  marks: 15,
  difficulty: 'medium',
  codingDetails: {
    problemStatement: 'Create a React component...',
    sampleInput: 'Initial state',
    sampleOutput: 'Updated state',
    testCases: [
      { input: 'test', expectedOutput: 'result' }
    ]
  }
};

fetch(`/api/employer-tests/${testId}/questions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(mcqQuestion)
});
```

#### Update Question
```javascript
PUT /api/employer-tests/:testId/questions/:questionId

fetch(`/api/employer-tests/${testId}/questions/${questionId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionText: 'Updated question',
    marks: 10
  })
});
```

#### Delete Question
```javascript
DELETE /api/employer-tests/:testId/questions/:questionId

fetch(`/api/employer-tests/${testId}/questions/${questionId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Question Bank (Centralized Management)

#### View All Questions
```javascript
GET /api/employer-questions?page=1&limit=20

// Filters:
// - type=mcq/coding/essay
// - difficulty=easy/medium/hard
// - testId=specific_test_id
// - search=keyword

fetch('/api/employer-questions?type=mcq&difficulty=medium', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log(data.questions); // All questions
  console.log(data.statistics); // Question stats
});
```

#### Duplicate Question
```javascript
POST /api/employer-questions/:questionId/duplicate

// Duplicate to another test
fetch(`/api/employer-questions/${questionId}/duplicate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetTestId: 'target_test_id' // optional
  })
});
```

#### Move Question
```javascript
POST /api/employer-questions/:questionId/move

fetch(`/api/employer-questions/${questionId}/move`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetTestId: 'target_test_id'
  })
});
```

#### Bulk Delete Questions
```javascript
POST /api/employer-questions/bulk/delete

fetch('/api/employer-questions/bulk/delete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionIds: ['id1', 'id2', 'id3']
  })
});
```

#### Get Question Statistics
```javascript
GET /api/employer-questions/statistics/overview

fetch('/api/employer-questions/statistics/overview', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log(data.statistics);
  // { total: 45, byType: [...], byDifficulty: [...] }
});
```

### 4. Job Integration

#### Create Job with Test
```javascript
POST /api/employers/jobs

const jobData = {
  title: 'React Developer',
  description: 'Looking for React developer',
  location: 'Remote',
  jobType: 'full-time',
  experienceLevel: 'mid',
  skills: ['React', 'JavaScript'],
  testId: 'test_id_here', // Link test to job
  requiresTest: true // Make test mandatory
};

fetch('/api/employers/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(jobData)
});
```

## 🎨 Frontend Pages to Create

### 1. Test Management Dashboard
**Route**: `/employer/tests`

Features:
- List all tests
- Filter by status (active/inactive)
- Create new test button
- Quick stats (total tests, questions, etc.)

### 2. Test Creation/Edit Page
**Route**: `/employer/tests/create` or `/employer/tests/:id/edit`

Features:
- Test form (title, description, type, etc.)
- Question management section
- Preview test
- Activate/deactivate toggle

### 3. Question Bank Page
**Route**: `/employer/questions`

Features:
- List all questions from all tests
- Filter by type, difficulty, test
- Search functionality
- Duplicate/move/delete actions
- Bulk operations

### 4. Job Posting with Test
**Route**: `/employer/jobs/create`

Features:
- Regular job fields
- Test selection dropdown
- "Create New Test" button
- Toggle "Requires Test" checkbox

## 💡 Example React Components

### Test List Component
```jsx
import { useEffect, useState } from 'react';

function TestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTests();
  }, []);
  
  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch('/api/employer-tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTests(data.tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleActive = async (testId) => {
    const token = localStorage.getItem('employerToken');
    await fetch(`/api/employer-tests/${testId}/toggle-active`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTests(); // Refresh list
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="test-list">
      <h2>My Tests</h2>
      {tests.map(test => (
        <div key={test._id} className="test-card">
          <h3>{test.title}</h3>
          <p>{test.questionCount} questions | {test.duration} mins</p>
          <button onClick={() => toggleActive(test._id)}>
            {test.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Create Test Component
```jsx
import { useState } from 'react';

function CreateTest() {
  const [formData, setFormData] = useState({
    title: '',
    type: 'mcq',
    duration: 30,
    totalMarks: 50,
    passingMarks: 30
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('employerToken');
    
    const response = await fetch('/api/employer-tests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      // Redirect to test details or questions page
      window.location.href = `/employer/tests/${data.test._id}/questions`;
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Test Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      
      <select
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
      >
        <option value="mcq">Multiple Choice</option>
        <option value="coding">Coding</option>
        <option value="essay">Essay</option>
        <option value="mixed">Mixed</option>
      </select>
      
      <input
        type="number"
        placeholder="Duration (minutes)"
        value={formData.duration}
        onChange={(e) => setFormData({...formData, duration: e.target.value})}
      />
      
      <button type="submit">Create Test</button>
    </form>
  );
}
```

## 🔍 Checking if Feature is Working

Run these tests in your browser console or API client:

```javascript
// 1. Get test summary (requires employer login)
fetch('/api/employers/tests/summary', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(console.log);

// 2. List tests
fetch('/api/employer-tests', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(r => r.json())
.then(console.log);

// 3. Create a test
fetch('/api/employer-tests', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test from Console',
    type: 'mcq',
    duration: 30
  })
})
.then(r => r.json())
.then(console.log);
```

## ⚠️ Common Issues

1. **404 Not Found**: Make sure backend server is running
2. **401 Unauthorized**: Check if token is valid and in correct format
3. **Empty test list**: Create a test first using POST endpoint
4. **Can't activate test**: Add questions first before activating

## 📝 Next Steps

1. Create navigation menu item for "Tests" in employer dashboard
2. Create the test management pages
3. Add test selection to job posting form
4. Test the complete flow: Create Test → Add Questions → Activate → Link to Job

---

**Backend is ready!** All you need is to create the frontend UI to consume these APIs.
