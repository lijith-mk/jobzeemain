import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaRupeeSign, FaCalendarAlt, FaGraduationCap, FaBuilding, FaEnvelope, FaPhone, FaExternalLinkAlt, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import sessionManager from '../utils/sessionManager';
import SuccessPrediction from '../components/SuccessPrediction';

import API_BASE_URL from '../config/api';
const InternshipDetails = () => {
  const { id, internshipId } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [similarInternships, setSimilarInternships] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const userType = sessionManager.getUserType();
  const isEmployer = userType === 'employer';

  useEffect(() => {
    fetchInternshipDetails();
    if (!isEmployer) {
      checkApplicationStatus();
    }
  }, [id, internshipId]);

  useEffect(() => {
    if (internship && internship._id) {
      fetchSimilarInternships();
    }
  }, [internship]);

  const fetchInternshipDetails = async () => {
    try {
      setLoading(true);
      const currentId = id || internshipId;
      const response = await fetch(`${API_BASE_URL}/api/internships/${currentId}`);
      const data = await response.json();
      
      if (response.ok && (data.success || data.internship)) {
        setInternship(data.internship || data.data || data.result);
      } else {
        toast.error(data.message || 'Failed to fetch internship details');
        navigate('/internships');
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
      toast.error('Error loading internship details');
      navigate('/internships');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    if (!token) return;

    try {
      setCheckingApplication(true);
      const currentId = id || internshipId;
      const response = await fetch(`${API_BASE_URL}/api/internships/${currentId}/application-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasApplied(data.hasApplied || false);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const fetchSimilarInternships = async () => {
    try {
      setLoadingSimilar(true);
      const currentId = id || internshipId;
      const response = await fetch(`${API_BASE_URL}/api/recommendations/internships/${currentId}/similar?limit=4`);
      
      if (response.ok) {
        const data = await response.json();
        setSimilarInternships(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching similar internships:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to apply for internships');
      navigate('/login');
      return;
    }

    // If external application process
    if (internship.applicationProcess === 'external' && internship.externalUrl) {
      window.open(internship.externalUrl, '_blank');
      return;
    }

    try {
      setApplying(true);
      const currentId = id || internshipId;
      const response = await fetch(`${API_BASE_URL}/api/internships/${currentId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Application submitted successfully!');
        navigate('/my-internship-applications');
      } else {
        toast.error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const formatStipend = (stipend, isUnpaid) => {
    if (isUnpaid) return 'Unpaid';
    if (!stipend || !stipend.amount) return 'Not specified';
    
    const symbol = stipend.currency === 'USD' ? '$' : stipend.currency === 'EUR' ? '€' : '₹';
    return `${symbol}${stipend.amount.toLocaleString()}/${stipend.period}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isApplicationDeadlinePassed = () => {
    return new Date() > new Date(internship.applicationDeadline);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading internship details...</p>
        </div>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Internship not found</h2>
          <p className="text-gray-600 mb-4">The internship you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/internships')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Internships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/internships')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Internships
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{internship.title}</h1>
                <div className="flex items-center mb-4">
                  <FaBuilding className="mr-2" />
                  <span className="text-xl">{internship.employer?.name || internship.employer?.companyName}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    <span>{internship.location}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2" />
                    <span>{internship.duration} months</span>
                  </div>
                  <div className="flex items-center">
                    <FaRupeeSign className="mr-2" />
                    <span>{formatStipend(internship.stipend, internship.isUnpaid)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    <span>Apply by: {formatDate(internship.applicationDeadline)}</span>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="ml-6">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  internship.status === 'active' ? 'bg-green-100 text-green-800' :
                  internship.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {internship.status?.charAt(0).toUpperCase() + internship.status?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Internship</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {internship.description}
                    </p>
                  </div>
                </section>

                {/* Responsibilities */}
                {internship.responsibilities && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {internship.responsibilities}
                      </p>
                    </div>
                  </section>
                )}

                {/* Requirements */}
                {internship.requirements && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {internship.requirements}
                      </p>
                    </div>
                  </section>
                )}

                {/* Skills */}
                {internship.skills && internship.skills.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Required</h2>
                    <div className="flex flex-wrap gap-3">
                      {internship.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Perks */}
                {internship.perks && internship.perks.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Perks & Benefits</h2>
                    <div className="flex flex-wrap gap-3">
                      {internship.perks.map((perk, index) => (
                        <span 
                          key={index}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Success Prediction (shown for logged-in users) */}
                {!isEmployer && (
                  <SuccessPrediction internshipId={internship._id} type="internship" />
                )}

                {/* Apply Button (hidden for employers) */}
                {!isEmployer && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-center">
                      {isApplicationDeadlinePassed() ? (
                        <div>
                          <p className="text-red-600 font-medium mb-3">Application deadline has passed</p>
                          <button 
                            disabled 
                            className="w-full py-3 bg-gray-300 text-gray-500 rounded-md font-semibold cursor-not-allowed"
                          >
                            Applications Closed
                          </button>
                        </div>
                      ) : internship.status !== 'active' ? (
                        <div>
                          <p className="text-yellow-600 font-medium mb-3">This internship is not currently active</p>
                          <button 
                            disabled 
                            className="w-full py-3 bg-gray-300 text-gray-500 rounded-md font-semibold cursor-not-allowed"
                          >
                            Not Available
                          </button>
                        </div>
                      ) : hasApplied ? (
                        <div>
                          <p className="text-green-600 font-medium mb-3">You have already applied</p>
                          <button 
                            disabled 
                            className="w-full py-3 bg-green-100 text-green-700 rounded-md font-semibold cursor-not-allowed"
                          >
                            Already Applied
                          </button>
                          <button
                            onClick={() => navigate('/my-internship-applications')}
                            className="w-full mt-3 py-2 border border-blue-600 text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
                          >
                            View My Applications
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600 mb-3">Ready to start your journey?</p>
                          <button
                            onClick={handleApply}
                            disabled={applying}
                            className={`w-full py-3 rounded-md font-semibold transition-colors ${
                              applying 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {applying ? 'Applying...' : internship.applicationProcess === 'external' ? 'Apply Externally' : 'Apply Now'}
                          </button>
                          {internship.applicationProcess === 'external' && (
                            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                              <FaExternalLinkAlt className="mr-1" />
                              Opens in new tab
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Internship Details */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Internship Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date:</span>
                      <p className="text-gray-900">{formatDate(internship.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Duration:</span>
                      <p className="text-gray-900">{internship.duration} months</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location Type:</span>
                      <p className="text-gray-900 capitalize">{internship.locationType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Positions Available:</span>
                      <p className="text-gray-900">{internship.numberOfPositions}</p>
                    </div>
                    {internship.department && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Department:</span>
                        <p className="text-gray-900">{internship.department}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <p className="text-gray-900">{internship.category}</p>
                    </div>
                  </div>
                </div>

                {/* Eligibility */}
                {internship.eligibility && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      <FaGraduationCap className="inline mr-2" />
                      Eligibility
                    </h3>
                    <div className="space-y-3">
                      {internship.eligibility.education && internship.eligibility.education.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Education:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {internship.eligibility.education.map((edu, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {edu}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {internship.eligibility.courses && internship.eligibility.courses.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Courses:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {internship.eligibility.courses.map((course, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {course}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {internship.eligibility.yearOfStudy && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Year of Study:</span>
                          <p className="text-gray-900">{internship.eligibility.yearOfStudy}</p>
                        </div>
                      )}
                      {internship.eligibility.minCGPA && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Minimum CGPA:</span>
                          <p className="text-gray-900">{internship.eligibility.minCGPA}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {(internship.contactEmail || internship.contactPhone) && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      {internship.contactEmail && (
                        <div className="flex items-center">
                          <FaEnvelope className="mr-3 text-gray-400" />
                          <a href={`mailto:${internship.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                            {internship.contactEmail}
                          </a>
                        </div>
                      )}
                      {internship.contactPhone && (
                        <div className="flex items-center">
                          <FaPhone className="mr-3 text-gray-400" />
                          <a href={`tel:${internship.contactPhone}`} className="text-blue-600 hover:text-blue-800">
                            {internship.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Internships */}
        {similarInternships.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Similar Internships</h2>
                  <p className="text-gray-600 text-sm mt-1">Based on AI-powered recommendations</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                    🤖 KNN Algorithm
                  </span>
                </div>
              </div>
              
              {loadingSimilar ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarInternships.map((similar) => (
                    <div 
                      key={similar._id}
                      onClick={() => navigate(`/internships/${similar._id}`)}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {similar.title}
                        </h3>
                        {similar.similarityScore && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            {similar.similarityScore}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {similar.companyName || similar.employer?.companyName}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-1" />
                          {similar.location}
                        </div>
                        <div className="flex items-center">
                          <FaClock className="mr-1" />
                          {similar.duration} months
                        </div>
                        <div className="flex items-center">
                          <FaRupeeSign className="mr-1" />
                          {formatStipend(similar.stipend, similar.isUnpaid)}
                        </div>
                      </div>
                      {similar.skills && similar.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {similar.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {similar.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{similar.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipDetails;
