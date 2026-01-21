# Frontend Integration Examples

## Admin Dashboard - Grading Interface

### 1. Pending Tests List Component

```jsx
import React, { useEffect, useState } from 'react';

const PendingTestsList = () => {
  const [pendingTests, setPendingTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTests();
  }, []);

  const fetchPendingTests = async () => {
    try {
      const response = await fetch('/api/admin/tests/pending-review', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setPendingTests(data.attempts);
    } catch (error) {
      console.error('Error fetching pending tests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="pending-tests-container">
      <h2>Tests Pending Review ({pendingTests.length})</h2>
      
      {pendingTests.length === 0 ? (
        <p>No tests pending review</p>
      ) : (
        <table className="tests-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Test Title</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingTests.map(attempt => (
              <tr key={attempt._id}>
                <td>{attempt.userId.name}</td>
                <td>{attempt.testId.title}</td>
                <td>{new Date(attempt.completedAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => window.location.href = `/admin/grade/${attempt._id}`}>
                    Grade Test
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingTestsList;
```

---

### 2. Test Grading Interface

```jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TestGradingPage = () => {
  const { attemptId } = useParams();
  const [testResult, setTestResult] = useState(null);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestDetails();
  }, [attemptId]);

  const fetchTestDetails = async () => {
    try {
      const response = await fetch(`/api/admin/tests/attempts/${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      setTestResult(data.result);
      
      // Initialize grades object
      const initialGrades = {};
      data.result.questionResults.forEach(q => {
        initialGrades[q.questionId] = {
          marksObtained: q.marksObtained || 0,
          gradingNotes: q.gradingNotes || ''
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Error fetching test details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (questionId, marks) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        marksObtained: parseFloat(marks) || 0
      }
    }));
  };

  const handleNotesChange = (questionId, notes) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        gradingNotes: notes
      }
    }));
  };

  const handleSubmitGrades = async () => {
    setSubmitting(true);
    try {
      const questionGrades = Object.entries(grades).map(([questionId, data]) => ({
        questionId,
        marksObtained: data.marksObtained,
        gradingNotes: data.gradingNotes
      }));

      const response = await fetch(`/api/admin/tests/attempts/${attemptId}/grade`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionGrades,
          feedback
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Grades submitted successfully!');
        window.location.href = '/admin/tests/pending-review';
      } else {
        alert('Error submitting grades: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Error submitting grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading test details...</div>;
  if (!testResult) return <div>Test not found</div>;

  return (
    <div className="grading-container">
      <div className="test-header">
        <h1>Grade Test: {testResult.testTitle}</h1>
        <div className="student-info">
          <p><strong>Student:</strong> {testResult.userId.name}</p>
          <p><strong>Email:</strong> {testResult.userId.email}</p>
          <p><strong>Submitted:</strong> {new Date(testResult.completedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="questions-container">
        {testResult.questionResults.map((question, index) => (
          <div key={question.questionId} className="question-card">
            <div className="question-header">
              <h3>Question {index + 1}</h3>
              <span className="marks-badge">{question.marks} marks</span>
            </div>

            <div className="question-text">
              <strong>{question.questionText}</strong>
            </div>

            {/* Coding Question */}
            {question.questionType === 'coding' && (
              <div className="coding-answer">
                <div className="user-answer">
                  <h4>Student's Code:</h4>
                  <pre><code>{question.userAnswer}</code></pre>
                </div>
                
                {question.codingDetails?.expectedSolution && (
                  <div className="expected-solution">
                    <h4>Expected Solution:</h4>
                    <pre><code>{question.codingDetails.expectedSolution}</code></pre>
                  </div>
                )}
              </div>
            )}

            {/* Essay Question */}
            {question.questionType === 'essay' && (
              <div className="essay-answer">
                <div className="user-answer">
                  <h4>Student's Answer:</h4>
                  <p>{question.userAnswer}</p>
                </div>
                
                {question.essayDetails?.expectedAnswer && (
                  <div className="expected-answer">
                    <h4>Model Answer:</h4>
                    <p>{question.essayDetails.expectedAnswer}</p>
                  </div>
                )}

                {question.essayDetails?.gradingCriteria && (
                  <div className="grading-criteria">
                    <h4>Grading Criteria:</h4>
                    <p>{question.essayDetails.gradingCriteria}</p>
                  </div>
                )}
              </div>
            )}

            {/* MCQ Question */}
            {question.questionType === 'mcq' && (
              <div className="mcq-answer">
                <p><strong>Student's Answer:</strong> {question.userAnswer}</p>
                <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                <p className={question.isCorrect ? 'correct' : 'incorrect'}>
                  {question.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                </p>
              </div>
            )}

            {/* Grading Section */}
            <div className="grading-section">
              <div className="marks-input">
                <label>
                  Marks Obtained:
                  <input
                    type="number"
                    min="0"
                    max={question.marks}
                    step="0.5"
                    value={grades[question.questionId]?.marksObtained || 0}
                    onChange={(e) => handleMarksChange(question.questionId, e.target.value)}
                  />
                  <span>/ {question.marks}</span>
                </label>
              </div>

              <div className="notes-input">
                <label>
                  Grading Notes (Feedback for student):
                  <textarea
                    rows="3"
                    value={grades[question.questionId]?.gradingNotes || ''}
                    onChange={(e) => handleNotesChange(question.questionId, e.target.value)}
                    placeholder="Provide feedback for this question..."
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overall-feedback">
        <h3>Overall Test Feedback</h3>
        <textarea
          rows="4"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide overall feedback for the entire test..."
        />
      </div>

      <div className="grading-summary">
        <h3>Grading Summary</h3>
        <p>
          <strong>Total Marks:</strong>{' '}
          {Object.values(grades).reduce((sum, g) => sum + (g.marksObtained || 0), 0)} / {testResult.totalMarks}
        </p>
      </div>

      <div className="actions">
        <button 
          onClick={handleSubmitGrades}
          disabled={submitting}
          className="submit-button"
        >
          {submitting ? 'Submitting...' : 'Submit Grades'}
        </button>
        <button 
          onClick={() => window.history.back()}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TestGradingPage;
```

---

### 3. User Results Display

```jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TestResultPage = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/tests/results/${resultId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error fetching result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading results...</div>;
  if (!result) return <div>Result not found</div>;

  return (
    <div className="result-container">
      {/* Header */}
      <div className="result-header">
        <h1>{result.testTitle}</h1>
        
        {/* Grading Status Banner */}
        {result.gradingStatus === 'pending-review' && (
          <div className="status-banner pending">
            ⏳ Your answers are being reviewed by our team. Results will be available soon.
          </div>
        )}
        
        {result.gradingStatus === 'graded' && (
          <div className="status-banner graded">
            ✅ Grading Complete!
          </div>
        )}
      </div>

      {/* Score Summary */}
      <div className="score-summary">
        <div className="score-card">
          <h2>{result.score} / {result.totalMarks}</h2>
          <p>Score</p>
        </div>
        
        <div className="score-card">
          <h2>{result.percentage}%</h2>
          <p>Percentage</p>
        </div>
        
        <div className="score-card">
          <h2>{result.passed ? '✅ Passed' : '❌ Failed'}</h2>
          <p>Status</p>
        </div>
      </div>

      {/* Admin Feedback */}
      {result.adminFeedback && result.gradingStatus === 'graded' && (
        <div className="admin-feedback">
          <h3>Instructor Feedback</h3>
          <p>{result.adminFeedback}</p>
        </div>
      )}

      {/* Questions and Answers */}
      <div className="questions-results">
        <h3>Question-wise Results</h3>
        
        {result.questionResults.map((question, index) => (
          <div key={question.questionId} className="question-result-card">
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className="marks">
                {question.marksObtained} / {question.marks} marks
              </span>
            </div>

            <div className="question-text">
              <p><strong>{question.questionText}</strong></p>
            </div>

            {/* Show answer for different question types */}
            <div className="answer-section">
              <div className="user-answer">
                <h4>Your Answer:</h4>
                
                {question.questionType === 'coding' && (
                  <pre><code>{question.userAnswer}</code></pre>
                )}
                
                {question.questionType === 'essay' && (
                  <p>{question.userAnswer}</p>
                )}
                
                {question.questionType === 'mcq' && (
                  <p className={question.isCorrect ? 'correct' : 'incorrect'}>
                    {question.userAnswer}
                    {question.isCorrect ? ' ✅' : ' ❌'}
                  </p>
                )}
              </div>

              {/* Show correct answer for MCQ after grading */}
              {question.questionType === 'mcq' && !question.isCorrect && (
                <div className="correct-answer">
                  <h4>Correct Answer:</h4>
                  <p>{question.correctAnswer}</p>
                </div>
              )}
            </div>

            {/* Grading Notes from Admin */}
            {question.gradingNotes && question.manuallyGraded && (
              <div className="grading-notes">
                <h4>Instructor Feedback:</h4>
                <p>{question.gradingNotes}</p>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="explanation">
                <h4>Explanation:</h4>
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="additional-info">
        <p><strong>Completed:</strong> {new Date(result.completedAt).toLocaleString()}</p>
        {result.gradedAt && (
          <p><strong>Graded:</strong> {new Date(result.gradedAt).toLocaleString()}</p>
        )}
        <p><strong>Time Taken:</strong> {Math.floor(result.timeTaken / 60)} minutes</p>
      </div>
    </div>
  );
};

export default TestResultPage;
```

---

## Sample CSS Styles

```css
/* Grading Interface Styles */
.grading-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.test-header {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.student-info p {
  margin: 5px 0;
}

.question-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.marks-badge {
  background: #007bff;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
}

.coding-answer pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.grading-section {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.marks-input input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin: 0 10px;
}

.notes-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: inherit;
  margin-top: 10px;
}

.submit-button {
  background: #28a745;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-right: 10px;
}

.submit-button:hover {
  background: #218838;
}

.submit-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Result Page Styles */
.status-banner {
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
  font-weight: 500;
}

.status-banner.pending {
  background: #fff3cd;
  color: #856404;
}

.status-banner.graded {
  background: #d4edda;
  color: #155724;
}

.score-summary {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.score-card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.score-card h2 {
  margin: 0;
  color: #007bff;
  font-size: 36px;
}

.admin-feedback {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.grading-notes {
  background: #fff3cd;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.correct {
  color: #28a745;
}

.incorrect {
  color: #dc3545;
}
```

---

## Usage Notes

1. **Replace localStorage with your auth solution** if using different state management
2. **Adjust API endpoints** if your base URL is different
3. **Add error boundaries** for production use
4. **Implement loading states** for better UX
5. **Add input validation** before submitting grades
6. **Consider accessibility** - add ARIA labels
7. **Add responsive design** for mobile devices

---

## Testing Frontend Integration

1. **Admin Flow:**
   - Login as admin
   - Navigate to pending tests
   - Click "Grade Test"
   - Assign marks and feedback
   - Submit grades
   - Verify success message

2. **User Flow:**
   - Login as user
   - Take a test with coding/essay questions
   - View result (should show pending-review)
   - Wait for admin to grade
   - Refresh result page
   - Verify marks and feedback display

---

Last Updated: January 13, 2026
