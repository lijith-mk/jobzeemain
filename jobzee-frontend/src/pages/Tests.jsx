import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const Tests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    jobRole: '',
    skill: '',
    difficulty: '',
    category: '',
    searchTerm: ''
  });

  // Get unique values for filter dropdowns
  const [jobRoles, setJobRoles] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tests]);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
        
        // Extract unique job roles and skills
        const uniqueJobRoles = [...new Set(data.tests.map(t => t.jobRole).filter(Boolean))];
        const uniqueSkills = [...new Set(data.tests.map(t => t.skill).filter(Boolean))];
        setJobRoles(uniqueJobRoles);
        setSkills(uniqueSkills);
      } else {
        toast.error('Failed to fetch tests');
      }
    } catch (error) {
      console.error('Fetch tests error:', error);
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tests];

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchLower) ||
        test.description?.toLowerCase().includes(searchLower)
      );
    }

    // Job role filter
    if (filters.jobRole) {
      filtered = filtered.filter(test => test.jobRole === filters.jobRole);
    }

    // Skill filter
    if (filters.skill) {
      filtered = filtered.filter(test => test.skill === filters.skill);
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(test => test.difficulty === filters.difficulty);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(test => test.category === filters.category);
    }

    setFilteredTests(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      jobRole: '',
      skill: '',
      difficulty: '',
      category: '',
      searchTerm: ''
    });
  };

  const handleTakeTest = (testId) => {
    navigate(`/tests/${testId}/take`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full opacity-20"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium animate-pulse">Loading practice arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                <span className="text-sm font-semibold">Practice Arena</span>
              </div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Master Your Skills
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  One Test at a Time
                </span>
              </h1>
              <p className="text-xl text-purple-100 max-w-2xl leading-relaxed">
                Challenge yourself with comprehensive tests designed to sharpen your abilities and accelerate your career growth
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8 max-w-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{tests.length}</div>
                  <div className="text-sm text-purple-100">Available Tests</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{[...new Set(tests.map(t => t.category))].length}</div>
                  <div className="text-sm text-purple-100">Categories</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">∞</div>
                  <div className="text-sm text-purple-100">Learning Path</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/tests/history')}
              className="hidden lg:flex items-center gap-3 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all hover:scale-105 shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </button>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="url(#gradient)" fillOpacity="0.3"/>
            <path d="M0 120L60 105C120 90 240 60 360 50C480 40 600 50 720 60C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="720" y1="0" x2="720" y2="120">
                <stop stopColor="#F3E8FF"/>
                <stop offset="1" stopColor="white"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Filters Section - Glassmorphism Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {(filters.jobRole || filters.skill || filters.difficulty || filters.category || filters.searchTerm) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search by title or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Role
              </label>
              <select
                value={filters.jobRole}
                onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {jobRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Skill */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill
              </label>
              <select
                value={filters.skill}
                onChange={(e) => handleFilterChange('skill', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Skills</option>
                {skills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="technical">Technical</option>
                <option value="aptitude">Aptitude</option>
                <option value="reasoning">Reasoning</option>
                <option value="language">Language</option>
                <option value="general">General Knowledge</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.jobRole || filters.skill || filters.difficulty || filters.category) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {filters.jobRole && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-lg">
                  {filters.jobRole}
                  <button
                    onClick={() => handleFilterChange('jobRole', '')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
              {filters.skill && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg">
                  {filters.skill}
                  <button
                    onClick={() => handleFilterChange('skill', '')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-lg">
                  {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
              {filters.difficulty && (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium shadow-lg">
                  {filters.difficulty}
                  <button
                    onClick={() => handleFilterChange('difficulty', '')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Display */}
        {filteredTests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center border border-purple-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {tests.length === 0
                ? "There are no practice tests available at the moment. Check back soon!"
                : "No tests match your current filters. Try adjusting them to discover more opportunities."}
            </p>
            {(filters.jobRole || filters.skill || filters.difficulty || filters.category || filters.searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all hover:scale-105 font-semibold"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {filteredTests.map((test) => (
              <div
                key={test._id}
                className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-purple-50 hover:border-purple-200 hover:-translate-y-2"
              >
                {/* Card Header with Gradient */}
                <div className="relative h-32 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 p-6">
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      test.difficulty === 'easy'
                        ? 'bg-green-400 text-green-900'
                        : test.difficulty === 'medium'
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-red-400 text-red-900'
                    }`}>
                      {test.difficulty?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-6">
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      <span className="uppercase tracking-wider font-semibold">{test.category || 'General'}</span>
                    </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                </div>

                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 transition-all">
                    {test.title}
                  </h3>

                  {/* Description */}
                  {test.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {test.jobRole && (
                      <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        {test.jobRole}
                      </span>
                    )}
                    {test.skill && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        {test.skill}
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium uppercase">
                      {test.type}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border border-purple-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {test.questions?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {test.duration}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {test.totalMarks}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Points</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleTakeTest(test._id)}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105"
                  >
                    <span>Start Challenge</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Tests;
