# Question Bank Quick Reference

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/employer-questions` | List all questions |
| GET | `/api/employer-questions/:id` | Get single question |
| POST | `/api/employer-questions` | Create question |
| PUT | `/api/employer-questions/:id` | Update question |
| DELETE | `/api/employer-questions/:id` | Delete question |
| POST | `/api/employer-questions/:id/duplicate` | Duplicate question |
| POST | `/api/employer-questions/:id/move` | Move to another test |
| POST | `/api/employer-questions/bulk/delete` | Delete multiple |
| GET | `/api/employer-questions/statistics/overview` | Get statistics |

## Quick Examples

### List Questions with Filters
```bash
GET /api/employer-questions?type=mcq&difficulty=medium&page=1&limit=20
```

### Create Question
```json
POST /api/employer-questions
{
  "testId": "test123",
  "questionText": "What is React?",
  "type": "mcq",
  "options": ["Library", "Framework", "Language", "Tool"],
  "correctAnswer": "Library",
  "marks": 5
}
```

### Duplicate to Another Test
```json
POST /api/employer-questions/q123/duplicate
{
  "targetTestId": "test456"
}
```

### Move Question
```json
POST /api/employer-questions/q123/move
{
  "targetTestId": "test789"
}
```

### Bulk Delete
```json
POST /api/employer-questions/bulk/delete
{
  "questionIds": ["q1", "q2", "q3"]
}
```

## Features

✅ **Centralized Management** - All questions in one place  
✅ **Advanced Filtering** - By type, difficulty, test  
✅ **Search** - Find questions by text  
✅ **Duplicate** - Reuse across tests  
✅ **Move** - Reorganize between tests  
✅ **Bulk Delete** - Remove multiple at once  
✅ **Statistics** - View distribution  
✅ **Auto-Updates** - Test counts maintained

## Key Benefits

1. **No More Navigating** - View all questions without opening each test
2. **Quick Edits** - Update questions directly from the list
3. **Easy Reuse** - Duplicate questions to multiple tests
4. **Better Organization** - Move questions where they belong
5. **Efficient Cleanup** - Bulk delete outdated questions

## Frontend Integration

```javascript
// Get all questions
const questions = await fetch('/api/employer-questions', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Filter MCQ questions
const mcqs = await fetch('/api/employer-questions?type=mcq', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Duplicate question
await fetch(`/api/employer-questions/${qId}/duplicate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ targetTestId: 'test123' })
});

// Get statistics
const stats = await fetch('/api/employer-questions/statistics/overview', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

## Common Use Cases

### 1. Review All Questions
Filter and browse all questions from all tests in a single view.

### 2. Reuse Questions
Duplicate high-quality questions to multiple tests without manual recreation.

### 3. Reorganize Tests
Move questions that were added to wrong tests.

### 4. Update Questions
Edit questions directly without navigating through tests.

### 5. Clean Up
Bulk delete outdated or incorrect questions efficiently.

---

**Full Documentation:** [EMPLOYER_QUESTION_BANK.md](EMPLOYER_QUESTION_BANK.md)
