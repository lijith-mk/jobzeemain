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
  const [loading, setLoading] = useState(true);
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
        <h1>Course Management</h1>
      </div>

      {/* Course Details */}
      <div className="course-details-card">
        <div className="course-details-header">
          <h2>{course.title}</h2>
          <span className={`status-badge ${course.isActive ? 'active' : 'inactive'}`}>
            {course.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="course-description">{course.description}</p>
        <div className="course-meta">
          <span><strong>Category:</strong> {course.category}</span>
          <span><strong>Level:</strong> {course.level}</span>
          <span><strong>Skill Category:</strong> {course.skillCategory}</span>
          <span><strong>Duration:</strong> {course.duration} hours</span>
          <span><strong>Enrollments:</strong> {course.enrollmentCount || 0}</span>
          <span><strong>Rating:</strong> ⭐ {course.averageRating?.toFixed(1) || 'N/A'}</span>
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

      {/* Lessons Management */}
      <div className="lessons-section">
        <div className="lessons-header">
          <h2>Manage Lessons ({lessons.length})</h2>
          <button onClick={openAddLessonModal} className="add-lesson-btn">
            + Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="no-lessons">
            <p>No lessons yet. Add your first lesson to get started!</p>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div key={lesson._id} className={`lesson-card ${!lesson.isActive ? 'inactive' : ''}`}>
                <div className="lesson-order">#{lesson.lessonOrder}</div>
                <div className="lesson-content">
                  <h3>{lesson.title}</h3>
                  {lesson.description && <p className="lesson-desc">{lesson.description}</p>}
                  <div className="lesson-meta">
                    <span className="lesson-duration">⏱️ {lesson.duration} mins</span>
                    <span className={`lesson-level ${lesson.difficultyLevel}`}>
                      {lesson.difficultyLevel}
                    </span>
                    {lesson.videoUrl && <span className="lesson-type">📹 Video</span>}
                    {lesson.textContent && <span className="lesson-type">📄 Text</span>}
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
