import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const EmployerInternships = () => {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired, draft
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
      return;
    }
    
    fetchInternships();
  }, [navigate]);

  const fetchInternships = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`${API_BASE_URL}/api/internships/employer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setInternships(data.internships || []);
      } else {
        toast.error(data.message || 'Failed to fetch internships');
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (internshipId) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) {
      return;
    }

    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`${API_BASE_URL}/api/internships/${internshipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Internship deleted successfully');
        fetchInternships();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete internship');
      }
    } catch (error) {
      console.error('Error deleting internship:', error);
      toast.error('Failed to delete internship');
    }
  };

  const handleStatusUpdate = async (internshipId, newStatus) => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`${API_BASE_URL}/api/internships/${internshipId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Internship ${newStatus} successfully`);
        fetchInternships();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '✅';
      case 'expired':
        return '❌';
      case 'draft':
        return '📝';
      case 'paused':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const filteredInternships = internships.filter(internship => {
    const matchesFilter = filter === 'all' || internship.status === filter;
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatStipend = (stipend, isUnpaid) => {
    if (isUnpaid) return 'Unpaid';
    if (!stipend.amount) return 'Not specified';
    
    return `${stipend.currency} ${stipend.amount}/${stipend.period}`;
  };

  const isExpired = (deadline) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading internships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Internships</h1>
            <p className="mt-2 text-gray-600">
              Manage your internship postings and applications
            </p>
          </div>
          <Link
            to="/employer/post-internship"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Post New Internship</span>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'draft', label: 'Draft' },
                { value: 'paused', label: 'Paused' }
              ].map(filterOption => (
                <button
                  key={filterOption.value}
                  onClick={() => setFilter(filterOption.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Internships</p>
                <p className="text-2xl font-semibold text-gray-900">{internships.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {internships.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold">❌</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {internships.filter(i => i.status === 'expired' || isExpired(i.applicationDeadline)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {internships.reduce((sum, internship) => sum + (internship.applicationsCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Internships List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInternships.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {internships.length === 0 ? 'No internships yet' : 'No internships found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {internships.length === 0 
                  ? 'Start by posting your first internship opportunity'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {internships.length === 0 && (
                <Link
                  to="/employer/post-internship"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Post Your First Internship
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInternships.map((internship) => (
                <div key={internship._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{internship.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(internship.status)}`}>
                          {getStatusIcon(internship.status)} {internship.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          📍 {internship.location}
                        </span>
                        <span className="flex items-center">
                          🕒 {internship.duration} months
                        </span>
                        <span className="flex items-center">
                          💰 {formatStipend(internship.stipend, internship.isUnpaid)}
                        </span>
                        <span className="flex items-center">
                          🎯 {internship.numberOfPositions} position{internship.numberOfPositions > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Posted: {formatDate(internship.createdAt)}</span>
                        <span>Deadline: {formatDate(internship.applicationDeadline)}</span>
                        <span>Applications: {internship.applicationsCount || 0}</span>
                      </div>

                      {internship.skills && internship.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {internship.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {internship.skills.length > 5 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{internship.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <Link
                        to={`/employer/internships/${internship._id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                      
                      <Link
                        to={`/employer/internships/${internship._id}/applications`}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Applications ({internship.applicationsCount || 0})
                      </Link>
                      
                      {internship.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(internship._id, 'paused')}
                          className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          Pause
                        </button>
                      )}
                      
                      {internship.status === 'paused' && (
                        <button
                          onClick={() => handleStatusUpdate(internship._id, 'active')}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(internship._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerInternships;