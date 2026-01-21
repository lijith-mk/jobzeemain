import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SalaryRecommendation from './SalaryRecommendation';

import API_BASE_URL from '../config/api';
const EmployerPostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employer, setEmployer] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    requirements: '',
    benefits: '',
    skills: '',
    remote: 'onsite',
    industry: '',
    applicationDeadline: '',
    testId: '',
    requiresTest: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [availableTests, setAvailableTests] = useState([]);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const [locQuery, setLocQuery] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    const emp = localStorage.getItem('employer');
    if (!token || !emp) {
      navigate('/employer/login');
      return;
    }
    setEmployer(JSON.parse(emp));
    
    // Fetch fresh employer data to ensure we have the latest subscription info
    fetchEmployerData(token);
    
    // Fetch available tests
    fetchAvailableTests(token);
  }, [navigate]);

  const fetchAvailableTests = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer-tests?status=active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableTests(data.tests || []);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    }
  };

  const fetchEmployerData = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const updatedEmployer = {
          ...JSON.parse(localStorage.getItem('employer')),
          subscriptionPlan: data.stats.subscriptionPlan,
          jobPostingLimit: data.stats.jobPostingLimit,
          jobPostingsUsed: data.stats.jobPostingsUsed
        };
        setEmployer(updatedEmployer);
        localStorage.setItem('employer', JSON.stringify(updatedEmployer));
      }
    } catch (err) {
      console.error('Error fetching employer data:', err);
    }
  };

  // Debounced Mapbox geocoding suggestions
  useEffect(() => {
    let active = true;
    const fetchSugg = async () => {
      if (!MAPBOX_TOKEN || !locQuery || locQuery.trim().length < 2) {
        if (active) setLocSuggestions([]);
        return;
      }
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locQuery)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=place,locality,region,country,neighborhood,postcode&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (active) setLocSuggestions(Array.isArray(data.features) ? data.features : []);
      } catch (e) {
        if (active) setLocSuggestions([]);
      }
    };
    const id = setTimeout(fetchSugg, 250);
    return () => { active = false; clearTimeout(id); };
  }, [locQuery, MAPBOX_TOKEN]);

  const pickLocation = (f) => {
    setForm({ ...form, location: f.place_name || '' });
    setLocQuery(f.place_name || '');
    setShowLocSuggestions(false);
  };

  // Comprehensive validation functions
  const validateField = (fieldName, value) => {
    const errors = {};
    
    switch (fieldName) {
      case 'title':
        if (!value || !value.trim()) {
          errors.title = 'Job title is required';
        } else if (value.trim().length < 3) {
          errors.title = 'Job title must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.title = 'Job title must be less than 100 characters';
        }
        break;
        
      case 'description':
        if (!value || !value.trim()) {
          errors.description = 'Job description is required';
        } else if (value.trim().length < 20) {
          errors.description = 'Job description must be at least 20 characters';
        } else if (value.trim().length > 2000) {
          errors.description = 'Job description must be less than 2000 characters';
        }
        break;
        
      case 'location':
        if (!value || !value.trim()) {
          errors.location = 'Location is required';
        } else if (value.trim().length < 2) {
          errors.location = 'Location must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.location = 'Location must be less than 100 characters';
        }
        break;
        
      case 'salaryMin':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          errors.salaryMin = 'Minimum salary must be a positive number';
        } else if (value && form.salaryMax && Number(value) > Number(form.salaryMax)) {
          errors.salaryMin = 'Minimum salary cannot be greater than maximum salary';
        }
        break;
        
      case 'salaryMax':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          errors.salaryMax = 'Maximum salary must be a positive number';
        } else if (value && form.salaryMin && Number(value) < Number(form.salaryMin)) {
          errors.salaryMax = 'Maximum salary cannot be less than minimum salary';
        }
        break;
        
      case 'currency':
        if (value && value.length > 3) {
          errors.currency = 'Currency code must be 3 characters or less';
        }
        break;
        
      case 'requirements':
        if (value && value.trim().length > 500) {
          errors.requirements = 'Requirements must be less than 500 characters';
        }
        break;
        
      case 'benefits':
        if (value && value.trim().length > 500) {
          errors.benefits = 'Benefits must be less than 500 characters';
        }
        break;
        
      case 'skills':
        if (value && value.trim().length > 500) {
          errors.skills = 'Skills must be less than 500 characters';
        }
        break;
        
      case 'industry':
        if (value && value.trim().length > 100) {
          errors.industry = 'Industry must be less than 100 characters';
        }
        break;
        
      case 'applicationDeadline':
        if (value) {
          const deadline = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deadline < today) {
            errors.applicationDeadline = 'Deadline must be in the future';
          }
        }
        break;
    }
    
    return errors;
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate all fields
    Object.keys(form).forEach(field => {
      const fieldErrors = validateField(field, form[field]);
      Object.assign(errors, fieldErrors);
    });
    
    return errors;
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const fieldErrors = validateField(field, form[field]);
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  const toArray = (text) => {
    return text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = Object.keys(form);
    setTouchedFields(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    const token = localStorage.getItem('employerToken');
    if (!token) {
      toast.error('Please login as employer');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      jobType: form.jobType,
      experienceLevel: form.experienceLevel,
      salary: {
        min: form.salaryMin ? Number(form.salaryMin) : undefined,
        max: form.salaryMax ? Number(form.salaryMax) : undefined,
        currency: form.currency || 'USD'
      },
      requirements: toArray(form.requirements),
      benefits: toArray(form.benefits),
      skills: toArray(form.skills),
      remote: form.remote,
      industry: form.industry.trim() || undefined,
      applicationDeadline: form.applicationDeadline || undefined,
      testId: form.testId || undefined,
      requiresTest: form.requiresTest
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/employers/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errorType === 'free_plan_limit_reached') {
          setShowUpgradeModal(true);
        } else {
          toast.error(data.message || 'Failed to create job');
        }
        return;
      }
      toast.success(data.message || 'Job created');
      navigate('/employer/dashboard');
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!employer) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
          <p className="text-gray-600">Fill in the details below to create a new job post.</p>
          
          {/* Plan Status Indicator */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Current Plan: {employer?.subscriptionPlan ? employer.subscriptionPlan.charAt(0).toUpperCase() + employer.subscriptionPlan.slice(1) : 'Free'}
                </span>
              </div>
              <span className="text-sm text-blue-700">
                {employer?.subscriptionPlan === 'free'
                  ? '1 job posting allowed'
                  : (employer?.jobPostingLimit === null || employer?.jobPostingLimit === undefined
                      ? 'Unlimited job postings allowed'
                      : `${employer.jobPostingLimit} job postings allowed`)}
              </span>
            </div>
            {employer?.subscriptionPlan === 'free' && (
              <p className="text-xs text-blue-600 mt-2">
                Upgrade to post more jobs and access premium features
              </p>
            )}
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => handleFieldBlur('title')}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                formErrors.title && touchedFields.title 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="e.g., Senior React Developer"
              maxLength="100"
            />
            {formErrors.title && touchedFields.title && (
              <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
            )}
            <p className={`text-xs mt-1 ${form.title.length > 90 ? 'text-red-500' : 'text-gray-500'}`}>
              {form.title.length}/100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={() => handleFieldBlur('description')}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                formErrors.description && touchedFields.description 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Describe the role, responsibilities, and qualifications"
              maxLength="2000"
            />
            {formErrors.description && touchedFields.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
            <p className={`text-xs mt-1 ${form.description.length > 1800 ? 'text-red-500' : 'text-gray-500'}`}>
              {form.description.length}/2000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <div className="relative">
                <input
                  type="text"
                  value={locQuery || form.location}
                  onChange={(e) => { 
                    setLocQuery(e.target.value); 
                    setShowLocSuggestions(true);
                    handleFieldChange('location', e.target.value);
                  }}
                  onFocus={() => setShowLocSuggestions(true)}
                  onBlur={() => handleFieldBlur('location')}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                    formErrors.location && touchedFields.location 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={MAPBOX_TOKEN ? 'Search location' : 'Search location (set REACT_APP_MAPBOX_TOKEN)'}
                  maxLength="100"
                />
                {showLocSuggestions && locSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                    {locSuggestions.map((f) => (
                      <li
                        key={f.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={(e) => { e.preventDefault(); pickLocation(f); }}
                      >
                        {f.place_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formErrors.location && touchedFields.location && (
                <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
              )}
              <p className={`text-xs mt-1 ${form.location.length > 90 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.location.length}/100 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                value={form.remote}
                onChange={(e)=>setForm({ ...form, remote: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
              <select
                value={form.jobType}
                onChange={(e)=>setForm({ ...form, jobType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
              <select
                value={form.experienceLevel}
                onChange={(e)=>setForm({ ...form, experienceLevel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
                onBlur={() => handleFieldBlur('currency')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.currency && touchedFields.currency 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="USD"
                maxLength="3"
              />
              {formErrors.currency && touchedFields.currency && (
                <p className="text-red-500 text-xs mt-1">{formErrors.currency}</p>
              )}
            </div>
          </div>

          {/* AI Salary Recommendation */}
          <SalaryRecommendation 
            jobData={{
              title: form.title,
              skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
              location: form.location,
              experienceRequired: form.experienceLevel,
              jobType: form.jobType,
              industry: form.industry,
              education: 'Bachelor',
              category: 'technology'
            }}
            onSalarySelect={(salaryData) => {
              setForm({
                ...form,
                salaryMin: salaryData.min.toString(),
                salaryMax: salaryData.max.toString()
              });
              toast.success('Salary range applied!');
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => handleFieldChange('salaryMin', e.target.value)}
                onBlur={() => handleFieldBlur('salaryMin')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.salaryMin && touchedFields.salaryMin 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., 50000"
                min="0"
              />
              {formErrors.salaryMin && touchedFields.salaryMin && (
                <p className="text-red-500 text-xs mt-1">{formErrors.salaryMin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => handleFieldChange('salaryMax', e.target.value)}
                onBlur={() => handleFieldBlur('salaryMax')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.salaryMax && touchedFields.salaryMax 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., 90000"
                min="0"
              />
              {formErrors.salaryMax && touchedFields.salaryMax && (
                <p className="text-red-500 text-xs mt-1">{formErrors.salaryMax}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => handleFieldChange('skills', e.target.value)}
                onBlur={() => handleFieldBlur('skills')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.skills && touchedFields.skills 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="React, Node.js, MongoDB"
                maxLength="500"
              />
              {formErrors.skills && touchedFields.skills && (
                <p className="text-red-500 text-xs mt-1">{formErrors.skills}</p>
              )}
              <p className={`text-xs mt-1 ${form.skills.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.skills.length}/500 characters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => handleFieldChange('industry', e.target.value)}
                onBlur={() => handleFieldBlur('industry')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.industry && touchedFields.industry 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="e.g., Software Development, Healthcare"
                maxLength="100"
              />
              {formErrors.industry && touchedFields.industry && (
                <p className="text-red-500 text-xs mt-1">{formErrors.industry}</p>
              )}
              <p className={`text-xs mt-1 ${form.industry.length > 90 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.industry.length}/100 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
              <input
                type="date"
                value={form.applicationDeadline}
                onChange={(e) => handleFieldChange('applicationDeadline', e.target.value)}
                onBlur={() => handleFieldBlur('applicationDeadline')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.applicationDeadline && touchedFields.applicationDeadline 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {formErrors.applicationDeadline && touchedFields.applicationDeadline && (
                <p className="text-red-500 text-xs mt-1">{formErrors.applicationDeadline}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (comma separated)</label>
              <input
                type="text"
                value={form.requirements}
                onChange={(e) => handleFieldChange('requirements', e.target.value)}
                onBlur={() => handleFieldBlur('requirements')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.requirements && touchedFields.requirements 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="3+ years experience, Strong JS"
                maxLength="500"
              />
              {formErrors.requirements && touchedFields.requirements && (
                <p className="text-red-500 text-xs mt-1">{formErrors.requirements}</p>
              )}
              <p className={`text-xs mt-1 ${form.requirements.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.requirements.length}/500 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (comma separated)</label>
              <input
                type="text"
                value={form.benefits}
                onChange={(e) => handleFieldChange('benefits', e.target.value)}
                onBlur={() => handleFieldBlur('benefits')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  formErrors.benefits && touchedFields.benefits 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Health insurance, Remote stipend"
                maxLength="500"
              />
              {formErrors.benefits && touchedFields.benefits && (
                <p className="text-red-500 text-xs mt-1">{formErrors.benefits}</p>
              )}
              <p className={`text-xs mt-1 ${form.benefits.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {form.benefits.length}/500 characters
              </p>
            </div>
          </div>

          {/* Assessment Test Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📝</span>
              Assessment Test (Optional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Require candidates to complete an assessment test before applying to this job.
            </p>
            
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresTest}
                  onChange={(e) => setForm({...form, requiresTest: e.target.checked, testId: e.target.checked ? form.testId : ''})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Require assessment test for this job
                </span>
              </label>
            </div>

            {form.requiresTest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Test <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.testId}
                  onChange={(e) => setForm({...form, testId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={form.requiresTest}
                >
                  <option value="">Select a test...</option>
                  {availableTests.map((test) => (
                    <option key={test._id} value={test._id}>
                      {test.title} ({test.questions?.length || 0} questions, {test.duration} min)
                    </option>
                  ))}
                </select>
                {availableTests.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    No active tests available.{' '}
                    <a href="/employer/tests/create" className="underline ml-1 font-semibold">
                      Create one now
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employer/dashboard')}
              className="px-4 py-2 rounded border"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(formErrors).length > 0}
              className={`px-5 py-2 rounded text-white ${
                loading || Object.keys(formErrors).length > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Job'}
            </button>
          </div>
        </form>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan Limit Reached</h3>
              <p className="text-gray-600 mb-6">
                Your free plan allows only 1 job posting. To post more jobs and unlock additional features, please upgrade your plan.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // Navigate to upgrade page or contact support
                    toast.info('Please contact support to upgrade your plan');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Upgrade Plan
                </button>
                
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerPostJob;
