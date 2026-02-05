import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CourseView.css';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [certificateEligibility, setCertificateEligibility] = useState(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (isEnrolled && progress) {
      checkCertificateEligibility();
    }
  }, [isEnrolled, progress?.status, progress?.progressPercentage]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/${courseId}`,
        { headers }
      );
      
      setCourse(data.course);
      setLessons(data.lessons || []);
      setProgress(data.progress);
      setIsEnrolled(!!data.progress);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
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
      fetchCourseData();
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleLessonClick = async (lesson) => {
    if (!isEnrolled) {
      toast.warning('Please enroll in the course first');
      return;
    }
    // Navigate to lesson viewer page
    navigate(`/lesson/${lesson._id}`);
  };

  const checkCertificateEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('=== Certificate Eligibility Check ===');
      console.log('Course ID:', courseId);
      console.log('Is Enrolled:', isEnrolled);
      console.log('Progress:', progress);

      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/certificates/eligibility/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('=== Certificate Response ===');
      console.log('Data:', data);
      console.log('Eligible:', data.eligible);
      console.log('Message:', data.message);
      console.log('Has Certificate:', data.hasCertificate);
      
      setCertificateEligibility(data);
      setHasCertificate(data.hasCertificate || false);
    } catch (error) {
      console.error('Error checking certificate eligibility:', error);
      console.error('Error response:', error.response?.data);
      setCertificateEligibility({
        eligible: false,
        message: 'Unable to check certificate eligibility',
        details: {}
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGeneratingCertificate(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/certificates/generate`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('🎉 Certificate generated successfully!');
      setHasCertificate(true);
      setCertificateEligibility({ ...certificateEligibility, hasCertificate: true });
      
      setTimeout(() => {
        navigate(`/certificates/${data.certificate.certificateId}`);
      }, 1500);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'beginner': return 'level-beginner';
      case 'intermediate': return 'level-intermediate';
      case 'advanced': return 'level-advanced';
      default: return '';
    }
  };

  const getDifficultyBadgeClass = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'difficulty-beginner';
      case 'intermediate': return 'difficulty-intermediate';
      case 'advanced': return 'difficulty-advanced';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="course-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-view-error">
        <h2>Course not found</h2>
        <button onClick={() => navigate('/learning-hub')} className="btn-back">
          Back to Learning Hub
        </button>
      </div>
    );
  }

  return (
    <div className="course-view-container">
      {/* Course Header */}
      <div className="course-header">
        <button onClick={() => navigate('/learning-hub')} className="back-button">
          ← Back to Courses
        </button>
        
        <div className="course-header-content">
          <div className="course-header-info">
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description">{course.description}</p>
            
            <div className="course-meta">
              <span className={`level-badge ${getLevelBadgeClass(course.level)}`}>
                {course.level}
              </span>
              <span className="category-badge">{course.category}</span>
              <span className="skill-badge">{course.skillCategory}</span>
              <span className="duration">⏱️ {course.duration} hours</span>
              {course.averageRating > 0 && (
                <span className="rating">⭐ {course.averageRating.toFixed(1)}</span>
              )}
              <span className="enrollments">👥 {course.enrollmentCount || 0} enrolled</span>
            </div>

            {course.targetJobRoles && course.targetJobRoles.length > 0 && (
              <div className="job-roles">
                <strong>Prepares you for:</strong>
                <div className="job-roles-list">
                  {course.targetJobRoles.map((role, idx) => (
                    <span key={idx} className="job-role-tag">{role}</span>
                  ))}
                </div>
              </div>
            )}

            {course.skills && course.skills.length > 0 && (
              <div className="course-skills">
                <strong>Skills you'll learn:</strong>
                <div className="skills-list">
                  {course.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {course.thumbnail && (
            <div className="course-thumbnail">
              <img src={course.thumbnail} alt={course.title} />
            </div>
          )}
        </div>

        {!isEnrolled ? (
          <button onClick={handleEnroll} className="btn-enroll">
            Enroll in Course
          </button>
        ) : (
          <div className="enrollment-status">
            <div className="progress-bar-container">
              <div className="progress-info">
                <span>Progress: {progress?.progressPercentage || 0}%</span>
                <span>{progress?.completedLessons?.length || 0} / {lessons.length} lessons</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress?.progressPercentage || 0}%` }}
                ></div>
              </div>
            </div>
            <span className={`status-badge status-${progress?.status}`}>
              {progress?.status}
            </span>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="course-content">
        {/* Lessons List */}
        <div className="lessons-section">
          <div className="lessons-header">
            <h2>Course Lessons ({lessons.length})</h2>
            <p>Micro-learning modules designed for busy professionals</p>
          </div>

          {lessons.length === 0 ? (
            <div className="no-lessons">
              <p>No lessons available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson, index) => (
                <div 
                  key={lesson._id} 
                  className={`lesson-card ${lesson.isCompleted ? 'completed' : ''} ${!isEnrolled ? 'locked' : ''}`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="lesson-number">
                    {lesson.isCompleted ? '✓' : index + 1}
                  </div>
                  
                  <div className="lesson-info">
                    <h3 className="lesson-title">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="lesson-description">{lesson.description}</p>
                    )}
                    
                    <div className="lesson-meta">
                      <span className="lesson-duration">
                        ⏱️ {lesson.duration} mins
                      </span>
                      <span className={`lesson-difficulty ${getDifficultyBadgeClass(lesson.difficultyLevel)}`}>
                        {lesson.difficultyLevel}
                      </span>
                      {lesson.videoUrl && (
                        <span className="lesson-type">📹 Video</span>
                      )}
                      {lesson.textContent && (
                        <span className="lesson-type">📄 Article</span>
                      )}
                      {lesson.hasQuiz && (
                        <span className="lesson-type quiz-badge">📝 Quiz</span>
                      )}
                    </div>
                  </div>

                  <div className="lesson-status">
                    {!isEnrolled ? (
                      <span className="status-locked">🔒 Enroll to access</span>
                    ) : lesson.isCompleted ? (
                      <span className="status-completed">✓ Completed</span>
                    ) : (
                      <span className="status-start">Start →</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructor Info */}
        {course.instructor && course.instructor.name && (
          <div className="instructor-section">
            <h3>Instructor</h3>
            <div className="instructor-card">
              {course.instructor.photo && (
                <img 
                  src={course.instructor.photo} 
                  alt={course.instructor.name} 
                  className="instructor-photo"
                />
              )}
              <div className="instructor-info">
                <h4>{course.instructor.name}</h4>
                {course.instructor.bio && <p>{course.instructor.bio}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Certificate Section */}
        {isEnrolled && (
          <div className="certificate-section">
            <h3>🎓 Certificate</h3>
            {checkingEligibility ? (
              <div className="cert-loading">
                <p>⏳ Checking eligibility...</p>
              </div>
            ) : !certificateEligibility ? (
              <div className="cert-loading">
                <p>📋 Loading certificate status...</p>
                <button 
                  className="btn-check-eligibility"
                  onClick={checkCertificateEligibility}
                  disabled={checkingEligibility}
                >
                  Check Eligibility
                </button>
              </div>
            ) : hasCertificate ? (
              <div className="cert-earned">
                <p className="cert-icon">✅</p>
                <p><strong>Certificate Earned!</strong></p>
                <button 
                  className="btn-view-certificate"
                  onClick={() => navigate('/certificates')}
                >
                  View Certificate
                </button>
              </div>
            ) : certificateEligibility.eligible ? (
              <div className="cert-eligible">
                <p className="cert-icon">🎉</p>
                <p><strong>You're eligible for a certificate!</strong></p>
                <p>Grade: {certificateEligibility.details?.grade || 'N/A'}</p>
                {certificateEligibility.details?.honors && (
                  <p className="honors">🏆 With Honors!</p>
                )}
                <button 
                  className="btn-generate-cert"
                  onClick={handleGenerateCertificate}
                  disabled={generatingCertificate}
                >
                  {generatingCertificate ? 'Generating...' : 'Generate Certificate'}
                </button>
              </div>
            ) : (
              <div className="cert-not-eligible">
                <p className="cert-icon">📋</p>
                <p>{certificateEligibility.message}</p>
                {certificateEligibility.details && (
                  <ul className="cert-requirements">
                    {certificateEligibility.details.totalLessons && (
                      <li>
                        Lessons: {certificateEligibility.details.completedLessons || 0}/
                        {certificateEligibility.details.totalLessons}
                      </li>
                    )}
                    {certificateEligibility.details.totalMandatoryQuizzes > 0 && (
                      <li>
                        Quizzes: {certificateEligibility.details.passedMandatoryQuizzes || 0}/
                        {certificateEligibility.details.totalMandatoryQuizzes}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <div className="prerequisites-section">
            <h3>Prerequisites</h3>
            <ul className="prerequisites-list">
              {course.prerequisites.map((prereq, idx) => (
                <li key={idx}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseView;
