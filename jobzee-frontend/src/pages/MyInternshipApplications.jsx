import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBuilding, FaMapMarkerAlt, FaClock, FaRupeeSign, FaCalendarAlt, FaEye, FaTimes, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaUserClock, FaThumbsUp, FaThumbsDown, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const MyInternshipApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Applications', color: 'gray', icon: FaHistory },
    { value: 'applied', label: 'Applied', color: 'blue', icon: FaClock },
    { value: 'reviewed', label: 'Under Review', color: 'yellow', icon: FaUserClock },
    { value: 'shortlisted', label: 'Shortlisted', color: 'green', icon: FaThumbsUp },
    { value: 'interview', label: 'Interview Scheduled', color: 'purple', icon: FaCalendarAlt },
    { value: 'selected', label: 'Selected', color: 'green', icon: FaCheckCircle },
    { value: 'rejected', label: 'Rejected', color: 'red', icon: FaThumbsDown },
    { value: 'withdrawn', label: 'Withdrawn', color: 'gray', icon: FaTimes }
  ];

  useEffect(() => {
    fetchApplications();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchApplications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/internship-applications/user/my-applications?status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setApplications(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/internship-applications/${applicationId}/withdraw`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Application withdrawn successfully');
        fetchApplications(); // Refresh the list
        setShowApplicationModal(false);
      } else {
        toast.error(data.message || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Error withdrawing application');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStipend = (stipend, isUnpaid) => {
    if (isUnpaid) return 'Unpaid';
    if (!stipend || !stipend.amount) return 'Not specified';
    
    const symbol = stipend.currency === 'USD' ? '$' : stipend.currency === 'EUR' ? '€' : '₹';
    return `${symbol}${stipend.amount}/${stipend.period}`;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'gray';
  };

  const getStatusBadgeClass = (status) => {
    const color = getStatusColor(status);
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800'
    };
    return colorClasses[color] || colorClasses.gray;
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    const IconComponent = statusOption?.icon || FaClock;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'applied': 'Your application has been submitted and is waiting for review.',
      'reviewed': 'Your application is currently being reviewed by the employer.',
      'shortlisted': 'Great news! You have been shortlisted for this position.',
      'interview': 'You have been selected for an interview. The employer may contact you soon.',
      'selected': 'Congratulations! You have been selected for this internship.',
      'rejected': 'Unfortunately, your application was not selected this time. Keep applying!',
      'withdrawn': 'You have withdrawn your application for this internship.'
    };
    return descriptions[status] || 'Status updated';
  };

  const getStatusTimeline = (application) => {
    if (!application.statusHistory || application.statusHistory.length === 0) {
      return [];
    }
    
    return application.statusHistory
      .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))
      .map((entry, index) => ({
        ...entry,
        isLast: index === application.statusHistory.length - 1
      }));
  };

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Internship Applications</h1>
              <p className="text-gray-600">Track the status of your internship applications</p>
            </div>
            <Link
              to="/internships"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Internships
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-medium text-gray-700">Filter by status:</span>
            {statusOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications found</h3>
              <p className="text-gray-500 mb-6">
                {statusFilter === 'all'
                  ? "You haven't applied for any internships yet."
                  : `No applications with status "${statusOptions.find(opt => opt.value === statusFilter)?.label}".`
                }
              </p>
              <Link
                to="/internships"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Internships
              </Link>
            </div>
          ) : (
            applications.map((application) => (
              <div key={application._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {application.internship?.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <FaBuilding className="mr-2 text-sm" />
                            <span className="font-medium">{application.employer?.name || application.employer?.companyName}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusBadgeClass(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span>{application.statusDisplay || application.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 italic">
                          {getStatusDescription(application.status)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <FaMapMarkerAlt className="mr-2 text-sm" />
                          <span className="text-sm">{application.internship?.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaClock className="mr-2 text-sm" />
                          <span className="text-sm">{application.internship?.duration} months</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaRupeeSign className="mr-2 text-sm" />
                          <span className="text-sm">{formatStipend(application.internship?.stipend, application.internship?.isUnpaid)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="mr-2 text-sm" />
                          <span className="text-sm">Applied: {formatDate(application.appliedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          <p>Application deadline: {formatDate(application.internship?.applicationDeadline)}</p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => viewApplicationDetails(application)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <FaEye className="mr-1 inline" />
                            View Details
                          </button>
                          <Link
                            to={`/internships/${application.internship?._id}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            View Internship
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Internship Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Internship Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedApplication.internship?.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedApplication.employer?.name || selectedApplication.employer?.companyName}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Location:</strong> {selectedApplication.internship?.location}</div>
                    <div><strong>Duration:</strong> {selectedApplication.internship?.duration} months</div>
                    <div><strong>Stipend:</strong> {formatStipend(selectedApplication.internship?.stipend, selectedApplication.internship?.isUnpaid)}</div>
                    <div><strong>Status:</strong> {selectedApplication.internship?.status}</div>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusBadgeClass(selectedApplication.status)}`}>
                      {getStatusIcon(selectedApplication.status)}
                      <span>{selectedApplication.statusDisplay || selectedApplication.status}</span>
                    </span>
                    <div className="text-sm text-gray-500">
                      Applied: {formatDate(selectedApplication.appliedAt)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 italic">
                    {getStatusDescription(selectedApplication.status)}
                  </p>
                  
                  {selectedApplication.reviewedAt && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Last reviewed:</strong> {formatDate(selectedApplication.reviewedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
                  <div className="space-y-4">
                    {getStatusTimeline(selectedApplication).map((entry, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.isLast ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getStatusIcon(entry.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              entry.isLast ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(entry.changedAt)}
                            </p>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Cover Letter</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {selectedApplication.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.additionalInfo}</p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedApplication.relevantSkills && selectedApplication.relevantSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Mentioned</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.relevantSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {['applied', 'reviewed'].includes(selectedApplication.status) && (
                    <button
                      onClick={() => withdrawApplication(selectedApplication._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
                
                <Link
                  to={`/internships/${selectedApplication.internship?._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Internship
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInternshipApplications;