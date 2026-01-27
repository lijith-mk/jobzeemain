import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './LessonViewer.css';

const LessonViewer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    fetchLessonData();
    setStartTime(Date.now());
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
      // Save time spent when leaving
      if (lesson) {
        updateProgress(false);
      }
    };
  }, [lessonId]);

  const fetchLessonData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view lessons');
        navigate('/login');
        return;
      }

      // Fetch lesson details
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLesson(data.lesson);
      setIsCompleted(data.isCompleted);

      // Fetch all lessons for navigation
      const courseResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/${data.lesson.courseId._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCourse(courseResponse.data.course);
      setAllLessons(courseResponse.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      if (error.response?.status === 403) {
        toast.error('Please enroll in this course first');
        navigate(`/course/${error.response.data.courseId}`);
      } else {
        toast.error('Failed to load lesson');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (markComplete = false) => {
    try {
      const token = localStorage.getItem('token');
      const minutesSpent = Math.floor((Date.now() - startTime) / 60000);
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/progress`,
        {
          courseId: lesson.courseId._id || lesson.courseId,
          lessonId: lesson._id,
          timeSpent: minutesSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (markComplete) {
        setIsCompleted(true);
        toast.success('Lesson marked as complete!');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      if (markComplete) {
        toast.error('Failed to mark lesson as complete');
      }
    }
  };

  const handleMarkComplete = async () => {
    await updateProgress(true);
    
    // Auto-navigate to next lesson
    const currentIndex = allLessons.findIndex(l => l._id === lessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      setTimeout(() => {
        navigate(`/lesson/${nextLesson._id}`);
      }, 1500);
    }
  };

  const navigateToLesson = (targetLessonId) => {
    navigate(`/lesson/${targetLessonId}`);
  };

  const goToNextLesson = () => {
    const currentIndex = allLessons.findIndex(l => l._id === lessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      navigateToLesson(allLessons[currentIndex + 1]._id);
    }
  };

  const goToPreviousLesson = () => {
    const currentIndex = allLessons.findIndex(l => l._id === lessonId);
    if (currentIndex > 0) {
      navigateToLesson(allLessons[currentIndex - 1]._id);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatVideoUrl = (url) => {
    if (!url) return null;
    
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert YouTube short URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="lesson-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="lesson-viewer-error">
        <h2>Lesson not found</h2>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go Back
        </button>
      </div>
    );
  }

  const currentIndex = allLessons.findIndex(l => l._id === lessonId);
  const embedVideoUrl = formatVideoUrl(lesson.videoUrl);

  return (
    <div className="lesson-viewer-container">
      {/* Header */}
      <div className="lesson-viewer-header">
        <button onClick={() => navigate(`/course/${lesson.courseId._id || lesson.courseId}`)} className="back-to-course">
          ← Back to Course
        </button>
        <div className="lesson-header-info">
          <h1 className="lesson-title">{lesson.title}</h1>
          <div className="lesson-meta">
            <span className="course-name">
              📚 {course?.title || lesson.courseId?.title || 'Course'}
            </span>
            <span className="lesson-number">
              Lesson {currentIndex + 1} of {allLessons.length}
            </span>
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(lesson.difficultyLevel) }}
            >
              {lesson.difficultyLevel}
            </span>
            <span className="duration-badge">⏱️ {lesson.duration} mins</span>
          </div>
        </div>
        {isCompleted && (
          <span className="completed-badge">✓ Completed</span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="lesson-viewer-content">
        {/* Video Section */}
        {embedVideoUrl && (
          <div className="video-section">
            <div className="video-container">
              <iframe
                src={embedVideoUrl}
                title={lesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Lesson Description */}
        {lesson.description && (
          <div className="lesson-description-section">
            <h2>About this lesson</h2>
            <p>{lesson.description}</p>
          </div>
        )}

        {/* Text Content / Notes */}
        {lesson.textContent && (
          <div className="lesson-notes-section">
            <h2>📝 Lesson Notes</h2>
            <div 
              className="lesson-text-content"
              dangerouslySetInnerHTML={{ __html: lesson.textContent }}
            />
          </div>
        )}

        {/* Resources Section */}
        {lesson.resources && lesson.resources.length > 0 && (
          <div className="lesson-resources-section">
            <h2>📎 Resources</h2>
            <div className="resources-list">
              {lesson.resources.map((resource, idx) => (
                <a 
                  key={idx} 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="resource-item"
                >
                  <span className="resource-icon">
                    {resource.type === 'pdf' && '📄'}
                    {resource.type === 'link' && '🔗'}
                    {resource.type === 'video' && '📹'}
                    {resource.type === 'code' && '💻'}
                    {!['pdf', 'link', 'video', 'code'].includes(resource.type) && '📎'}
                  </span>
                  <span className="resource-title">{resource.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="lesson-actions">
          {!isCompleted && (
            <button onClick={handleMarkComplete} className="btn-complete">
              ✓ Mark as Complete
            </button>
          )}
          
          <div className="navigation-buttons">
            <button 
              onClick={goToPreviousLesson}
              disabled={currentIndex === 0}
              className="btn-nav btn-previous"
            >
              ← Previous Lesson
            </button>
            <button 
              onClick={goToNextLesson}
              disabled={currentIndex === allLessons.length - 1}
              className="btn-nav btn-next"
            >
              Next Lesson →
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      <div className="lesson-sidebar">
        <div className="sidebar-header">
          <h3>Course Lessons</h3>
          <p>{allLessons.filter(l => l.isCompleted).length} / {allLessons.length} completed</p>
        </div>
        
        <div className="lessons-navigation">
          {allLessons.map((l, index) => (
            <div
              key={l._id}
              className={`lesson-nav-item ${l._id === lessonId ? 'active' : ''} ${l.isCompleted ? 'completed' : ''}`}
              onClick={() => navigateToLesson(l._id)}
            >
              <div className="lesson-nav-number">
                {l.isCompleted ? '✓' : index + 1}
              </div>
              <div className="lesson-nav-info">
                <h4>{l.title}</h4>
                <span className="lesson-nav-duration">⏱️ {l.duration} mins</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
