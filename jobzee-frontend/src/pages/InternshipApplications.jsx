import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaFileAlt, FaExternalLinkAlt, FaArrowLeft, FaClock, FaCheckCircle, FaTimes, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import SVMCandidateScreening from '../components/SVMCandidateScreening';

import API_BASE_URL from '../config/api';
const InternshipApplications = () => {
  const { internshipId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const statusOptions = [
    { value: 'all', label: 'All Applications', color: 'gray' },
    { value: 'applied', label: 'Applied', color: 'blue' },
    { value: 'reviewed', label: 'Under Review', color: 'yellow' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'green' },
    { value: 'interview', label: 'Interview', color: 'purple' },
    { value: 'selected', label: 'Selected', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' }
  ];

  useEffect(() => {
    fetchApplications();
  }, [internshipId, statusFilter, currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerToken');
      if (!token) {
        toast.error('Please login first');
        navigate('/employer/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/internships/${internshipId}/applications?status=${statusFilter}&page=${currentPage}&limit=10`,
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
        setStats(data.stats);
        setPagination(data.pagination);
        
        // Get internship details if not already loaded
        if (!internship && data.data.length > 0) {
          setInternship(data.data[0].internship);
        }
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

  const updateApplicationStatus = async (applicationId, newStatus, notes = '') => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(
        `${API_BASE_URL}/api/internship-applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus, notes })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Application status updated successfully');
        fetchApplications(); // Refresh the list
        setShowApplicationModal(false);
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating application status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const viewApplicationDetails = async (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/employer/internships')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Internships
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Internship Applications</h1>
            {internship && (
              <div className="text-lg text-gray-600">
                <span className="font-medium">{internship.title}</span>
                <span className="mx-2">•</span>
                <span>{internship.location}</span>
                <span className="mx-2">•</span>
                <span>{internship.duration} months</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.applied || 0}</div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.reviewed || 0}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">{stats.shortlisted || 0}</div>
            <div className="text-sm text-gray-600">Shortlisted</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.selected || 0}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
        </div>

        {/* AI Candidate Screening */}
        {applications.length > 0 && internship && (
          <div className="mb-8">
            <SVMCandidateScreening jobId={internshipId} jobTitle={internship.title} type="internship" />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-medium text-gray-700">Filter by status:</span>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter(option.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
                {stats[option.value] && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                    {stats[option.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileAlt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications found</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'No one has applied for this internship yet.'
                  : `No applications with status "${statusOptions.find(opt => opt.value === statusFilter)?.label}".`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {application.user?.profilePhoto ? (
                            <img
                              src={application.user.profilePhoto}
                              alt={application.user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <FaUser className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.user?.name}
                              </h3>
                              <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <FaEnvelope className="mr-1" />
                                  {application.user?.email}
                                </span>
                                {application.user?.phone && (
                                  <span className="flex items-center">
                                    <FaPhone className="mr-1" />
                                    {application.user.phone}
                                  </span>
                                )}
                                {application.user?.location && (
                                  <span className="flex items-center">
                                    <FaMapMarkerAlt className="mr-1" />
                                    {application.user.location}
                                  </span>
                                )}
                              </div>
                              
                              {application.user?.skills && application.user.skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {application.user.skills.slice(0, 5).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {application.user.skills.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                      +{application.user.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(application.status)}`}>
                                {application.statusDisplay || application.status}
                              </span>
                              
                              <button
                                onClick={() => viewApplicationDetails(application)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                <FaEye className="mr-1 inline" />
                                View Details
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center text-sm text-gray-500">
                            <FaClock className="mr-1" />
                            Applied {formatDate(application.appliedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} applications
                  </div>
                  <div className="flex space-x-2">
                    {currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    {currentPage < pagination.pages && (
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
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
              {/* Applicant Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      {selectedApplication.user?.profilePhoto ? (
                        <img
                          src={selectedApplication.user.profilePhoto}
                          alt={selectedApplication.user.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{selectedApplication.user?.name}</h4>
                      <p className="text-gray-600">{selectedApplication.user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.user?.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedApplication.user.phone}
                      </div>
                    )}
                    {selectedApplication.user?.location && (
                      <div>
                        <span className="font-medium">Location:</span> {selectedApplication.user.location}
                      </div>
                    )}
                    {selectedApplication.yearsOfExperience && (
                      <div>
                        <span className="font-medium">Experience:</span> {selectedApplication.yearsOfExperience} years
                      </div>
                    )}
                    {selectedApplication.expectedStartDate && (
                      <div>
                        <span className="font-medium">Available From:</span> {formatDate(selectedApplication.expectedStartDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cover Letter</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                  </div>
                </div>
              )}

              {/* Links */}
              {(selectedApplication.resumeUrl || selectedApplication.portfolioUrl) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents & Links</h3>
                  <div className="space-y-2">
                    {selectedApplication.resumeUrl && (
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        Resume
                      </a>
                    )}
                    {selectedApplication.portfolioUrl && (
                      <a
                        href={selectedApplication.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {selectedApplication.relevantSkills && selectedApplication.relevantSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Relevant Skills</h3>
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

              {/* Additional Info */}
              {selectedApplication.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.additionalInfo}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.slice(1).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateApplicationStatus(selectedApplication._id, option.value)}
                      disabled={selectedApplication.status === option.value}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedApplication.status === option.value
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : `bg-${option.color}-600 text-white hover:bg-${option.color}-700`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
                <p><strong>Applied:</strong> {formatDate(selectedApplication.appliedAt)}</p>
                {selectedApplication.reviewedAt && (
                  <p><strong>Last Reviewed:</strong> {formatDate(selectedApplication.reviewedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipApplications;