# Modular Database Structure for Mock Test Module

## Overview
The mock test module now uses a **modular database design** with separate collections for tests, questions, attempts, and answers. This ensures scalability, data integrity, and support for multiple question types.

## Database Collections

### 1. **Tests Collection** (`tests`)
Stores test metadata and configuration.

**Fields:**
- `_id`: ObjectId (Primary Key)
- `title`: String (required) - Test name
- `description`: String - Test description
- `jobRole`: String - Target job role
- `skill`: String - Skill being tested
- `type`: Enum ['mcq', 'coding', 'mixed', 'essay']
- `category`: Enum ['technical', 'aptitude', 'reasoning', 'language', 'general']
- `difficulty`: Enum ['easy', 'medium', 'hard']
- `duration`: Number - Duration in minutes
- `totalMarks`: Number - Total marks
- `passingMarks`: Number - Minimum marks to pass
- `questionCount`: Number - Count of questions (cached)
- `isActive`: Boolean - Whether test is published
- `createdBy`: ObjectId (ref: Admin)
- `tags`: Array of Strings
- `instructions`: String - Test instructions
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `title`
- `category`
- `type`
- `isActive`
- `jobRole`
- `skill`

**Virtual Field:**
- `questions`: Populated from Question collection

---

### 2. **Questions Collection** (`questions`)
Stores individual questions separately for better scalability.

**Fields:**
- `_id`: ObjectId (Primary Key)
- `testId`: ObjectId (ref: Test) - Foreign key to tests collection
- `questionText`: String (required) - Question content
- `type`: Enum ['mcq', 'coding', 'essay', 'true-false']
- `options`: Array of Strings - Answer options
- `correctAnswer`: String (required) - Correct answer
- `marks`: Number - Marks for this question
- `explanation`: String - Explanation of correct answer
- `difficulty`: Enum ['easy', 'medium', 'hard']
- `order`: Number - Question order in test
- `isActive`: Boolean - Whether question is active
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `testId, order` (Compound)
- `testId, isActive` (Compound)
- `type`

---

### 3. **Test Attempts Collection** (`testattempts`)
Stores metadata about each test attempt by a user.

**Fields:**
- `_id`: ObjectId (Primary Key)
- `userId`: ObjectId (ref: User) - Foreign key to users collection
- `testId`: ObjectId (ref: Test) - Foreign key to tests collection
- `testTitle`: String - Test name (cached)
- `score`: Number - Marks obtained
- `totalMarks`: Number - Total marks
- `passingMarks`: Number - Minimum marks to pass
- `percentage`: Number - Percentage score
- `correctAnswers`: Number - Count of correct answers
- `totalQuestions`: Number - Total questions answered
- `passed`: Boolean - Whether user passed
- `timeTaken`: Number - Time taken in seconds
- `autoSubmit`: Boolean - Whether auto-submitted
- `startedAt`: Date - When attempt started
- `completedAt`: Date - When attempt completed
- `status`: Enum ['in-progress', 'completed', 'abandoned']
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `userId, completedAt` (Compound, descending)
- `testId, completedAt` (Compound, descending)
- `userId, testId` (Compound)
- `status`

**Virtual Field:**
- `answers`: Populated from Answer collection

---

### 4. **Answers Collection** (`answers`)
Stores individual answers for each question in an attempt.

**Fields:**
- `_id`: ObjectId (Primary Key)
- `attemptId`: ObjectId (ref: TestAttempt) - Foreign key to testattempts collection
- `questionId`: ObjectId (ref: Question) - Foreign key to questions collection
- `questionText`: String (required) - Question content (cached)
- `userAnswer`: String - User's answer
- `correctAnswer`: String (required) - Correct answer (cached)
- `isCorrect`: Boolean - Whether answer was correct
- `marks`: Number - Maximum marks for question
- `marksObtained`: Number - Marks obtained
- `explanation`: String - Explanation
- `answeredAt`: Date - When answered
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `attemptId`
- `questionId`
- `attemptId, questionId` (Compound, unique)

---

## Benefits of Modular Structure

### 1. **Scalability**
- Questions can be reused across multiple tests
- Easy to add/remove questions without affecting test structure
- Supports test banks and question pools

### 2. **Data Integrity**
- Foreign key relationships ensure referential integrity
- Questions can be updated without affecting past attempts
- Historical data preserved separately

### 3. **Performance**
- Optimized indexes for fast queries
- Smaller document sizes improve query performance
- Virtual population loads only needed data

### 4. **Flexibility**
- Supports multiple question types (MCQ, True/False, Coding, Essay)
- Easy to extend with new fields
- Questions can have independent metadata (difficulty, tags)

### 5. **Analytics**
- Easy to analyze performance per question
- Track question difficulty and success rates
- Generate detailed reports

---

## Relationships

```
Test (1) ----< (Many) Question
  |
  |
  v
TestAttempt (Many) >---- (1) User
  |
  |
  v
Answer (Many) >---- (1) Question
```

---

## Migration from Embedded Structure

If you have existing data with embedded questions and questionResults, use the migration script:

```bash
node scripts/migrate-tests-to-modular.js
```

This script will:
1. Extract embedded questions into the Questions collection
2. Update Test documents to reference questions
3. Convert TestResult documents to TestAttempt documents
4. Extract questionResults into the Answers collection
5. Update indexes and counts

---

## Query Examples

### Fetch a test with questions:
```javascript
const test = await Test.findById(testId).populate('questions');
```

### Fetch an attempt with answers:
```javascript
const attempt = await TestAttempt.findById(attemptId).populate('answers');
```

### Get user's test history:
```javascript
const history = await TestAttempt.find({ userId })
  .populate('testId')
  .sort({ completedAt: -1 });
```

### Get question-wise performance:
```javascript
const questionStats = await Answer.aggregate([
  { $match: { questionId: questionId } },
  { $group: {
    _id: '$questionId',
    totalAttempts: { $sum: 1 },
    correctAttempts: { $sum: { $cond: ['$isCorrect', 1, 0] } }
  }}
]);
```

---

## Important Notes

1. **Virtual Population**: Tests and TestAttempts use virtual fields to populate related documents. Ensure `toJSON: { virtuals: true }` is set.

2. **Cached Fields**: Some fields (testTitle, questionText, correctAnswer) are cached in Answers/Attempts for performance and historical accuracy.

3. **Indexes**: All foreign keys are indexed for fast lookups. Compound indexes optimize common query patterns.

4. **Question Count**: The `questionCount` field in Test is cached and should be updated when questions are added/removed.

5. **Data Consistency**: Always update questionCount when modifying questions. Use atomic operations or transactions for critical updates.
