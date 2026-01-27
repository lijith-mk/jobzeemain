import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './LearningHub.css';

const LearningHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: ''
  });

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchCourses();
      fetchRecommendedCourses();
    } else if (activeTab === 'my-learning') {
      fetchMyCourses();
    } else if (activeTab === 'paths') {
      fetchLearningPaths();
    }
  }, [activeTab, filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/courses?${params}`);
      setCourses(data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/my-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyCourses(data.progress);
    } catch (error) {
      console.error('Error fetching my courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningPaths = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths`);
      setLearningPaths(data.paths);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      toast.error('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/recommended`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendedCourses(data.courses);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/api/learning/courses/enroll`, 
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Successfully enrolled in course!');
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    }
  };

  const handleEnrollPath = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths/enroll`, 
        { pathId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Successfully enrolled in learning path!');
      setActiveTab('my-learning');
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in learning path');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'enrolled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="learning-hub-container">
      <div className="learning-hub-header">
        <h1>Learning Hub</h1>
        <p>Enhance your skills with our curated courses and learning paths</p>
      </div>

      {/* Tabs */}
      <div className="learning-tabs">
        <button 
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-learning')}
        >
          My Learning
        </button>
        <button 
          className={`tab-btn ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          Learning Paths
        </button>
      </div>

      {/* Browse Courses Tab */}
      {activeTab === 'browse' && (
        <div className="browse-section">
          {/* Filters */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="web-development">Web Development</option>
              <option value="data-science">Data Science</option>
              <option value="mobile-development">Mobile Development</option>
              <option value="cloud-computing">Cloud Computing</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="soft-skills">Soft Skills</option>
            </select>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Recommended Courses */}
          {recommendedCourses.length > 0 && (
            <div className="recommended-section">
              <h2>Recommended For You</h2>
              <div className="courses-grid">
                {recommendedCourses.map((course) => (
                  <div key={course._id} className="course-card">
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📚</div>
                      )}
                      <span className="level-badge" style={{ backgroundColor: getLevelBadgeColor(course.level) }}>
                        {course.level}
                      </span>
                    </div>
                    <div className="course-content">
                      <h3>{course.title}</h3>
                      <p className="course-description">{course.description}</p>
                      <div className="course-meta">
                        <span>⏱️ {course.duration} hours</span>
                        <span>⭐ {course.averageRating?.toFixed(1) || 'New'}</span>
                      </div>
                      <div className="course-skills">
                        {course.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                      <button 
                        className="enroll-btn"
                        onClick={() => handleEnrollCourse(course._id)}
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Courses */}
          <div className="all-courses-section">
            <h2>All Courses</h2>
            {loading ? (
              <div className="loading">Loading courses...</div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-card" onClick={() => navigate(`/course/${course._id}`)} style={{ cursor: 'pointer' }}>
                    <div className="course-thumbnail">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} />
                      ) : (
                        <div className="placeholder-thumbnail">📚</div>
                      )}
                      <span className="level-badge" style={{ backgroundColor: getLevelBadgeColor(course.level) }}>
                        {course.level}
                      </span>
                    </div>
                    <div className="course-content">
                      <h3>{course.title}</h3>
                      <p className="course-description">{course.description}</p>
                      <div className="course-meta">
                        <span>⏱️ {course.duration} hours</span>
                        <span>⭐ {course.averageRating?.toFixed(1) || 'New'}</span>
                        <span>👥 {course.enrollmentCount || 0} enrolled</span>
                      </div>
                      <div className="course-skills">
                        {course.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                      <button 
                        className="enroll-btn"
                        onClick={(e) => { e.stopPropagation(); handleEnrollCourse(course._id); }}
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Learning Tab */}
      {activeTab === 'my-learning' && (
        <div className="my-learning-section">
          <h2>My Enrolled Courses</h2>
          {loading ? (
            <div className="loading">Loading your courses...</div>
          ) : myCourses.length === 0 ? (
            <div className="empty-state">
              <p>You haven't enrolled in any courses yet.</p>
              <button onClick={() => setActiveTab('browse')} className="browse-btn">
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="courses-grid">
              {myCourses.map((progress) => (
                <div key={progress._id} className="course-card my-course-card">
                  <div className="course-thumbnail">
                    {progress.courseId?.thumbnail ? (
                      <img src={progress.courseId.thumbnail} alt={progress.courseId.title} />
                    ) : (
                      <div className="placeholder-thumbnail">📚</div>
                    )}
                    <div className="progress-overlay">
                      <div className="progress-circle">
                        <span>{progress.progressPercentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="course-content">
                    <h3>{progress.courseId?.title}</h3>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress.progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="course-meta">
                      <span style={{ color: getStatusColor(progress.status) }}>
                        {progress.status === 'in-progress' ? 'In Progress' : 
                         progress.status === 'completed' ? 'Completed' : 'Enrolled'}
                      </span>
                      <span>⏱️ {progress.timeSpent || 0} mins</span>
                    </div>
                    <button 
                      className="continue-btn"
                      onClick={() => navigate(`/course/${progress.courseId._id}`)}
                    >
                      {progress.status === 'completed' ? 'Review' : 'Continue Learning'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Learning Paths Tab */}
      {activeTab === 'paths' && (
        <div className="paths-section">
          <h2>Learning Paths</h2>
          <p className="section-description">
            Follow structured paths designed for specific career roles
          </p>
          {loading ? (
            <div className="loading">Loading learning paths...</div>
          ) : (
            <div className="paths-grid">
              {learningPaths.map((path) => (
                <div key={path._id} className="path-card">
                  <div className="path-header">
                    <h3>{path.title}</h3>
                    <span className="level-badge" style={{ backgroundColor: getLevelBadgeColor(path.level) }}>
                      {path.level}
                    </span>
                  </div>
                  <p className="path-description">{path.description}</p>
                  <div className="path-meta">
                    <span>🎯 {path.targetRole}</span>
                    <span>📚 {path.courses.length} courses</span>
                    <span>⏱️ ~{path.estimatedDuration} hours</span>
                  </div>
                  <div className="path-skills">
                    <strong>Skills you'll learn:</strong>
                    <div className="skills-list">
                      {path.skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="enroll-btn"
                    onClick={() => handleEnrollPath(path._id)}
                  >
                    Start Learning Path
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningHub;
