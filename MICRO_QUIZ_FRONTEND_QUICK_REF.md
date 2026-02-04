# Micro Quiz Frontend - Quick Reference

## 🎯 Component Routes

| Component | Route | Role | Purpose |
|-----------|-------|------|---------|
| MicroQuizBuilder | `/admin/quiz/create/:lessonId` | Admin | Create new quiz |
| MicroQuizBuilder | `/admin/quiz/edit/:quizId` | Admin | Edit existing quiz |
| QuizStatistics | `/admin/quiz/:quizId/stats` | Admin | View analytics |
| QuizTaker | `/lesson/:lessonId/quiz` | Student | Take quiz |
| QuizResults | `/quiz/results/:attemptId` | Student | View results |

---

## 🔑 Key Props & Params

### MicroQuizBuilder
```javascript
const { lessonId, quizId } = useParams();
// lessonId: For creating new quiz
// quizId: For editing existing quiz
```

### QuizTaker
```javascript
const { lessonId } = useParams();
// Fetches quiz associated with lesson
```

### QuizResults
```javascript
const { attemptId } = useParams();
// Displays specific attempt results
```

### QuizStatistics
```javascript
const { quizId } = useParams();
// Shows statistics for specific quiz
```

---

## 📡 API Calls Cheat Sheet

### Creating a Quiz (Admin)
```javascript
const token = localStorage.getItem('adminToken');
const response = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz`,
  quizData,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Taking a Quiz (Student)
```javascript
const token = localStorage.getItem('token');
const { data } = await axios.get(
  `${process.env.REACT_APP_API_URL}/api/micro-quiz/lesson/${lessonId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Submitting Answers (Student)
```javascript
const token = localStorage.getItem('token');
const { data } = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/micro-quiz/${quizId}/submit`,
  { userAnswers: { 0: 'answer1', 1: ['answer2', 'answer3'] } },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Getting Results (Student)
```javascript
const token = localStorage.getItem('token');
const { data } = await axios.get(
  `${process.env.REACT_APP_API_URL}/api/micro-quiz/attempt/${attemptId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Getting Statistics (Admin)
```javascript
const token = localStorage.getItem('adminToken');
const { data } = await axios.get(
  `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/${quizId}/stats`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 🎨 CSS Classes Quick Reference

### Layouts
- `.quiz-taker` - Main quiz container
- `.quiz-results` - Results page container
- `.quiz-statistics` - Statistics page container
- `.micro-quiz-builder` - Builder page container

### Cards
- `.card` - White background card
- `.question-card` - Quiz question container
- `.review-card` - Results review container
- `.stat-card` - Statistics metric card

### Status Indicators
- `.passing` - Green border/color
- `.failing` - Red border/color
- `.correct` - Green success state
- `.incorrect` - Red error state
- `.selected` - User's selected option

### Buttons
- `.submit-btn` - Purple gradient primary action
- `.cancel-btn` - Gray secondary action
- `.retry-btn` - Orange retry action
- `.continue-btn` - Green success action
- `.back-btn` - Light back/cancel button

### Badges
- `.result-badge.pass` - Green pass badge
- `.result-badge.fail` - Red fail badge
- `.score-badge` - Colored score indicator

---

## 🔄 State Management Patterns

### Quiz Builder State
```javascript
const [quizData, setQuizData] = useState({
  lessonId: '',
  courseId: '',
  title: '',
  description: '',
  passingScore: 70,
  timeLimit: null,
  maxAttempts: 3,
  shuffleQuestions: false,
  shuffleOptions: false,
  showCorrectAnswers: true,
  requirePassingToProgress: false,
  instructions: '',
  questions: []
});
```

### Quiz Taker State
```javascript
const [quiz, setQuiz] = useState(null);
const [userAnswers, setUserAnswers] = useState({});
const [timeRemaining, setTimeRemaining] = useState(null);
const [timerActive, setTimerActive] = useState(false);
const [attemptInfo, setAttemptInfo] = useState(null);
```

### Answer Format
```javascript
// Multiple Choice: Array of selected option texts
userAnswers[questionIndex] = ['Option 1', 'Option 3'];

// True/False: Single option text
userAnswers[questionIndex] = 'True';

// Fill in Blank: Text string
userAnswers[questionIndex] = 'My answer text';
```

---

## 🛠️ Common Operations

### Add New Question
```javascript
const addQuestion = () => {
  setQuizData(prev => ({
    ...prev,
    questions: [
      ...prev.questions,
      {
        questionText: '',
        questionType: 'multiple-choice',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        correctAnswer: '',
        points: 1,
        explanation: '',
        order: prev.questions.length + 1
      }
    ]
  }));
};
```

### Update Question
```javascript
const updateQuestion = (index, field, value) => {
  const updatedQuestions = [...quizData.questions];
  updatedQuestions[index][field] = value;
  setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
};
```

### Move Question Up/Down
```javascript
const moveQuestion = (index, direction) => {
  const updatedQuestions = [...quizData.questions];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  
  if (targetIndex >= 0 && targetIndex < updatedQuestions.length) {
    [updatedQuestions[index], updatedQuestions[targetIndex]] = 
    [updatedQuestions[targetIndex], updatedQuestions[index]];
    
    updatedQuestions.forEach((q, i) => q.order = i + 1);
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  }
};
```

### Timer Management
```javascript
useEffect(() => {
  if (timerActive && timeRemaining > 0) {
    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  } else if (timeRemaining === 0) {
    handleAutoSubmit();
  }
}, [timerActive, timeRemaining]);
```

### Format Time Display
```javascript
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### Calculate Score Percentage
```javascript
const getScorePercentage = () => {
  return ((attempt.score / attempt.totalPoints) * 100).toFixed(1);
};
```

### Check if Passing
```javascript
const isPassing = () => {
  return getScorePercentage() >= quiz.passingScore;
};
```

---

## 🎯 Validation Rules

### Quiz Builder
- Title: Required, non-empty
- Questions: At least 1 required
- Question Text: Required for each question
- Options: Min 2 for MCQ/True-False
- Correct Answer: At least 1 option marked correct
- Fill-in-Blank: Correct answer text required

### Quiz Taker
- Max attempts enforcement
- Time limit enforcement (auto-submit)
- Answer format validation

---

## 🎨 Color Palette

```javascript
const colors = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  info: '#2196f3',
  gray: '#666',
  lightGray: '#f0f0f0',
  white: '#ffffff'
};
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 769px) { }
```

---

## 🔧 Debugging Tips

### Check Quiz Exists
```javascript
// In browser console
const lessonId = 'YOUR_LESSON_ID';
const token = localStorage.getItem('token');
fetch(`${process.env.REACT_APP_API_URL}/api/micro-quiz/lesson/${lessonId}`, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

### Check Attempt Details
```javascript
// In browser console
const attemptId = 'YOUR_ATTEMPT_ID';
const token = localStorage.getItem('token');
fetch(`${process.env.REACT_APP_API_URL}/api/micro-quiz/attempt/${attemptId}`, {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log);
```

### Common Issues

**Quiz not loading**:
- Check `lessonId` parameter is correct
- Verify quiz exists for that lesson
- Check token is valid
- Confirm API URL is correct

**Submit failing**:
- Check answer format matches expected structure
- Verify quiz ID is correct
- Check max attempts not exceeded
- Confirm user is authenticated

**Timer not working**:
- Check `timeLimit` is set in quiz
- Verify `timerActive` state is true
- Check for console errors

**Statistics not showing**:
- Verify at least 1 attempt exists
- Check admin token is used
- Confirm quiz ID is correct

---

## 📦 File Structure

```
jobzee-frontend/src/
├── pages/
│   ├── MicroQuizBuilder.jsx (500+ lines)
│   ├── MicroQuizBuilder.css (400+ lines)
│   ├── QuizTaker.jsx (350+ lines)
│   ├── QuizTaker.css (450+ lines)
│   ├── QuizResults.jsx (250+ lines)
│   ├── QuizResults.css (500+ lines)
│   ├── QuizStatistics.jsx (200+ lines)
│   └── QuizStatistics.css (400+ lines)
└── App.js (updated with 5 new routes)
```

---

## 🚀 Quick Start Integration

### Step 1: Add Quiz Button to Lesson Viewer
```javascript
// In LessonViewer.jsx
import { Link } from 'react-router-dom';

// Add after lesson content
{lesson.hasQuiz && (
  <Link to={`/lesson/${lessonId}/quiz`} className="take-quiz-btn">
    📝 Take Quiz
  </Link>
)}
```

### Step 2: Add Admin Quiz Links
```javascript
// In AdminCourseView.jsx
<Link to={`/admin/quiz/create/${lesson._id}`}>
  ➕ Add Quiz
</Link>
<Link to={`/admin/quiz/edit/${lesson.microQuizId}`}>
  ✏️ Edit Quiz
</Link>
<Link to={`/admin/quiz/${lesson.microQuizId}/stats`}>
  📊 Statistics
</Link>
```

---

## ✅ Testing Checklist

Quick test scenarios:

**Create Quiz**:
1. Navigate to `/admin/quiz/create/LESSON_ID`
2. Fill in quiz details
3. Add 3 questions (one of each type)
4. Submit

**Take Quiz**:
1. Navigate to `/lesson/LESSON_ID/quiz`
2. Answer all questions
3. Submit
4. View results

**View Statistics**:
1. Navigate to `/admin/quiz/QUIZ_ID/stats`
2. Check all metrics display
3. Verify recent attempts table

---

## 📞 Quick Support

**Common Errors**:

`404 Not Found` → Check route is correct and quiz exists
`401 Unauthorized` → Verify token is present and valid
`403 Forbidden` → Check user role (admin vs student)
`500 Server Error` → Check backend is running and database connected

**Console Commands**:

```javascript
// Check tokens
console.log('User token:', localStorage.getItem('token'));
console.log('Admin token:', localStorage.getItem('adminToken'));

// Check environment
console.log('API URL:', process.env.REACT_APP_API_URL);
```

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: ✅ Production Ready
