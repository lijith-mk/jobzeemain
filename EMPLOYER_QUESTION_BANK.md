# Employer Question Bank - Separate Question Management

## Overview

Employers now have a dedicated section to manage their questions independently. This provides a centralized question library where questions can be viewed, edited, and organized across all tests.

## Key Features

### ✨ Centralized Question Management
- View all questions from all tests in one place
- Filter by type, difficulty, test, or search text
- Edit questions directly from the question bank
- Delete questions with automatic test updates

### 🔄 Question Operations
- **Duplicate**: Copy questions to the same or different tests
- **Move**: Transfer questions between tests
- **Bulk Delete**: Remove multiple questions at once
- **Statistics**: View question distribution and metrics

### 🎯 Benefits
- No need to navigate through tests to manage questions
- Reuse questions across multiple tests easily
- Better organization and overview of question library
- Quick access to edit or remove questions

## API Endpoints

### Question Library Management

#### Get All Questions
```http
GET /api/employer-questions
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- type: mcq|coding|essay|true-false
- difficulty: easy|medium|hard
- testId: specific test ID
- search: text search in question text
```

**Response:**
```json
{
  "success": true,
  "questions": [...],
  "statistics": {
    "total": 45,
    "byType": [
      { "_id": "mcq", "count": 30 },
      { "_id": "coding", "count": 10 },
      { "_id": "essay", "count": 5 }
    ],
    "totalTests": 5
  },
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 45
  }
}
```

#### Get Specific Question
```http
GET /api/employer-questions/:questionId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "question": {
    "_id": "...",
    "questionText": "What is React?",
    "type": "mcq",
    "options": ["Library", "Framework", "Language", "Tool"],
    "correctAnswer": "Library",
    "marks": 5,
    "testId": {
      "_id": "...",
      "title": "React Developer Test",
      "type": "mixed"
    }
  }
}
```

#### Create New Question
```http
POST /api/employer-questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "testId": "test_id_here",
  "questionText": "Your question here?",
  "type": "mcq",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "marks": 5,
  "difficulty": "medium"
}
```

#### Update Question
```http
PUT /api/employer-questions/:questionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionText": "Updated question?",
  "marks": 10
}
```

#### Delete Question
```http
DELETE /api/employer-questions/:questionId
Authorization: Bearer <token>
```

### Advanced Operations

#### Duplicate Question
Copy a question to the same or different test
```http
POST /api/employer-questions/:questionId/duplicate
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetTestId": "target_test_id" // optional, duplicates to same test if not provided
}
```

#### Move Question
Transfer question to another test
```http
POST /api/employer-questions/:questionId/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetTestId": "target_test_id"
}
```

#### Bulk Delete
Delete multiple questions at once
```http
POST /api/employer-questions/bulk/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionIds": ["id1", "id2", "id3"]
}
```

#### Get Statistics
View question distribution and metrics
```http
GET /api/employer-questions/statistics/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total": 45,
    "byType": [
      { "_id": "mcq", "count": 30 },
      { "_id": "coding", "count": 10 }
    ],
    "byDifficulty": [
      { "_id": "easy", "count": 15 },
      { "_id": "medium", "count": 20 },
      { "_id": "hard", "count": 10 }
    ],
    "totalTests": 5
  }
}
```

## Use Cases

### 1. View All Questions
```javascript
// Get all questions with filters
const response = await fetch('/api/employer-questions?type=mcq&difficulty=medium', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(`Total MCQ medium questions: ${data.questions.length}`);
```

### 2. Edit Question Directly
```javascript
// Update question from question bank
await fetch(`/api/employer-questions/${questionId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionText: 'Updated question text',
    marks: 10
  })
});
```

### 3. Reuse Questions
```javascript
// Duplicate question to another test
await fetch(`/api/employer-questions/${questionId}/duplicate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetTestId: 'new_test_id'
  })
});
```

### 4. Reorganize Questions
```javascript
// Move question from one test to another
await fetch(`/api/employer-questions/${questionId}/move`, {
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

### 5. Bulk Operations
```javascript
// Delete multiple questions
const selectedQuestions = ['id1', 'id2', 'id3'];
await fetch('/api/employer-questions/bulk/delete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questionIds: selectedQuestions
  })
});
```

## Frontend UI Suggestions

### Question Bank Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ Question Bank                              [+ New Question]│
├─────────────────────────────────────────────────────────┤
│ Filters:                                                │
│ Type: [All ▼] Difficulty: [All ▼] Test: [All ▼]       │
│ Search: [________________]                    [Search] │
├─────────────────────────────────────────────────────────┤
│ Statistics:                                             │
│ Total: 45 | MCQ: 30 | Coding: 10 | Essay: 5           │
├─────────────────────────────────────────────────────────┤
│ ☐ What is React?                              [Actions ▼]│
│   MCQ | 5 marks | Medium | React Developer Test         │
│   Edit | Duplicate | Move | Delete                      │
│                                                         │
│ ☐ Implement useState hook                    [Actions ▼]│
│   Coding | 15 marks | Hard | Advanced React Test       │
│   Edit | Duplicate | Move | Delete                      │
│                                                         │
│ ☐ Explain Virtual DOM                        [Actions ▼]│
│   Essay | 10 marks | Medium | React Basics Test        │
│   Edit | Duplicate | Move | Delete                      │
├─────────────────────────────────────────────────────────┤
│ [✓ Select All] [Bulk Delete]         [← Prev] [Next →] │
└─────────────────────────────────────────────────────────┘
```

### Question Actions Menu
```
Actions ▼
├─ Edit Question
├─ Duplicate to...
│  ├─ Same Test
│  └─ Other Tests >
│     ├─ React Advanced Test
│     ├─ JavaScript Basics
│     └─ Full Stack Assessment
├─ Move to...
│  ├─ React Advanced Test
│  ├─ JavaScript Basics
│  └─ Full Stack Assessment
└─ Delete
```

## Workflow Examples

### Scenario 1: Reusing Questions
```
1. Employer creates a React test with 10 questions
2. Later creates a Full Stack test
3. Goes to Question Bank
4. Filters questions by "React"
5. Selects relevant questions
6. Duplicates them to Full Stack test
7. Questions are now in both tests
```

### Scenario 2: Reorganizing Tests
```
1. Employer has 3 tests with mixed questions
2. Realizes some questions are in wrong tests
3. Opens Question Bank
4. Uses Move feature to transfer questions
5. Tests are now properly organized
6. Test question counts automatically updated
```

### Scenario 3: Bulk Management
```
1. Employer reviews all questions
2. Identifies outdated questions
3. Selects multiple questions using checkboxes
4. Uses Bulk Delete
5. All selected questions removed
6. Tests automatically updated
```

## Security & Validation

### Ownership Checks
✅ Can only view own questions  
✅ Can only edit/delete own questions  
✅ Can only duplicate/move to own tests  
✅ Bulk operations verify ownership

### Automatic Updates
✅ Test question counts auto-updated  
✅ Test order automatically maintained  
✅ Tests auto-deactivated if no questions  
✅ Remaining questions reordered

### Validation
✅ MCQ requires options and correct answer  
✅ Coding requires problem statement  
✅ Cannot move to non-existent test  
✅ Cannot access other employer's questions

## Integration with Existing Features

### Works Seamlessly With
- Test creation/management
- Job posting with tests
- Existing question routes in test management
- All existing validation and security

### No Breaking Changes
- Test-based question management still works
- Backward compatible with existing code
- Additional convenience layer on top

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| View Questions | Navigate through each test | View all in one place |
| Edit Questions | Open test, find question | Direct edit from list |
| Reuse Questions | Manual copy-paste | One-click duplicate |
| Reorganize | Delete and recreate | Move between tests |
| Find Questions | Search each test | Search across all tests |
| Bulk Operations | One by one | Select multiple |

## Next Steps

### Frontend Implementation
1. Create Question Bank page
2. Add filters and search
3. Implement question list with actions
4. Add duplicate/move modals
5. Bulk operation checkboxes
6. Statistics dashboard

### Recommended Features
- Question preview modal
- Quick edit inline
- Drag-and-drop reordering
- Question templates
- Import/export questions
- Question version history

## Complete Example

```javascript
// Employer Question Management Class
class QuestionBankManager {
  constructor(token) {
    this.token = token;
    this.baseUrl = '/api/employer-questions';
  }

  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async create(questionData) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionData)
    });
    return response.json();
  }

  async update(questionId, updateData) {
    const response = await fetch(`${this.baseUrl}/${questionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    return response.json();
  }

  async delete(questionId) {
    const response = await fetch(`${this.baseUrl}/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  async duplicate(questionId, targetTestId = null) {
    const response = await fetch(`${this.baseUrl}/${questionId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetTestId })
    });
    return response.json();
  }

  async move(questionId, targetTestId) {
    const response = await fetch(`${this.baseUrl}/${questionId}/move`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetTestId })
    });
    return response.json();
  }

  async bulkDelete(questionIds) {
    const response = await fetch(`${this.baseUrl}/bulk/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionIds })
    });
    return response.json();
  }

  async getStatistics() {
    const response = await fetch(`${this.baseUrl}/statistics/overview`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }
}

// Usage
const qbManager = new QuestionBankManager(employerToken);

// View all MCQ questions
const mcqQuestions = await qbManager.getAll({ type: 'mcq' });

// Duplicate question to another test
await qbManager.duplicate(questionId, 'target_test_id');

// Bulk delete
await qbManager.bulkDelete(['id1', 'id2', 'id3']);

// Get statistics
const stats = await qbManager.getStatistics();
console.log(`Total questions: ${stats.statistics.total}`);
```

---

**Status:** ✅ Ready for Use  
**Route:** `/api/employer-questions`  
**Documentation:** Complete  
**Integration:** Seamless with existing features
