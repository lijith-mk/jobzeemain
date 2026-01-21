# Test Grading Quick Reference

## Admin Quick Actions

### 1. Check Tests Needing Grading
```bash
GET /api/admin/tests/pending-review
```

### 2. View Test Submission
```bash
GET /api/admin/tests/attempts/:attemptId
```

### 3. Grade a Test
```bash
PUT /api/admin/tests/attempts/:attemptId/grade
Body: {
  "questionGrades": [
    { "questionId": "...", "marksObtained": 15, "gradingNotes": "..." }
  ],
  "feedback": "Overall feedback..."
}
```

---

## User Quick Actions

### Check Test Result
```bash
GET /api/tests/results/:resultId
```

Returns:
- `gradingStatus: "pending-review"` → Still being graded
- `gradingStatus: "graded"` → Grading complete, see marks
- `gradingStatus: "auto-graded"` → No manual grading needed

---

## Grading Status Values

| Status | Meaning | Included in Statistics |
|--------|---------|----------------------|
| `auto-graded` | MCQ test, auto-scored | ✅ Yes |
| `pending-review` | Waiting for admin to grade | ❌ No (excluded from averages) |
| `graded` | Admin has completed grading | ✅ Yes |

**Important:** Performance statistics (average scores, pass rates) only include tests with status `auto-graded` or `graded`. Tests with `pending-review` status are counted separately and excluded from averages until grading is complete.

---

## Question Types & Grading

| Type | Auto-Graded | Needs Manual Grading |
|------|-------------|---------------------|
| MCQ | ✅ Yes | ❌ No |
| True/False | ✅ Yes | ❌ No |
| Coding | ❌ No | ✅ Yes |
| Essay | ❌ No | ✅ Yes |

---

## API Response Structure

### Test Statistics (Admin Performance Monitor)
```json
{
  "totalTests": 10,
  "totalAttempts": 150,
  "gradedAttempts": 135,
  "pendingReviews": 15,
  "averageScore": "75.50",
  "averagePercentage": "75.50",
  "passRate": "80.00"
}
```
**Note:** Statistics only include `auto-graded` and `graded` attempts. `pending-review` attempts are counted separately and excluded from averages.

### Test Result (User View)
```json
{
  "score": 75,
  "totalMarks": 100,
  "percentage": 75.00,
  "passed": true,
  "gradingStatus": "graded",
  "adminFeedback": "Great work!",
  "questionResults": [
    {
      "marks": 20,
      "marksObtained": 18,
      "gradingNotes": "Good solution"
    }
  ]
}
```

### Admin View
```json
{
  "userId": { "name": "...", "email": "..." },
  "testId": { "title": "..." },
  "gradingStatus": "pending-review",
  "questionResults": [
    {
      "userAnswer": "...",
      "codingDetails": { "expectedSolution": "..." },
      "marks": 20
    }
  ]
}
```

---

## Common Workflows

### Complete Grading Workflow
1. Admin checks pending tests: `GET /api/admin/tests/pending-review`
2. Admin opens test details: `GET /api/admin/tests/attempts/:id`
3. Admin reviews answers and assigns marks
4. Admin submits grades: `PUT /api/admin/tests/attempts/:id/grade`
5. User refreshes results: `GET /api/tests/results/:id`
6. User sees updated marks and feedback

### User Checking Result
1. User submits test → Gets `resultId`
2. User views result: `GET /api/tests/results/:resultId`
3. If `pending-review` → Wait for grading
4. If `graded` → View marks and feedback

---

## Filter Options

### Get Attempts by Status
```bash
GET /api/admin/tests/attempts?gradingStatus=pending-review
GET /api/admin/tests/attempts?gradingStatus=graded
GET /api/admin/tests/attempts?gradingStatus=auto-graded
```

### Get Attempts by Test
```bash
GET /api/admin/tests/attempts?testId=<testId>
```

### Combine Filters
```bash
GET /api/admin/tests/attempts?testId=<testId>&gradingStatus=pending-review
```

---

## Marks Validation

- ✅ Marks can be: 0 to question.marks (inclusive)
- ❌ Marks cannot be: negative or > question.marks
- System auto-validates and clamps values

Example:
- Question marks: 20
- Admin enters: 25 → System saves: 20 (clamped to max)
- Admin enters: -5 → System saves: 0 (clamped to min)

---

## Important Notes

⚠️ **Coding/Essay questions start with 0 marks** until manually graded  
⚠️ **Grading updates the total score** automatically  
⚠️ **Pass/fail status recalculates** after grading  
⚠️ **Users see marks immediately** after admin saves  
⚠️ **Grading is permanent** - can be updated but not undone  

---

## Success Indicators

✅ User sees "Your answers are under review"  
✅ Admin sees test in pending-review list  
✅ After grading: User sees marks and feedback  
✅ After grading: gradingStatus changes to "graded"  
✅ Score and percentage update correctly  

---

## Troubleshooting

**Problem**: User doesn't see updated marks  
**Solution**: Check gradingStatus is "graded", refresh result endpoint

**Problem**: Admin can't grade test  
**Solution**: Verify test status is "completed" and has gradingStatus "pending-review"

**Problem**: Marks not calculating correctly  
**Solution**: Ensure all questions have marksObtained set, system recalculates total

**Problem**: Test shows pending-review forever  
**Solution**: Admin must call grade endpoint to complete grading

---

Last Updated: January 13, 2026
