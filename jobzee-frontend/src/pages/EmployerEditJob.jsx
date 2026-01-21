import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const EmployerEditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employer, setEmployer] = useState(null);
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
    remote: 'onsite'
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    const emp = localStorage.getItem('employer');
    if (!token || !emp) {
      navigate('/employer/login');
      return;
    }
    setEmployer(JSON.parse(emp));
    fetchJob(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchJob = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        toast.error('Failed to load job');
        navigate('/employer/my-jobs');
        return;
      }
      const data = await res.json();
      const job = data.job || data; // support either shape
      setForm({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        jobType: job.jobType || 'full-time',
        experienceLevel: job.experienceLevel || 'entry',
        salaryMin: job.salary?.min ?? '',
        salaryMax: job.salary?.max ?? '',
        currency: job.salary?.currency || 'USD',
        requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || ''),
        benefits: Array.isArray(job.benefits) ? job.benefits.join(', ') : (job.benefits || ''),
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || ''),
        remote: job.remote || 'onsite'
      });
    } catch (e) {
      toast.error('Network error while loading job');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error as user types
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'title':
        if (!value || !String(value).trim()) return 'Job title is required';
        if (String(value).trim().length < 3) return 'Job title must be at least 3 characters';
        return '';
      case 'description':
        if (!value || !String(value).trim()) return 'Job description is required';
        if (String(value).trim().length < 20) return 'Description must be at least 20 characters';
        return '';
      case 'location':
        if (!value || !String(value).trim()) return 'Location is required';
        return '';
      case 'jobType':
        if (!value) return 'Job type is required';
        return '';
      case 'experienceLevel':
        if (!value) return 'Experience level is required';
        return '';
      case 'salaryMin': {
        if (value === '' || value === null || value === undefined) return '';
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return 'Minimum salary must be a positive number';
        if (form.salaryMax !== '' && !Number.isNaN(Number(form.salaryMax)) && n > Number(form.salaryMax)) {
          return 'Minimum salary cannot be greater than maximum salary';
        }
        return '';
      }
      case 'salaryMax': {
        if (value === '' || value === null || value === undefined) return '';
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return 'Maximum salary must be a positive number';
        if (form.salaryMin !== '' && !Number.isNaN(Number(form.salaryMin)) && n < Number(form.salaryMin)) {
          return 'Maximum salary cannot be less than minimum salary';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleFocus = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    if (err) setFormErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    if (err) setFormErrors(prev => ({ ...prev, [field]: err }));
  };

  const toArray = (text) => text.split(',').map(s => s.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('employerToken');
    if (!token) { toast.error('Please login as employer'); return; }

    // Validate required fields before submit
    const requiredFields = ['title', 'description', 'location', 'jobType', 'experienceLevel'];
    const nextErrors = {};
    requiredFields.forEach(f => {
      const e = validateField(f, form[f]);
      if (e) nextErrors[f] = e;
    });
    // Validate min/max salary relation/values if present
    ['salaryMin', 'salaryMax'].forEach((f) => {
      const e = validateField(f, form[f]);
      if (e) nextErrors[f] = e;
    });
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setTouched(requiredFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
      toast.error('Please fix validation errors');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      jobType: form.jobType,
      experienceLevel: form.experienceLevel,
      salary: {
        min: form.salaryMin === '' ? undefined : Number(form.salaryMin),
        max: form.salaryMax === '' ? undefined : Number(form.salaryMax),
        currency: form.currency || 'USD'
      },
      requirements: toArray(form.requirements),
      benefits: toArray(form.benefits),
      skills: toArray(form.skills),
      remote: form.remote
    };

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/employers/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Failed to update job'); return; }
      toast.success(data.message || 'Job updated');
      navigate('/employer/my-jobs');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-gray-600">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!employer) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-600">Update the details for this job post.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              value={form.title}
              onFocus={() => handleFocus('title')}
              onBlur={() => handleBlur('title')}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.title && touched.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="e.g., Senior React Developer"
              maxLength="100"
              required
            />
            {formErrors.title && touched.title && (
              <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              rows={6}
              value={form.description}
              onFocus={() => handleFocus('description')}
              onBlur={() => handleBlur('description')}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.description && touched.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="Describe the role, responsibilities, and qualifications"
              maxLength="2000"
              required
            />
            {formErrors.description && touched.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                value={form.location}
                onFocus={() => handleFocus('location')}
                onBlur={() => handleBlur('location')}
                onChange={(e) => handleChange('location', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.location && touched.location ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="City, Country"
                maxLength="100"
                required
              />
              {formErrors.location && touched.location && (
                <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                value={form.remote}
                onChange={(e)=>handleChange('remote', e.target.value)}
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
                onFocus={() => handleFocus('jobType')}
                onBlur={() => handleBlur('jobType')}
                onChange={(e)=>handleChange('jobType', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.jobType && touched.jobType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
              {formErrors.jobType && touched.jobType && (
                <p className="text-red-500 text-xs mt-1">{formErrors.jobType}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
              <select
                value={form.experienceLevel}
                onFocus={() => handleFocus('experienceLevel')}
                onBlur={() => handleBlur('experienceLevel')}
                onChange={(e)=>handleChange('experienceLevel', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.experienceLevel && touched.experienceLevel ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
              {formErrors.experienceLevel && touched.experienceLevel && (
                <p className="text-red-500 text-xs mt-1">{formErrors.experienceLevel}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="USD"
                maxLength="3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
              <input
                type="number"
                value={form.salaryMin}
                onFocus={() => handleFocus('salaryMin')}
                onBlur={() => handleBlur('salaryMin')}
                onChange={(e) => handleChange('salaryMin', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.salaryMin && touched.salaryMin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="e.g., 50000"
                min="0"
              />
              {formErrors.salaryMin && touched.salaryMin && (
                <p className="text-red-500 text-xs mt-1">{formErrors.salaryMin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
              <input
                type="number"
                value={form.salaryMax}
                onFocus={() => handleFocus('salaryMax')}
                onBlur={() => handleBlur('salaryMax')}
                onChange={(e) => handleChange('salaryMax', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.salaryMax && touched.salaryMax ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder="e.g., 90000"
                min="0"
              />
              {formErrors.salaryMax && touched.salaryMax && (
                <p className="text-red-500 text-xs mt-1">{formErrors.salaryMax}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => handleChange('skills', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="React, Node.js, MongoDB"
                maxLength="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (comma separated)</label>
              <input
                type="text"
                value={form.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="3+ years experience, Strong JS"
                maxLength="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (comma separated)</label>
              <input
                type="text"
                value={form.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                placeholder="Health insurance, Remote stipend"
                maxLength="500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employer/my-jobs')}
              className="px-4 py-2 rounded border"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2 rounded text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployerEditJob;


