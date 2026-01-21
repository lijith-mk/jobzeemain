import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaRupeeSign, FaCalendarAlt, FaGraduationCap } from 'react-icons/fa';

const InternshipCard = ({ internship }) => {
  const formatStipend = (stipend, isUnpaid) => {
    if (isUnpaid) return 'Unpaid';
    if (!stipend || !stipend.amount) return 'Not specified';
    
    const symbol = stipend.currency === 'USD' ? '$' : stipend.currency === 'EUR' ? '€' : '₹';
    return `${symbol}${stipend.amount}/${stipend.period}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            <Link to={`/internships/${internship._id}`}>
              {internship.title}
            </Link>
          </h3>
          <p className="text-gray-600 font-medium">{internship.employer?.name || internship.employer?.companyName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(internship.status)}`}>
          {internship.status?.charAt(0).toUpperCase() + internship.status?.slice(1)}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-3">
        {internship.description?.length > 150 
          ? `${internship.description.substring(0, 150)}...` 
          : internship.description}
      </p>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-gray-600">
          <FaMapMarkerAlt className="mr-2 text-sm" />
          <span className="text-sm">{internship.location}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaClock className="mr-2 text-sm" />
          <span className="text-sm">{internship.duration} months</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaRupeeSign className="mr-2 text-sm" />
          <span className="text-sm">{formatStipend(internship.stipend, internship.isUnpaid)}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <FaCalendarAlt className="mr-2 text-sm" />
          <span className="text-sm">Apply by: {formatDate(internship.applicationDeadline)}</span>
        </div>
      </div>

      {/* Skills */}
      {internship.skills && internship.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {internship.skills.slice(0, 4).map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {internship.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                +{internship.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Education Requirements */}
      {internship.eligibility?.education && internship.eligibility.education.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-gray-600 mb-2">
            <FaGraduationCap className="mr-2 text-sm" />
            <span className="text-sm font-medium">Education:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {internship.eligibility.education.slice(0, 3).map((edu, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
              >
                {edu}
              </span>
            ))}
            {internship.eligibility.education.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{internship.eligibility.education.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {internship.numberOfPositions > 1 && (
            <span>{internship.numberOfPositions} positions available</span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Link
            to={`/internships/${internship._id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InternshipCard;