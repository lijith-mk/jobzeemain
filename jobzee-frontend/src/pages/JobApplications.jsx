import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import SVMCandidateScreening from '../components/SVMCandidateScreening';

import API_BASE_URL from '../config/api';
const JobApplications = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [employer, setEmployer] = useState(null);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeApplicationId, setActiveApplicationId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    round: '',
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    duration: 30,
    locationType: 'online',
    locationDetails: '',
    interviewerName: '',
    interviewerEmail: ''
  });

  useEffect(() => {
    const employerData = localStorage.getItem('employer');
    const token = localStorage.getItem('employerToken');
    
    if (!employerData || !token) {
      navigate('/employer/login');
      return;
    }

    setEmployer(JSON.parse(employerData));
    fetchJobAndApplications(token);
  }, [navigate, jobId]);

  const fetchJobAndApplications = async (token) => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobRes = await fetch(`${API_BASE_URL}/api/employers/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData.job);
      }

      // Fetch applications for this job
      const applicationsRes = await fetch(`${API_BASE_URL}/api/applications/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        console.log('Applications data:', applicationsData.applications);
        setApplications(applicationsData.applications || []);
      } else {
        toast.error('Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatusUpdate = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ applicationStatus: newStatus })
      });

      if (res.ok) {
        toast.success('Application status updated');
        // Update local state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, applicationStatus: newStatus } : app
        ));
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Network error');
    }
  };

  const openScheduleModal = (applicationId) => {
    setActiveApplicationId(applicationId);
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setActiveApplicationId(null);
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({ ...prev, [name]: value }));
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('employerToken');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      if (!activeApplicationId) return;

      // Combine date and time into an ISO string, assume provided date/time are local and convert to UTC by using Date
      const scheduledLocal = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
      if (isNaN(scheduledLocal.getTime())) {
        toast.error('Please provide a valid date and time');
        return;
      }

      const body = {
        round: scheduleForm.round || 'Interview',
        scheduledAt: scheduledLocal.toISOString(),
        timezone: scheduleForm.timezone || 'UTC',
        duration: Number(scheduleForm.duration) || 30,
        locationType: scheduleForm.locationType,
        locationDetails: scheduleForm.locationDetails,
        interviewers: (scheduleForm.interviewerName || scheduleForm.interviewerEmail)
          ? [{ name: scheduleForm.interviewerName, email: scheduleForm.interviewerEmail }]
          : []
      };

      const res = await fetch(`${API_BASE_URL}/api/interviews/${activeApplicationId}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to schedule interview');
      }

      // Update application status locally
      setApplications(prev => prev.map(app =>
        app._id === activeApplicationId ? { ...app, applicationStatus: 'interview-scheduled' } : app
      ));

      toast.success('Interview scheduled');
      closeScheduleModal();
    } catch (err) {
      console.error('Schedule interview error:', err);
      toast.error(err.message || 'Failed to schedule interview');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under-review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'interview-scheduled': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'interviewed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'hired': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'under-review': return 'Under Review';
      case 'shortlisted': return 'Shortlisted';
      case 'interview-scheduled': return 'Interview Scheduled';
      case 'interviewed': return 'Interviewed';
      case 'rejected': return 'Rejected';
      case 'hired': return 'Hired';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.applicationStatus === filter;
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link
            to="/employer/my-jobs"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  to="/employer/my-jobs"
                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to My Jobs</span>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-2">{job.location} • {job.jobType} • {job.experienceLevel}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </div>
        </div>

        {/* Job Info Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Job Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                job.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {job.status === 'active' ? 'Live' : job.status === 'pending' ? 'Pending' : job.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Posted Date</h3>
              <p className="text-sm text-gray-900">{formatDate(job.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Salary Range</h3>
              <p className="text-sm text-gray-900">
                {job.salary?.min && job.salary?.max 
                  ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`
                  : 'Not specified'
                }
              </p>
            </div>
          </div>
        </div>

        {/* AI Candidate Screening */}
        {applications.length > 0 && (
          <div className="mb-6">
            <SVMCandidateScreening jobId={jobId} jobTitle={job.title} type="job" />
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Applications ({applications.length})
              </button>
              <button
                onClick={() => setFilter('applied')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'applied' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Applied ({applications.filter(app => app.applicationStatus === 'applied').length})
              </button>
              <button
                onClick={() => setFilter('shortlisted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'shortlisted' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Shortlisted ({applications.filter(app => app.applicationStatus === 'shortlisted').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({applications.filter(app => app.applicationStatus === 'rejected').length})
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No applications found' : 'No applications yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'Applications will appear here when candidates apply for this job'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {application.applicantName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {application.applicantName}
                        </h3>
                        <p className="text-gray-600 mb-2">{application.applicantEmail}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Applied {formatDate(application.appliedAt)}</span>
                          </span>
                          
                          {application.experience && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                              </svg>
                              <span>{application.experience}</span>
                            </span>
                          )}
                          
                          {application.skills && application.skills.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              <span>{application.skills.length} skills</span>
                            </span>
                          )}
                        </div>
                        
                        {application.coverLetter && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">{application.coverLetter}</p>
                          </div>
                        )}
                        
                        {(application.resumeLink || application.userId?.resume) && (
                          <a
                            href={application.resumeLink || application.userId?.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>View Resume</span>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.applicationStatus)}`}>
                        {getStatusText(application.applicationStatus)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={application.applicationStatus}
                          onChange={(e) => handleApplicationStatusUpdate(application._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="applied">Applied</option>
                          <option value="under-review">Under Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview-scheduled">Interview Scheduled</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                        <button
                          onClick={() => openScheduleModal(application._id)}
                          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg"
                          title="Schedule Interview"
                        >
                          Schedule Interview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {showScheduleModal && (
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={closeScheduleModal}
        applicationId={activeApplicationId}
        onSuccess={() => {
          // optimistic UI already done on click; ensure status reflects
          setApplications(prev => prev.map(app =>
            app._id === activeApplicationId ? { ...app, applicationStatus: 'interview-scheduled' } : app
          ));
          toast.success('Interview scheduled');
        }}
      />
    )}
    </>
  );
};

export default JobApplications;
