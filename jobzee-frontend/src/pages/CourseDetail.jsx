import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/${courseId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      
      setCourse(data.course);
      setProgress(data.progress);
      setEnrolled(!!data.progress);
      
      if (data.progress) {
        setActiveModule(data.progress.currentModule || 0);
        setActiveLesson(data.progress.currentLesson || 0);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to enroll');
        navigate('/login');
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/enroll`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Successfully enrolled!');
      fetchCourseDetails();
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleLessonComplete = async (moduleIndex, lessonIndex) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/progress`,
        { courseId, moduleIndex, lessonIndex, timeSpent: 5 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProgress(data.progress);
      setActiveModule(moduleIndex);
      setActiveLesson(lessonIndex);
      
      if (data.progress.status === 'completed') {
        toast.success('🎉 Congratulations! Course completed!');
        setShowRatingModal(true);
      } else {
        toast.success('Lesson completed!');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleSubmitRating = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/rate`,
        { courseId, rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Thank you for your feedback!');
      setShowRatingModal(false);
      fetchCourseDetails();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const isLessonCompleted = (moduleIndex, lessonIndex) => {
    if (!progress) return false;
    return progress.completedLessons.some(
      l => l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'enrolled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-not-found">
        <h2>Course not found</h2>
        <button onClick={() => navigate('/learning-hub')}>Back to Learning Hub</button>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      {/* Course Header */}
      <div className="course-header">
        <button className="back-btn" onClick={() => navigate('/learning-hub')}>
          ← Back to Learning Hub
        </button>
        
        <div className="course-header-content">
          <div className="course-header-info">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
            
            <div className="course-meta-row">
              <span className="level-badge" style={{ backgroundColor: course.level === 'beginner' ? '#10b981' : course.level === 'intermediate' ? '#f59e0b' : '#ef4444' }}>
                {course.level}
              </span>
              <span>📚 {course.modules.length} modules</span>
              <span>⏱️ {course.duration} hours</span>
              <span>⭐ {course.averageRating?.toFixed(1) || 'New'}</span>
              <span>👥 {course.enrollmentCount || 0} enrolled</span>
            </div>

            <div className="course-skills">
              <strong>Skills you'll learn:</strong>
              <div className="skills-list">
                {course.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            {enrolled && progress && (
              <div className="progress-section">
                <div className="progress-info">
                  <span style={{ color: getStatusColor(progress.status) }}>
                    Status: {progress.status === 'in-progress' ? 'In Progress' : 
                            progress.status === 'completed' ? 'Completed' : 'Enrolled'}
                  </span>
                  <span>{progress.progressPercentage}% Complete</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {!enrolled && (
              <button className="enroll-btn-large" onClick={handleEnroll}>
                Enroll in This Course
              </button>
            )}
          </div>

          {course.thumbnail && (
            <div className="course-thumbnail-large">
              <img src={course.thumbnail} alt={course.title} />
            </div>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div className="course-content-section">
        <div className="course-modules">
          <h2>Course Content</h2>
          
          {course.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="module-card">
              <div className="module-header">
                <h3>Module {moduleIndex + 1}: {module.title}</h3>
                <span className="module-duration">⏱️ {module.duration} mins</span>
              </div>
              
              {module.description && (
                <p className="module-description">{module.description}</p>
              )}

              <div className="lessons-list">
                {module.lessons.map((lesson, lessonIndex) => {
                  const completed = isLessonCompleted(moduleIndex, lessonIndex);
                  const isCurrent = enrolled && activeModule === moduleIndex && activeLesson === lessonIndex;
                  
                  return (
                    <div 
                      key={lessonIndex} 
                      className={`lesson-item ${completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="lesson-info">
                        <div className="lesson-icon">
                          {completed ? '✓' : 
                           lesson.type === 'video' ? '▶️' : 
                           lesson.type === 'article' ? '📄' : 
                           lesson.type === 'quiz' ? '❓' : '📝'}
                        </div>
                        <div>
                          <h4>{lesson.title}</h4>
                          <span className="lesson-type">{lesson.type} • {lesson.duration} mins</span>
                        </div>
                      </div>
                      
                      {enrolled && !completed && (
                        <button 
                          className="complete-btn"
                          onClick={() => handleLessonComplete(moduleIndex, lessonIndex)}
                        >
                          {isCurrent ? 'Complete' : 'Start'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="course-sidebar">
          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="sidebar-card">
              <h3>Prerequisites</h3>
              <ul>
                {course.prerequisites.map((prereq, idx) => (
                  <li key={idx}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructor */}
          {course.instructor && (
            <div className="sidebar-card">
              <h3>Instructor</h3>
              <div className="instructor-info">
                {course.instructor.photo && (
                  <img src={course.instructor.photo} alt={course.instructor.name} className="instructor-photo" />
                )}
                <div>
                  <h4>{course.instructor.name}</h4>
                  <p>{course.instructor.title}</p>
                  {course.instructor.bio && <p className="instructor-bio">{course.instructor.bio}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Related Mentors */}
          {course.relatedMentors && course.relatedMentors.length > 0 && (
            <div className="sidebar-card">
              <h3>Get Expert Help</h3>
              <p>Connect with mentors specializing in these skills:</p>
              <div className="mentors-list">
                {course.relatedMentors.map((mentor) => (
                  <div key={mentor._id} className="mentor-item">
                    <img src={mentor.photo} alt={mentor.name} />
                    <div>
                      <h5>{mentor.name}</h5>
                      <p>{mentor.role}</p>
                    </div>
                    <button onClick={() => navigate(`/mentors/${mentor._id}`)}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Tests */}
          {course.relatedTests && course.relatedTests.length > 0 && (
            <div className="sidebar-card">
              <h3>Test Your Skills</h3>
              <div className="tests-list">
                {course.relatedTests.map((test) => (
                  <div key={test._id} className="test-item">
                    <h5>{test.title}</h5>
                    <p>{test.description}</p>
                    <button onClick={() => navigate(`/tests/${test._id}/take`)}>
                      Take Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay">
          <div className="rating-modal">
            <h2>Rate This Course</h2>
            <p>How was your experience?</p>
            
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Write your review (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowRatingModal(false)}>
                Skip
              </button>
              <button className="submit-btn" onClick={handleSubmitRating}>
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
