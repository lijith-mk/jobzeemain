import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminCourseAnalytics.css';

const AdminCourseAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchEnrollments();
    } else if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, enrollmentPage, paymentPage, enrollmentFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/learning/admin/courses/${courseId}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: enrollmentPage,
        limit: 20
      });
      
      if (enrollmentFilter !== 'all') {
        if (enrollmentFilter === 'paid') {
          params.append('isPaid', 'true');
        } else if (enrollmentFilter === 'free') {
          params.append('isPaid', 'false');
        } else {
          params.append('status', enrollmentFilter);
        }
      }

      const response = await axios.get(
        `http://localhost:5000/api/learning/admin/courses/${courseId}/enrollments?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/learning/admin/courses/${courseId}/payments?page=${paymentPage}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      if (error.response?.status === 400) {
        toast.info('This is a free course - no payment data');
      } else {
        toast.error('Failed to load payments');
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    const symbol = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency] || '₹';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-analytics-container">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-analytics-container">
        <div className="error-message">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-container">
      <div className="analytics-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="course-info">
          <img 
            src={analytics.course.thumbnail || '/default-course.png'} 
            alt={analytics.course.title}
            className="course-thumbnail"
          />
          <div>
            <h1>{analytics.course.title}</h1>
            {analytics.course.isPaid && (
              <span className="course-price">
                {formatCurrency(analytics.course.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'enrollments' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('enrollments')}
        >
          Enrollments
        </button>
        {analytics.course.isPaid && (
          <button 
            className={activeTab === 'payments' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-value">{analytics.overview.totalEnrollments}</div>
              <div className="metric-label">Total Enrollments</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🔥</div>
              <div className="metric-value">{analytics.overview.activeLearnersCount}</div>
              <div className="metric-label">Active Learners (7 days)</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">✅</div>
              <div className="metric-value">{analytics.overview.completionPercentage}%</div>
              <div className="metric-label">Completion Rate</div>
              <div className="metric-subtext">
                {analytics.overview.completedCount} completed
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">⏱️</div>
              <div className="metric-value">{formatTime(analytics.overview.averageTimeSpent)}</div>
              <div className="metric-label">Avg Time per User</div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="analytics-section">
            <h2>Status Distribution</h2>
            <div className="status-bars">
              {Object.entries(analytics.statusDistribution).map(([status, count]) => {
                const percentage = analytics.overview.totalEnrollments > 0
                  ? (count / analytics.overview.totalEnrollments) * 100
                  : 0;
                return (
                  <div key={status} className="status-bar-item">
                    <div className="status-bar-header">
                      <span className="status-name">{status}</span>
                      <span className="status-count">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill status-${status}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiz Performance */}
          <div className="analytics-section">
            <h2>Quiz Performance</h2>
            <div className="quiz-stats-grid">
              <div className="quiz-stat">
                <div className="quiz-stat-value">{analytics.quizPerformance.averageScore}%</div>
                <div className="quiz-stat-label">Average Score</div>
              </div>
              <div className="quiz-stat">
                <div className="quiz-stat-value">{analytics.quizPerformance.totalAttempts}</div>
                <div className="quiz-stat-label">Total Attempts</div>
              </div>
              <div className="quiz-stat">
                <div className="quiz-stat-value">{analytics.quizPerformance.passRate}%</div>
                <div className="quiz-stat-label">Pass Rate</div>
              </div>
              <div className="quiz-stat">
                <div className="quiz-stat-value">{analytics.quizPerformance.passedAttempts}</div>
                <div className="quiz-stat-label">Passed Attempts</div>
              </div>
            </div>
          </div>

          {/* Drop-off Analysis */}
          {analytics.dropoffAnalysis.dropoffLesson && (
            <div className="analytics-section dropoff-section">
              <h2>⚠️ Critical Drop-off Point</h2>
              <div className="dropoff-alert">
                <div className="dropoff-lesson">
                  <strong>Lesson {analytics.dropoffAnalysis.dropoffLesson.order}:</strong> {analytics.dropoffAnalysis.dropoffLesson.title}
                </div>
                <div className="dropoff-count">
                  {analytics.dropoffAnalysis.dropoffLesson.droppedCount} learners stopped here
                </div>
              </div>
              <div className="lesson-completion-chart">
                {analytics.dropoffAnalysis.lessonStats.map((lesson) => {
                  const completionRate = analytics.overview.totalEnrollments > 0
                    ? (lesson.completedBy / analytics.overview.totalEnrollments) * 100
                    : 0;
                  return (
                    <div key={lesson.lessonId} className="lesson-bar">
                      <div className="lesson-bar-header">
                        <span className="lesson-title">L{lesson.order}: {lesson.title}</span>
                        <span className="lesson-stats">
                          {lesson.completedBy}/{analytics.overview.totalEnrollments} ({completionRate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      {lesson.droppedAfter > 0 && (
                        <div className="dropout-indicator">
                          ⚠️ {lesson.droppedAfter} dropped
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Stats */}
          {analytics.paymentStats && (
            <div className="analytics-section">
              <h2>Revenue Analytics</h2>
              <div className="revenue-grid">
                <div className="revenue-card">
                  <div className="revenue-icon">💰</div>
                  <div className="revenue-value">
                    {formatCurrency(analytics.paymentStats.totalRevenue, analytics.paymentStats.currency)}
                  </div>
                  <div className="revenue-label">Total Revenue</div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">💳</div>
                  <div className="revenue-value">{analytics.paymentStats.paidEnrollments}</div>
                  <div className="revenue-label">Paid Enrollments</div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">🎁</div>
                  <div className="revenue-value">{analytics.paymentStats.freeEnrollments}</div>
                  <div className="revenue-label">Free Enrollments</div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon">📊</div>
                  <div className="revenue-value">
                    {formatCurrency(analytics.paymentStats.averagePrice, analytics.paymentStats.currency)}
                  </div>
                  <div className="revenue-label">Average Price</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Enrollments */}
          <div className="analytics-section">
            <h2>Recent Enrollments</h2>
            <div className="recent-enrollments-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.user.id}>
                      <td>{enrollment.user.name}</td>
                      <td>{enrollment.user.email}</td>
                      <td>{enrollment.user.phone || 'N/A'}</td>
                      <td>{formatDate(enrollment.enrolledAt)}</td>
                      <td>
                        <span className={`status-badge status-${enrollment.status}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td>{enrollment.progressPercentage}%</td>
                      <td>
                        {enrollment.isPaid ? (
                          <span className="paid-badge">
                            ✓ {formatCurrency(enrollment.paymentAmount)}
                          </span>
                        ) : (
                          <span className="free-badge">Free</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'enrollments' && enrollments.enrollments && (
        <div className="enrollments-tab">
          <div className="enrollments-header">
            <h2>All Enrollments ({enrollments.pagination.total})</h2>
            <div className="filter-buttons">
              <button 
                className={enrollmentFilter === 'all' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => { setEnrollmentFilter('all'); setEnrollmentPage(1); }}
              >
                All
              </button>
              <button 
                className={enrollmentFilter === 'enrolled' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => { setEnrollmentFilter('enrolled'); setEnrollmentPage(1); }}
              >
                Enrolled
              </button>
              <button 
                className={enrollmentFilter === 'in-progress' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => { setEnrollmentFilter('in-progress'); setEnrollmentPage(1); }}
              >
                In Progress
              </button>
              <button 
                className={enrollmentFilter === 'completed' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => { setEnrollmentFilter('completed'); setEnrollmentPage(1); }}
              >
                Completed
              </button>
              {analytics.course.isPaid && (
                <>
                  <button 
                    className={enrollmentFilter === 'paid' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setEnrollmentFilter('paid'); setEnrollmentPage(1); }}
                  >
                    Paid
                  </button>
                  <button 
                    className={enrollmentFilter === 'free' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setEnrollmentFilter('free'); setEnrollmentPage(1); }}
                  >
                    Free
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="enrollments-list">
            {enrollments.enrollments.map((enrollment) => (
              <div key={enrollment.enrollmentId} className="enrollment-card">
                <div className="enrollment-user">
                  <div className="user-avatar">
                    {enrollment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{enrollment.user.name}</div>
                    <div className="user-contact">{enrollment.user.email}</div>
                    {enrollment.user.phone && (
                      <div className="user-contact">📱 {enrollment.user.phone}</div>
                    )}
                  </div>
                </div>

                <div className="enrollment-details">
                  <div className="enrollment-stat">
                    <span className="stat-label">Enrolled:</span>
                    <span className="stat-value">{formatDate(enrollment.enrollment.enrolledAt)}</span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Status:</span>
                    <span className={`status-badge status-${enrollment.enrollment.status}`}>
                      {enrollment.enrollment.status}
                    </span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Progress:</span>
                    <span className="stat-value">{enrollment.enrollment.progressPercentage}%</span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Lessons:</span>
                    <span className="stat-value">{enrollment.enrollment.completedLessons}</span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Time Spent:</span>
                    <span className="stat-value">{formatTime(enrollment.enrollment.timeSpent)}</span>
                  </div>
                  {enrollment.enrollment.lastAccessedAt && (
                    <div className="enrollment-stat">
                      <span className="stat-label">Last Active:</span>
                      <span className="stat-value">{formatDate(enrollment.enrollment.lastAccessedAt)}</span>
                    </div>
                  )}
                </div>

                {enrollment.payment && (
                  <div className="enrollment-payment">
                    <div className="payment-badge">
                      ✓ Paid {formatCurrency(enrollment.payment.amount, enrollment.payment.currency)}
                    </div>
                    <div className="payment-details">
                      <div>Invoice: {enrollment.payment.invoiceNumber}</div>
                      <div>Date: {formatDate(enrollment.payment.paymentDate)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {enrollments.pagination.pages > 1 && (
            <div className="pagination">
              <button 
                disabled={enrollmentPage === 1}
                onClick={() => setEnrollmentPage(enrollmentPage - 1)}
              >
                Previous
              </button>
              <span>Page {enrollmentPage} of {enrollments.pagination.pages}</span>
              <button 
                disabled={enrollmentPage === enrollments.pagination.pages}
                onClick={() => setEnrollmentPage(enrollmentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && payments.payments && (
        <div className="payments-tab">
          <div className="payments-summary">
            <h2>Payment Summary</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-label">Total Revenue</div>
                <div className="summary-value">
                  {formatCurrency(payments.summary.totalRevenue, payments.summary.currency)}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Transactions</div>
                <div className="summary-value">{payments.summary.totalTransactions}</div>
              </div>
            </div>
          </div>

          <div className="payments-list">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((payment) => (
                  <tr key={payment.invoiceId}>
                    <td>{payment.invoiceNumber}</td>
                    <td>
                      <div>{payment.user.name}</div>
                      <div className="user-email">{payment.user.email}</div>
                    </td>
                    <td>
                      <div className="amount-breakdown">
                        <div className="total-amount">
                          {formatCurrency(payment.amount.total, payment.amount.currency)}
                        </div>
                        {payment.amount.discount > 0 && (
                          <div className="discount-amount">
                            Discount: -{formatCurrency(payment.amount.discount, payment.amount.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="payment-id">{payment.payment.id}</td>
                    <td>{formatDate(payment.payment.date)}</td>
                    <td>
                      <span className={`status-badge status-${payment.payment.status}`}>
                        {payment.payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.pagination.pages > 1 && (
            <div className="pagination">
              <button 
                disabled={paymentPage === 1}
                onClick={() => setPaymentPage(paymentPage - 1)}
              >
                Previous
              </button>
              <span>Page {paymentPage} of {payments.pagination.pages}</span>
              <button 
                disabled={paymentPage === payments.pagination.pages}
                onClick={() => setPaymentPage(paymentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCourseAnalytics;
