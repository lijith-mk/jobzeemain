import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaRupeeSign, FaBriefcase, FaClock, FaStar, FaTimes } from 'react-icons/fa';
import InternshipCard from '../components/InternshipCard';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stipendFilter, setStipendFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Technology & IT',
    'Marketing & Sales',
    'Finance & Accounting',
    'Human Resources',
    'Design & Creative',
    'Content & Writing',
    'Operations',
    'Consulting',
    'Research & Development',
    'Other'
  ];

  const durations = ['1-3 months', '3-6 months', '6+ months'];
  const stipendRanges = ['Unpaid', '1-10k', '10-25k', '25k+'];

  useEffect(() => {
    fetchInternships();
  }, []);

  useEffect(() => {
    filterInternships();
  }, [internships, searchTerm, locationFilter, categoryFilter, stipendFilter, durationFilter]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/internships`);
      const data = await response.json();
      
      if (response.ok && (data.success || Array.isArray(data.internships))) {
        const list = Array.isArray(data.internships) ? data.internships : (data.data || []);
        setInternships(Array.isArray(list) ? list : []);
      } else {
        toast.error(data.message || 'Failed to fetch internships');
        setInternships([]);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast.error('Error loading internships');
      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInternships = () => {
    const source = Array.isArray(internships) ? internships : [];
    let filtered = [...source];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(internship =>
        internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (internship.employer?.name && internship.employer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (internship.employer?.companyName && internship.employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(internship =>
        internship.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(internship =>
        internship.category === categoryFilter
      );
    }

    // Stipend filter
    if (stipendFilter) {
      filtered = filtered.filter(internship => {
        if (stipendFilter === 'Unpaid') return internship.isUnpaid;
        if (stipendFilter === '1-10k') return !internship.isUnpaid && internship.stipend?.amount >= 1000 && internship.stipend?.amount <= 10000;
        if (stipendFilter === '10-25k') return !internship.isUnpaid && internship.stipend?.amount > 10000 && internship.stipend?.amount <= 25000;
        if (stipendFilter === '25k+') return !internship.isUnpaid && internship.stipend?.amount > 25000;
        return true;
      });
    }

    // Duration filter
    if (durationFilter) {
      filtered = filtered.filter(internship => {
        if (durationFilter === '1-3 months') return internship.duration >= 1 && internship.duration <= 3;
        if (durationFilter === '3-6 months') return internship.duration > 3 && internship.duration <= 6;
        if (durationFilter === '6+ months') return internship.duration > 6;
        return true;
      });
    }

    setFilteredInternships(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setCategoryFilter('');
    setStipendFilter('');
    setDurationFilter('');
  };

  const getUniqueLocations = () => {
    const locations = internships.map(internship => internship.location).filter(Boolean);
    return [...new Set(locations)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-blue-600 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading amazing opportunities...</p>
        </div>
      </div>
    );
  }

  const activeFiltersCount = [locationFilter, categoryFilter, stipendFilter, durationFilter].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Find Internships
              </h1>
              <p className="text-base text-blue-100">
                Discover amazing opportunities to kickstart your career
              </p>
            </div>
            <div className="hidden md:flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <FaStar className="mr-2 text-yellow-300" />
              <span>{filteredInternships.length} Available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search and Filter Section */}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 text-lg" />
              <input
                type="text"
                placeholder="Search by title, company, skills, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                showFilters 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaFilter />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="border-t-2 border-gray-100 pt-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location Filter */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    <FaMapMarkerAlt className="inline mr-2 text-purple-600" />
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Locations</option>
                    {getUniqueLocations().map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    <FaBriefcase className="inline mr-2 text-blue-600" />
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Stipend Filter */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    <FaRupeeSign className="inline mr-2 text-green-600" />
                    Stipend Range
                  </label>
                  <select
                    value={stipendFilter}
                    onChange={(e) => setStipendFilter(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Stipends</option>
                    {stipendRanges.map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                {/* Duration Filter */}
                <div className="group">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    <FaClock className="inline mr-2 text-orange-600" />
                    Duration
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md cursor-pointer"
                  >
                    <option value="">All Durations</option>
                    {durations.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters & Clear */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t-2 border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {locationFilter && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {locationFilter}
                        <button onClick={() => setLocationFilter('')} className="hover:bg-purple-200 rounded-full p-0.5">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {categoryFilter && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {categoryFilter}
                        <button onClick={() => setCategoryFilter('')} className="hover:bg-blue-200 rounded-full p-0.5">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {stipendFilter && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {stipendFilter}
                        <button onClick={() => setStipendFilter('')} className="hover:bg-green-200 rounded-full p-0.5">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {durationFilter && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {durationFilter}
                        <button onClick={() => setDurationFilter('')} className="hover:bg-orange-200 rounded-full p-0.5">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 text-red-600 hover:text-red-800 font-semibold hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-1 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredInternships.length}
                <span className="text-lg font-normal text-gray-600 ml-2">
                  {filteredInternships.length === 1 ? 'opportunity' : 'opportunities'}
                </span>
              </p>
              <p className="text-sm text-gray-500">Ready for you to explore</p>
            </div>
          </div>
        </div>

        {/* Internships Grid */}
        {filteredInternships.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="text-8xl mb-6 animate-bounce">🔍</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">No matches found</h3>
            <p className="text-lg text-gray-600 mb-8">We couldn't find any internships matching your criteria</p>
            <button
              onClick={clearFilters}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
            {filteredInternships.map((internship, index) => (
              <div 
                key={internship._id} 
                className="transform transition-all duration-500 hover:scale-105"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <InternshipCard internship={internship} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Internships;