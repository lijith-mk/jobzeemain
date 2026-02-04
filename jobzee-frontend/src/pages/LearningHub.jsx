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
  const [myLearningPaths, setMyLearningPaths] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [recommendedPaths, setRecommendedPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPathProgress, setSelectedPathProgress] = useState(null);
  
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
      fetchMyLearningPaths();
    } else if (activeTab === 'paths') {
      fetchLearningPaths();
      fetchRecommendedPaths();
    }
  }, [activeTab, filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/courses?${params}`, { headers });
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
      const token = localStorage.getItem('token');
      // Fetch paths based on user's job role
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths/by-job-role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLearningPaths(data.paths);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      // Fallback to all paths if job role fetch fails
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths`);
        setLearningPaths(data.paths);
      } catch (err) {
        toast.error('Failed to load learning paths');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLearningPaths = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get all paths user is enrolled in
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths/by-job-role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only enrolled paths
      const enrolled = data.paths.filter(p => p.isEnrolled);
      setMyLearningPaths(enrolled);
    } catch (error) {
      console.error('Error fetching my learning paths:', error);
    }
  };

  const viewPathProgress = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learning/learning-paths/${pathId}/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedPathProgress(data);
    } catch (error) {
      console.error('Error fetching path progress:', error);
      toast.error('Failed to load learning path progress');
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

  const fetchRecommendedPaths = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendedPaths(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommended paths:', error);
    }
  };

  const handleEnrollCourse = async (courseId, isPaid) => {
    try {
      const token = localStorage.getItem('token');
      
      // If course is paid, initiate payment flow
      if (isPaid) {
        await handleCoursePayment(courseId);
        return;
      }
      
      // Free course - direct enrollment
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

  const handleCoursePayment = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create payment order
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/learning/courses/create-payment-order`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // Configure Razorpay options
      const options = {
        key: data.razorpayKey,
        amount: data.amount * 100,
        currency: data.currency,
        name: 'Jobzee Learning',
        description: data.courseName,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/learning/courses/verify-payment`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                courseId
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const { invoice } = verifyResponse.data;
            toast.success(`Payment successful! Invoice ${invoice?.invoiceNumber} generated.`);
            navigate(`/course/${courseId}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || ''
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleEnrollPath = async (pathId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/learning/learning-paths/enroll`, 
        { pathId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully enrolled! Your first course is unlocked.`);
      // Show the path progress
      await viewPathProgress(pathId);
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
      {/* Learning Stats Dashboard - Only show in My Learning tab */}
      {activeTab === 'my-learning' && (myCourses.length > 0 || myLearningPaths.length > 0) && (
        <div className="learning-stats-dashboard">
          <h2>Your Learning Journey</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-number">{myCourses.length}</span>
                <span className="stat-label">Courses Enrolled</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <span className="stat-number">
                  {myCourses.filter(c => c.status === 'completed').length}
                </span>
                <span className="stat-label">Courses Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <span className="stat-number">{myLearningPaths.length}</span>
                <span className="stat-label">Learning Paths</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-number">
                  {myCourses.reduce((total, course) => total + (course.timeSpent || 0), 0)}
                </span>
                <span className="stat-label">Minutes Learned</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-number">
                  {myCourses.length > 0 
                    ? Math.round(myCourses.reduce((sum, c) => sum + c.progressPercentage, 0) / myCourses.length)
                    : 0}%
                </span>
                <span className="stat-label">Average Progress</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <span className="stat-number">
                  {myCourses.filter(c => c.status === 'in-progress').length}
                </span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      {course.isEnrolled ? (
                        <button 
                          className="enrolled-btn"
                          onClick={() => navigate(`/course/${course._id}`)}
                          style={{ 
                            backgroundColor: '#10b981', 
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Enrolled - Continue Learning
                        </button>
                      ) : (
                        <>
                          {course.isPaid && (
                            <div className="course-price">
                              {course.discountPrice && new Date(course.discountEndDate) > new Date() ? (
                                <>
                                  <span className="original-price">₹{course.price}</span>
                                  <span className="discount-price">₹{course.discountPrice}</span>
                                </>
                              ) : (
                                <span className="price">₹{course.price}</span>
                              )}
                            </div>
                          )}
                          <button 
                            className="enroll-btn"
                            onClick={() => handleEnrollCourse(course._id, course.isPaid)}
                          >
                            {course.isPaid ? `Enroll Now - Pay ₹${course.discountPrice && new Date(course.discountEndDate) > new Date() ? course.discountPrice : course.price}` : 'Enroll Now - Free'}
                          </button>
                        </>
                      )}
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
                      {course.isEnrolled ? (
                        <button 
                          className="enrolled-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/course/${course._id}`); }}
                          style={{ 
                            backgroundColor: '#10b981', 
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Enrolled - Continue Learning
                        </button>
                      ) : (
                        <>
                          {course.isPaid && (
                            <div className="course-price">
                              {course.discountPrice && new Date(course.discountEndDate) > new Date() ? (
                                <>
                                  <span className="original-price">₹{course.price}</span>
                                  <span className="discount-price">₹{course.discountPrice}</span>
                                </>
                              ) : (
                                <span className="price">₹{course.price}</span>
                              )}
                            </div>
                          )}
                          <button 
                            className="enroll-btn"
                            onClick={(e) => { e.stopPropagation(); handleEnrollCourse(course._id, course.isPaid); }}
                          >
                            {course.isPaid ? `Enroll Now - Pay ₹${course.discountPrice && new Date(course.discountEndDate) > new Date() ? course.discountPrice : course.price}` : 'Enroll Now - Free'}
                          </button>
                        </>
                      )}
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
                    <div className="progress-badge">
                      {progress.progressPercentage}%
                    </div>
                  </div>
                  <div className="course-content">
                    <div className="status-badge" style={{ background: getStatusColor(progress.status) }}>
                      {progress.status === 'in-progress' ? '🔥 Learning' : 
                       progress.status === 'completed' ? '✅ Completed' : '📖 Enrolled'}
                    </div>
                    <h3>{progress.courseId?.title}</h3>
                    
                    {/* Visual Progress Bar */}
                    <div className="progress-bar-enhanced">
                      <div 
                        className="progress-fill-animated" 
                        style={{ 
                          width: `${progress.progressPercentage}%`,
                          background: progress.status === 'completed' 
                            ? 'linear-gradient(90deg, #10b981, #059669)' 
                            : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                        }}
                      ></div>
                    </div>
                    
                    {/* Mini Stats */}
                    <div className="mini-stats">
                      <div className="mini-stat">
                        <span className="mini-stat-icon">📝</span>
                        <span className="mini-stat-text">
                          {progress.completedLessons?.length || 0} lessons
                        </span>
                      </div>
                      <div className="mini-stat">
                        <span className="mini-stat-icon">⏱️</span>
                        <span className="mini-stat-text">
                          {progress.timeSpent || 0} mins
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      className="continue-btn-enhanced"
                      onClick={() => navigate(`/course/${progress.courseId._id}`)}
                    >
                      {progress.status === 'completed' ? '🎉 Review Course' : '🚀 Continue Learning'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Learning Paths Section */}
          {myLearningPaths.length > 0 && (
            <div className="my-paths-section" style={{ marginTop: '40px' }}>
              <h2>My Learning Paths</h2>
              <div className="paths-grid">
                {myLearningPaths.map((path) => (
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
                    </div>
                    <button 
                      className="view-progress-btn"
                      onClick={() => viewPathProgress(path._id)}
                      style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        padding: '10px 20px', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      View Progress
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Path Progress Modal */}
          {selectedPathProgress && (
            <div 
              className="modal-overlay" 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setSelectedPathProgress(null)}
            >
              <div 
                className="modal-content"
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '30px',
                  maxWidth: '800px',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  width: '90%'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>{selectedPathProgress.progress.pathId.title}</h2>
                  <button 
                    onClick={() => setSelectedPathProgress(null)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '24px', 
                      cursor: 'pointer' 
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div className="progress-bar" style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${selectedPathProgress.progress.progressPercentage}%`,
                        height: '100%',
                        background: '#3b82f6',
                        borderRadius: '4px'
                      }}
                    ></div>
                  </div>
                  <p style={{ marginTop: '8px', color: '#6b7280' }}>
                    {selectedPathProgress.completedCount} of {selectedPathProgress.totalCourses} courses completed
                  </p>
                </div>

                <h3>Course Sequence</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                  {selectedPathProgress.courses.map((course, index) => (
                    <div 
                      key={course._id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        opacity: course.status === 'locked' ? 0.6 : 1,
                        background: course.status === 'completed' ? '#f0fdf4' : 
                                   course.status === 'unlocked' ? '#eff6ff' : '#f9fafb'
                      }}
                    >
                      <div style={{ fontSize: '24px' }}>
                        {course.status === 'completed' ? '✅' : 
                         course.status === 'unlocked' ? '🔓' : '🔒'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            background: '#e5e7eb', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </span>
                          <h4 style={{ margin: 0 }}>{course.courseId.title}</h4>
                        </div>
                        <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '14px' }}>
                          {course.courseId.duration} hours • {course.courseId.level}
                          {course.isRequired && <span style={{ marginLeft: '10px', color: '#ef4444' }}>* Required</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                          {course.status === 'completed' ? (
                            <span style={{ color: '#10b981' }}>Completed</span>
                          ) : course.status === 'unlocked' ? (
                            <span style={{ color: '#3b82f6' }}>Available Now</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Locked - Complete previous courses first</span>
                          )}
                        </p>
                      </div>
                      {course.status !== 'locked' && (
                        <button 
                          onClick={() => {
                            setSelectedPathProgress(null);
                            navigate(`/course/${course.courseId._id}`);
                          }}
                          style={{
                            background: course.status === 'completed' ? '#10b981' : '#3b82f6',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {course.status === 'completed' ? 'Review' : 'Start'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Paths Tab */}
      {activeTab === 'paths' && (
        <div className="paths-section">
          {/* Recommended Paths Section */}
          {recommendedPaths.length > 0 && (
            <div className="recommended-paths-section" style={{ marginBottom: '40px' }}>
              <h2>📌 Recommended for You</h2>
              <p className="section-description">
                Based on your job role, skills, and assessment results
              </p>
              <div className="paths-grid">
                {recommendedPaths.map((path) => (
                  <div key={path._id} className="path-card recommended-path">
                    <div className="recommendation-badge">
                      ⭐ Recommended
                    </div>
                    <div className="path-header">
                      <h3>{path.title}</h3>
                      <span className="level-badge" style={{ backgroundColor: getLevelBadgeColor(path.level) }}>
                        {path.level}
                      </span>
                    </div>
                    <p className="path-description">{path.description}</p>
                    
                    {/* Recommendation Reasons */}
                    {path.recommendationReasons && path.recommendationReasons.length > 0 && (
                      <div className="recommendation-reasons">
                        <strong>Why this path?</strong>
                        <ul>
                          {path.recommendationReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="path-meta">
                      <span>🎯 {path.targetRole || path.targetJobRole}</span>
                      <span>📚 {path.courses?.length || 0} courses</span>
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
                      onClick={() => path.isEnrolled ? viewPathProgress(path._id) : handleEnrollPath(path._id)}
                      style={path.isEnrolled ? { background: '#10b981' } : { background: '#f59e0b' }}
                    >
                      {path.isEnrolled ? 'View Progress' : '⭐ Start Recommended Path'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    onClick={() => path.isEnrolled ? viewPathProgress(path._id) : handleEnrollPath(path._id)}
                    style={path.isEnrolled ? { background: '#10b981' } : {}}
                  >
                    {path.isEnrolled ? 'View Progress' : 'Start Learning Path'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Learning Path Progress Modal */}
      {selectedPathProgress && (
        <div className="modal-overlay" onClick={() => setSelectedPathProgress(null)}>
          <div className="modal-content learning-path-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPathProgress.progress.pathId.title}</h2>
              <button className="close-btn" onClick={() => setSelectedPathProgress(null)}>×</button>
            </div>
            
            <div className="path-progress-summary">
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-value">{selectedPathProgress.completedCount}/{selectedPathProgress.totalCourses}</span>
                  <span className="stat-label">Courses Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedPathProgress.progress.progressPercentage}%</span>
                  <span className="stat-label">Overall Progress</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedPathProgress.unlockedCount}</span>
                  <span className="stat-label">Courses Unlocked</span>
                </div>
              </div>
              <div className="progress-bar-large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${selectedPathProgress.progress.progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="path-courses-list">
              <h3>Course Sequence</h3>
              {selectedPathProgress.courses.map((pathCourse, index) => (
                <div 
                  key={pathCourse._id} 
                  className={`path-course-item ${pathCourse.status}`}
                  onClick={() => pathCourse.isUnlocked ? navigate(`/course/${pathCourse.courseId._id}`) : null}
                  style={{ cursor: pathCourse.isUnlocked ? 'pointer' : 'not-allowed' }}
                >
                  <div className="course-order">{index + 1}</div>
                  <div className="course-info">
                    <div className="course-title-row">
                      <h4>{pathCourse.courseId.title}</h4>
                      <div className="course-badges">
                        {pathCourse.isRequired && <span className="badge required">Required</span>}
                        {pathCourse.status === 'completed' && <span className="badge completed">✓ Completed</span>}
                        {pathCourse.status === 'unlocked' && <span className="badge unlocked">🔓 Unlocked</span>}
                        {pathCourse.status === 'locked' && <span className="badge locked">🔒 Locked</span>}
                      </div>
                    </div>
                    <div className="course-meta-small">
                      <span>{pathCourse.courseId.level}</span>
                      <span>⏱️ {pathCourse.estimatedDuration || pathCourse.courseId.duration} hours</span>
                    </div>
                    {pathCourse.status === 'locked' && (
                      <div className="locked-message">
                        <span>⚠️ Complete the previous course to unlock this one</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
