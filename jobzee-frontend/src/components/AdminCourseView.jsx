import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './AdminCourseView.css';

const AdminCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    videoUrl: '',
    textContent: '',
    duration: '',
    difficultyLevel: 'beginner',
    lessonOrder: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchCourseData();
    fetchCourseQuizzes();
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
        setLessons(data.lessons || []);
      } else {
        toast.error('Failed to load course');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/micro-quiz/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      } else {
        console.error('Failed to load quizzes');
      }
    } catch (error) {
      console.error('Fetch quizzes error:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const openAddLessonModal = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      videoUrl: '',
      textContent: '',
      duration: '',
      difficultyLevel: 'beginner',
      lessonOrder: lessons.length + 1,
      description: '',
      isActive: true
    });
    setShowLessonModal(true);
  };

  const openEditLessonModal = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl || '',
      textContent: lesson.textContent || '',
      duration: lesson.duration,
      difficultyLevel: lesson.difficultyLevel,
      lessonOrder: lesson.lessonOrder,
      description: lesson.description || '',
      isActive: lesson.isActive
    });
    setShowLessonModal(true);
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingLesson
        ? `${API_BASE_URL}/api/admin/lessons/${editingLesson._id}`
        : `${API_BASE_URL}/api/admin/courses/${courseId}/lessons`;
      
      const method = editingLesson ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonForm)
      });
      
      if (res.ok) {
        toast.success(editingLesson ? 'Lesson updated' : 'Lesson created');
        setShowLessonModal(false);
        fetchCourseData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save lesson');
      }
    } catch (error) {
      console.error('Save lesson error:', error);
      toast.error('Network error');
    }
  };

  const toggleLessonStatus = async (lessonId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/lessons/${lessonId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Lesson status updated');
        fetchCourseData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Network error');
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Lesson deleted');
        fetchCourseData();
      } else {
        toast.error('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Delete lesson error:', error);
      toast.error('Network error');
    }
  };

  const moveLesson = async (lessonId, direction) => {
    const currentIndex = lessons.findIndex(l => l._id === lessonId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= lessons.length) return;
    
    const reorderedLessons = [...lessons];
    const [moved] = reorderedLessons.splice(currentIndex, 1);
    reorderedLessons.splice(newIndex, 0, moved);
    
    const updatedLessons = reorderedLessons.map((lesson, index) => ({
      _id: lesson._id,
      lessonOrder: index + 1
    }));
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}/lessons/reorder`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lessons: updatedLessons })
      });
      
      if (res.ok) {
        toast.success('Lessons reordered');
        fetchCourseData();
      } else {
        toast.error('Failed to reorder');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Network error');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading course...</div>;
  }

  if (!course) {
    return <div className="admin-error">Course not found</div>;
  }

  return (
    <div className="admin-course-view">
      <div className="admin-course-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="header-actions">
          <div className="header-title-section">
            <h1>📚 Course Management</h1>
            <p className="header-subtitle">Manage course details, lessons, and quizzes</p>
          </div>
          <button 
            onClick={() => navigate(`/admin/courses/${courseId}/analytics`)} 
            className="analytics-btn"
          >
            📊 View Analytics
          </button>
        </div>
      </div>

      {/* Course Details */}
      <div className="course-details-card">
        <div className="course-details-header">
          <div className="course-title-wrapper">
            <div className="course-icon">{course.title.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{course.title}</h2>
              <p className="course-category-label">📂 {course.category}</p>
            </div>
          </div>
          <span className={`status-badge ${course.isActive ? 'active' : 'inactive'}`}>
            {course.isActive ? '✓ Active' : '⊘ Inactive'}
          </span>
        </div>
        <p className="course-description">{course.description}</p>
        <div className="course-meta-grid">
          <div className="meta-card">
            <div className="meta-icon">📚</div>
            <div className="meta-content">
              <div className="meta-label">Level</div>
              <div className="meta-value">{course.level}</div>
            </div>
          </div>
          <div className="meta-card">
            <div className="meta-icon">⏱️</div>
            <div className="meta-content">
              <div className="meta-label">Duration</div>
              <div className="meta-value">{course.duration} hrs</div>
            </div>
          </div>
          <div className="meta-card">
            <div className="meta-icon">👥</div>
            <div className="meta-content">
              <div className="meta-label">Enrollments</div>
              <div className="meta-value">{course.enrollmentCount || 0}</div>
            </div>
          </div>
          <div className="meta-card">
            <div className="meta-icon">⭐</div>
            <div className="meta-content">
              <div className="meta-label">Rating</div>
              <div className="meta-value">{course.averageRating?.toFixed(1) || 'N/A'}</div>
            </div>
          </div>
          <div className="meta-card">
            <div className="meta-icon">🎯</div>
            <div className="meta-content">
              <div className="meta-label">Skill Category</div>
              <div className="meta-value">{course.skillCategory}</div>
            </div>
          </div>
        </div>
        {course.targetJobRoles && course.targetJobRoles.length > 0 && (
          <div className="course-job-roles">
            <strong>Target Job Roles:</strong>
            <div className="job-roles-list">
              {course.targetJobRoles.map((role, idx) => (
                <span key={idx} className="job-role-badge">{role}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course Quizzes */}
      <div className="course-quizzes-section">
        <div className="quizzes-header">
          <h2>Course Quizzes ({quizzes.length})</h2>
        </div>

        {loadingQuizzes ? (
          <div className="loading-quizzes">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes created yet. Add quizzes to lessons to track student performance!</p>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map((quiz, index) => (
              <div key={quiz._id} className="quiz-card">
                <div className="quiz-card-header">
                  <div className="quiz-number">Quiz #{index + 1}</div>
                  <span className={`quiz-status ${quiz.isActive ? 'active' : 'inactive'}`}>
                    {quiz.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="quiz-card-content">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <p className="quiz-lesson">📚 Lesson: {quiz.lessonId?.title || 'N/A'}</p>
                  {quiz.attemptCount > 0 && (
                    <p className="quiz-attempts-count">
                      👥 {quiz.attemptCount} student{quiz.attemptCount !== 1 ? 's' : ''} attempted
                    </p>
                  )}
                  <div className="quiz-meta-grid">
                    <div className="quiz-meta-item">
                      <span className="meta-label">Questions</span>
                      <span className="meta-value">{quiz.questions?.length || 0}</span>
                    </div>
                    <div className="quiz-meta-item">
                      <span className="meta-label">Duration</span>
                      <span className="meta-value">{quiz.duration || 10} min</span>
                    </div>
                    <div className="quiz-meta-item">
                      <span className="meta-label">Passing Score</span>
                      <span className="meta-value">{quiz.passingScore || 70}%</span>
                    </div>
                    <div className="quiz-meta-item">
                      <span className="meta-label">Max Attempts</span>
                      <span className="meta-value">{quiz.maxAttempts || 'Unlimited'}</span>
                    </div>
                  </div>
                </div>
                <div className="quiz-card-actions">
                  <button
                    onClick={() => window.open(`/admin/quiz/edit/${quiz._id}`, '_blank')}
                    className="edit-quiz-btn"
                    title="Edit Quiz"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => navigate(`/admin/quiz/${quiz._id}/attempts`)}
                    className="view-attempts-btn"
                    title="View Student Attempts"
                  >
                    👥 Attempts
                  </button>
                  <button
                    onClick={() => navigate(`/admin/quiz/${quiz._id}/stats`)}
                    className="view-stats-btn"
                    title="View Statistics"
                  >
                    📊 Stats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lessons Management */}
      <div className="lessons-section">
        <div className="lessons-header">
          <div>
            <h2>🎬 Manage Lessons ({lessons.length})</h2>
            <p className="section-subtitle">Organize and edit course lessons</p>
          </div>
          <button onClick={openAddLessonModal} className="add-lesson-btn">
            ✨ + Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="no-lessons">
            <div className="empty-state-icon">📚</div>
            <h3>No lessons yet</h3>
            <p>Add your first lesson to get started!</p>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div key={lesson._id} className={`lesson-card ${!lesson.isActive ? 'inactive' : ''}`}>
                <div className="lesson-order">#{lesson.lessonOrder}</div>
                <div className="lesson-content">
                  <div className="lesson-header-row">
                    <h3>{lesson.title}</h3>
                    {lesson.hasQuiz && <span className="quiz-badge">📝 Quiz Available</span>}
                  </div>
                  {lesson.description && <p className="lesson-desc">{lesson.description}</p>}
                  <div className="lesson-meta">
                    <span className="lesson-duration">⏱️ {lesson.duration} mins</span>
                    <span className={`lesson-level ${lesson.difficultyLevel}`}>
                      {lesson.difficultyLevel}
                    </span>
                    {lesson.videoUrl && <span className="lesson-type">📹 Video</span>}
                    {lesson.textContent && <span className="lesson-type">📄 Text</span>}
                    {lesson.hasQuiz && <span className="lesson-type quiz-indicator">📝 Has Quiz</span>}
                    <span className={`lesson-status ${lesson.isActive ? 'active' : 'inactive'}`}>
                      {lesson.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="lesson-actions">
                  <button onClick={() => moveLesson(lesson._id, 'up')} disabled={index === 0} title="Move Up">
                    ↑
                  </button>
                  <button onClick={() => moveLesson(lesson._id, 'down')} disabled={index === lessons.length - 1} title="Move Down">
                    ↓
                  </button>
                  <button 
                    onClick={() => window.open(`/admin/quiz/${lesson.hasQuiz ? 'edit/' + lesson.microQuizId : 'create/' + lesson._id}`, '_blank')}
                    className="quiz-btn"
                    title={lesson.hasQuiz ? 'Edit Quiz' : 'Create Quiz'}
                  >
                    {lesson.hasQuiz ? '📝 Edit Quiz' : '➕ Add Quiz'}
                  </button>
                  <button onClick={() => openEditLessonModal(lesson)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => toggleLessonStatus(lesson._id)} className="toggle-btn">
                    {lesson.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteLesson(lesson._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="modal-overlay">
          <div className="lesson-modal">
            <div className="modal-header">
              <h3>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <button onClick={() => setShowLessonModal(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleLessonSubmit} className="lesson-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Video URL</label>
                  <input
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Text Content</label>
                <textarea
                  value={lessonForm.textContent}
                  onChange={(e) => setLessonForm({...lessonForm, textContent: e.target.value})}
                  rows={5}
                  placeholder="Article or lesson content..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty Level *</label>
                  <select
                    value={lessonForm.difficultyLevel}
                    onChange={(e) => setLessonForm({...lessonForm, difficultyLevel: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lesson Order *</label>
                  <input
                    type="number"
                    value={lessonForm.lessonOrder}
                    onChange={(e) => setLessonForm({...lessonForm, lessonOrder: e.target.value})}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={lessonForm.isActive}
                    onChange={(e) => setLessonForm({...lessonForm, isActive: e.target.checked})}
                  />
                  <span>Active (visible to students)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowLessonModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseView;
