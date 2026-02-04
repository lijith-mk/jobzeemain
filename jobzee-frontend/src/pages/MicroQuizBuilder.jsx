import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import './MicroQuizBuilder.css';

const MicroQuizBuilder = () => {
  const { lessonId, quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [quizData, setQuizData] = useState({
    lessonId: lessonId || '',
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
    instructions: 'Answer all questions to test your understanding of this lesson.',
    questions: []
  });

  const fetchLessonDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLesson(data.lesson);
      setQuizData(prev => ({
        ...prev,
        courseId: data.lesson.courseId._id || data.lesson.courseId,
        title: `${data.lesson.title} - Quiz`
      }));
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson details');
    }
  }, [lessonId]);

  const fetchQuizDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      let endpoint;
      
      // If quizId is provided, fetch by quiz ID, otherwise fetch by lesson ID
      if (quizId) {
        endpoint = `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/${quizId}`;
      } else if (lessonId) {
        endpoint = `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/lesson/${lessonId}`;
      } else {
        return;
      }
      
      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizData(data.quiz);
      
      // If fetched by quizId, also fetch lesson details using the quiz's lessonId
      if (quizId && data.quiz.lessonId) {
        const lessonResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/admin/lessons/${data.quiz.lessonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLesson(lessonResponse.data.lesson);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz details');
    }
  }, [lessonId, quizId]);

  useEffect(() => {
    if (lessonId && !quizId) {
      // Creating new quiz - fetch lesson details only
      fetchLessonDetails();
    } else if (quizId) {
      // Editing existing quiz - fetch quiz details (which will also fetch lesson)
      fetchQuizDetails();
    }
  }, [lessonId, quizId, fetchLessonDetails, fetchQuizDetails]);

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

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    
    // If setting this option as correct and it's multiple choice, unset others
    if (field === 'isCorrect' && value && updatedQuestions[questionIndex].questionType === 'true-false') {
      updatedQuestions[questionIndex].options.forEach((opt, idx) => {
        if (idx !== optionIndex) opt.isCorrect = false;
      });
    }
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    // Update order
    updatedQuestions.forEach((q, i) => q.order = i + 1);
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const moveQuestion = (index, direction) => {
    const updatedQuestions = [...quizData.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updatedQuestions.length) {
      [updatedQuestions[index], updatedQuestions[targetIndex]] = 
      [updatedQuestions[targetIndex], updatedQuestions[index]];
      
      // Update order
      updatedQuestions.forEach((q, i) => q.order = i + 1);
      setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const validateQuiz = () => {
    if (!quizData.title.trim()) {
      toast.error('Please enter a quiz title');
      return false;
    }

    if (quizData.questions.length === 0) {
      toast.error('Please add at least one question');
      return false;
    }

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1}: Please enter question text`);
        return false;
      }

      if (q.questionType === 'multiple-choice' || q.questionType === 'true-false') {
        if (q.options.length < 2) {
          toast.error(`Question ${i + 1}: Please add at least 2 options`);
          return false;
        }

        const hasCorrect = q.options.some(opt => opt.isCorrect);
        if (!hasCorrect) {
          toast.error(`Question ${i + 1}: Please mark at least one correct answer`);
          return false;
        }

        const emptyOptions = q.options.some(opt => !opt.text.trim());
        if (emptyOptions) {
          toast.error(`Question ${i + 1}: Please fill in all option texts`);
          return false;
        }
      } else if (q.questionType === 'fill-blank') {
        if (!q.correctAnswer.trim()) {
          toast.error(`Question ${i + 1}: Please enter the correct answer`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateQuiz()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = quizId 
        ? `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz/${quizId}`
        : `${process.env.REACT_APP_API_URL}/api/admin/micro-quiz`;
      
      const method = quizId ? 'put' : 'post';
      
      const { data } = await axios[method](endpoint, quizData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(data.message);
      navigate(-1);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="micro-quiz-builder">
      <div className="builder-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>{quizId ? 'Edit' : 'Create'} Micro Quiz</h1>
        {lesson && <p className="lesson-name">For Lesson: {lesson.title}</p>}
      </div>

      <form onSubmit={handleSubmit} className="quiz-form">
        {/* Quiz Settings */}
        <div className="settings-section card">
          <h2>📋 Quiz Settings</h2>
          
          <div className="form-group">
            <label>Quiz Title *</label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={quizData.description}
              onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the quiz"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea
              value={quizData.instructions}
              onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instructions for students"
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizData.passingScore}
                onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input
                type="number"
                min="0"
                value={quizData.timeLimit || ''}
                onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="No limit"
              />
            </div>

            <div className="form-group">
              <label>Max Attempts</label>
              <input
                type="number"
                min="0"
                value={quizData.maxAttempts}
                onChange={(e) => setQuizData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                placeholder="0 = unlimited"
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={quizData.shuffleQuestions}
                onChange={(e) => setQuizData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
              />
              <span>Shuffle Questions</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.shuffleOptions}
                onChange={(e) => setQuizData(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
              />
              <span>Shuffle Options</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.showCorrectAnswers}
                onChange={(e) => setQuizData(prev => ({ ...prev, showCorrectAnswers: e.target.checked }))}
              />
              <span>Show Correct Answers</span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={quizData.requirePassingToProgress}
                onChange={(e) => setQuizData(prev => ({ ...prev, requirePassingToProgress: e.target.checked }))}
              />
              <span>Require Passing to Progress</span>
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="questions-section">
          <div className="section-header">
            <h2>❓ Questions ({quizData.questions.length})</h2>
            <button type="button" className="add-question-btn" onClick={addQuestion}>
              + Add Question
            </button>
          </div>

          {quizData.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card card">
              <div className="question-header">
                <span className="question-number">Question {qIndex + 1}</span>
                <div className="question-actions">
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, 'up')}
                    disabled={qIndex === 0}
                    className="move-btn"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, 'down')}
                    disabled={qIndex === quizData.questions.length - 1}
                    className="move-btn"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                  placeholder="Enter your question"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={question.questionType}
                    onChange={(e) => {
                      updateQuestion(qIndex, 'questionType', e.target.value);
                      // Reset options based on type
                      if (e.target.value === 'true-false') {
                        updateQuestion(qIndex, 'options', [
                          { text: 'True', isCorrect: false },
                          { text: 'False', isCorrect: false }
                        ]);
                      } else if (e.target.value === 'fill-blank') {
                        updateQuestion(qIndex, 'options', []);
                      }
                    }}
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="fill-blank">Fill in the Blank</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Options for MCQ and True/False */}
              {(question.questionType === 'multiple-choice' || question.questionType === 'true-false') && (
                <div className="options-section">
                  <label>Options *</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-row">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                        title="Mark as correct"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        disabled={question.questionType === 'true-false'}
                        required
                      />
                      {question.questionType === 'multiple-choice' && question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="remove-option-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {question.questionType === 'multiple-choice' && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="add-option-btn"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Correct Answer for Fill-in-Blank */}
              {question.questionType === 'fill-blank' && (
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <input
                    type="text"
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                    placeholder="Enter the correct answer"
                    required
                  />
                  <small>Case-insensitive matching</small>
                </div>
              )}

              <div className="form-group">
                <label>Explanation (shown after submission)</label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain the correct answer"
                  rows="2"
                />
              </div>
            </div>
          ))}

          {quizData.questions.length === 0 && (
            <div className="empty-state">
              <p>No questions yet. Click "Add Question" to get started!</p>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : quizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MicroQuizBuilder;
