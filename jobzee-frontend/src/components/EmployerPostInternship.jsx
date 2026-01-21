import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const EmployerPostInternship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employer, setEmployer] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    locationType: 'on-site', // on-site, remote, hybrid
    duration: '', // Duration in months
    stipend: {
      amount: '',
      currency: 'INR',
      period: 'monthly' // monthly, weekly, daily, one-time
    },
    startDate: '',
    applicationDeadline: '',
    skills: [],
    eligibility: {
      education: [], // Graduation, Post-graduation, etc.
      courses: [], // Engineering, MBA, etc.
      yearOfStudy: '', // 1st year, 2nd year, etc.
      minCGPA: ''
    },
    perks: [], // Certificate, Letter of recommendation, etc.
    numberOfPositions: 1,
    applicationProcess: 'apply', // apply, external
    externalUrl: '',
    contactEmail: '',
    contactPhone: '',
    department: '',
    category: 'technology', // technology, marketing, finance, hr, design, etc.
    isUnpaid: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const categories = [
    { value: 'technology', label: 'Technology & IT' },
    { value: 'marketing', label: 'Marketing & Sales' },
    { value: 'finance', label: 'Finance & Accounting' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'design', label: 'Design & Creative' },
    { value: 'content', label: 'Content & Writing' },
    { value: 'operations', label: 'Operations' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'research', label: 'Research & Development' },
    { value: 'other', label: 'Other' }
  ];

  const educationLevels = [
    'High School',
    'Diploma',
    'Graduation (Bachelor\'s)',
    'Post-graduation (Master\'s)',
    'PhD',
    'Any'
  ];

  const courses = [
    'Engineering',
    'MBA',
    'Computer Science',
    'Business Administration',
    'Marketing',
    'Finance',
    'Design',
    'Mass Communication',
    'Law',
    'Medicine',
    'Other'
  ];

  const yearOfStudyOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Final Year',
    'Recent Graduate',
    'Any Year'
  ];

  const perkOptions = [
    'Certificate of completion',
    'Letter of recommendation',
    'Pre-placement offer (PPO)',
    'Mentorship',
    'Flexible working hours',
    'Work from home',
    'Free meals',
    'Transportation',
    'Networking opportunities',
    'Skill development programs'
  ];

  useEffect(() => {
    const employerData = localStorage.getItem('employer');
    const token = localStorage.getItem('employerToken');
    
    if (!employerData || !token) {
      navigate('/employer/login');
      return;
    }
    
    const parsedEmployer = JSON.parse(employerData);
    setEmployer(parsedEmployer);
    
    // Pre-fill some fields with employer data
    setFormData(prev => ({
      ...prev,
      contactEmail: parsedEmployer.companyEmail || parsedEmployer.contactPersonEmail || '',
      contactPhone: parsedEmployer.contactPersonPhone || ''
    }));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayInput = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNestedArrayInput = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: prev[parent][field].includes(value)
          ? prev[parent][field].filter(item => item !== value)
          : [...prev[parent][field], value]
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateForm = () => {
    const required = ['title', 'description', 'location', 'duration', 'startDate', 'applicationDeadline'];
    for (let field of required) {
      if (!formData[field].trim()) {
        toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }

    // Skills are optional
    // if (formData.skills.length === 0) {
    //   toast.error('Please add at least one skill requirement');
    //   return false;
    // }

    if (new Date(formData.applicationDeadline) <= new Date()) {
      toast.error('Application deadline must be in the future');
      return false;
    }

    if (new Date(formData.startDate) <= new Date(formData.applicationDeadline)) {
      toast.error('Start date must be after application deadline');
      return false;
    }

    // If using external application, require a valid URL
    if (formData.applicationProcess === 'external') {
      if (!formData.externalUrl || !String(formData.externalUrl).trim()) {
        toast.error('External Application URL is required');
        return false;
      }
      const candidate = String(formData.externalUrl).trim();
      const normalized = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
      try {
        // eslint-disable-next-line no-new
        new URL(normalized);
      } catch (_) {
        toast.error('Please provide a valid External Application URL');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('employerToken');
      
      console.log('Submitting internship data:', formData);
      
      // Normalize external URL before sending
      const payload = { ...formData };
      if (payload.applicationProcess === 'external' && payload.externalUrl) {
        const candidate = String(payload.externalUrl).trim();
        payload.externalUrl = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
      }
      
      // Clean up empty string values that should be undefined for enum fields
      if (payload.eligibility) {
        if (payload.eligibility.yearOfStudy === '') {
          payload.eligibility.yearOfStudy = undefined;
        }
        if (payload.eligibility.minCGPA === '') {
          payload.eligibility.minCGPA = undefined;
        }
      }
      
      // Handle stipend data properly for unpaid internships
      if (payload.isUnpaid) {
        // For unpaid internships, set stipend to null or remove it entirely
        payload.stipend = null;
      } else {
        // For paid internships, ensure stipend amount is a valid number
        if (payload.stipend && payload.stipend.amount === '') {
          payload.stipend.amount = undefined;
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/api/internships`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Internship posted successfully!');
        navigate('/employer/internships');
      } else {
        console.error('Validation errors:', data);
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => {
            toast.error(`${error.path}: ${error.msg}`);
          });
        } else {
          toast.error(data.message || 'Failed to post internship');
        }
      }
    } catch (error) {
      console.error('Error posting internship:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Internship Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Software Development Intern"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department
        </label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Engineering, Marketing"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (months) *
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            min="1"
            max="12"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Positions *
          </label>
          <input
            type="number"
            name="numberOfPositions"
            value={formData.numberOfPositions}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Type *
        </label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'on-site', label: 'On-site' },
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' }
          ].map(type => (
            <label key={type.value} className="flex items-center">
              <input
                type="radio"
                name="locationType"
                value={type.value}
                checked={formData.locationType === type.value}
                onChange={handleInputChange}
                className="mr-2"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Mumbai, India or Remote"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Description & Requirements</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Internship Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the internship opportunity, company culture, and what the intern will learn..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Responsibilities
        </label>
        <textarea
          name="responsibilities"
          value={formData.responsibilities}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="List the key responsibilities and tasks..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements
        </label>
        <textarea
          name="requirements"
          value={formData.requirements}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="List the requirements and qualifications..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills Required
        </label>
        <input
          type="text"
          placeholder="Type a skill and press Enter"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const skill = e.target.value.trim();
              if (skill && !formData.skills.includes(skill)) {
                setFormData(prev => ({
                  ...prev,
                  skills: [...prev.skills, skill]
                }));
                e.target.value = '';
              }
            }
          }}
        />
        <p className="text-sm text-gray-500 mt-1">Type a skill and press Enter to add it. You can add multiple skills.</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.skills.map((skill, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
            >
              {skill}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    skills: prev.skills.filter((_, i) => i !== index)
                  }));
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Eligibility & Compensation</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education Level
        </label>
        <div className="space-y-2">
          {educationLevels.map(level => (
            <label key={level} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.eligibility.education.includes(level)}
                onChange={() => handleNestedArrayInput('eligibility', 'education', level)}
                className="mr-2"
              />
              {level}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Courses
        </label>
        <div className="space-y-2">
          {courses.map(course => (
            <label key={course} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.eligibility.courses.includes(course)}
                onChange={() => handleNestedArrayInput('eligibility', 'courses', course)}
                className="mr-2"
              />
              {course}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year of Study
        </label>
        <select
          name="eligibility.yearOfStudy"
          value={formData.eligibility.yearOfStudy}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select year of study</option>
          {yearOfStudyOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum CGPA
        </label>
        <input
          type="number"
          name="eligibility.minCGPA"
          value={formData.eligibility.minCGPA}
          onChange={handleInputChange}
          min="0"
          max="10"
          step="0.1"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 7.0"
        />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            name="isUnpaid"
            checked={formData.isUnpaid}
            onChange={handleInputChange}
            className="mr-3"
          />
          <label className="text-sm font-medium text-gray-700">
            This is an unpaid internship
          </label>
        </div>

        {!formData.isUnpaid && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stipend Amount
              </label>
              <input
                type="number"
                name="stipend.amount"
                value={formData.stipend.amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="stipend.currency"
                value={formData.stipend.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                name="stipend.period"
                value={formData.stipend.period}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Timeline & Additional Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Deadline *
          </label>
          <input
            type="date"
            name="applicationDeadline"
            value={formData.applicationDeadline}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Perks & Benefits
        </label>
        <div className="space-y-2">
          {perkOptions.map(perk => (
            <label key={perk} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.perks.includes(perk)}
                onChange={() => handleArrayInput('perks', perk)}
                className="mr-2"
              />
              {perk}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="hr@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Application Process
        </label>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="applicationProcess"
              value="apply"
              checked={formData.applicationProcess === 'apply'}
              onChange={handleInputChange}
              className="mr-2"
            />
            Applications through JobZee platform
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="applicationProcess"
              value="external"
              checked={formData.applicationProcess === 'external'}
              onChange={handleInputChange}
              className="mr-2"
            />
            External application (redirect to your website)
          </label>
        </div>

        {formData.applicationProcess === 'external' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Application URL
            </label>
            <input
              type="url"
              name="externalUrl"
              value={formData.externalUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://company.com/internship-application"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post New Internship</h1>
          <p className="mt-2 text-gray-600">
            Create an engaging internship opportunity to attract talented students and fresh graduates.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Basic Info</span>
            <span className="text-sm text-gray-600">Description</span>
            <span className="text-sm text-gray-600">Eligibility</span>
            <span className="text-sm text-gray-600">Timeline</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Internship'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployerPostInternship;