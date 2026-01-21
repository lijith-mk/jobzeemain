import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import API_BASE_URL from '../config/api';
const EmployerCreateEvent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'free',
    price: '',
    seatsLimit: '',
    mode: 'online',
    meetingLink: '',
    venueAddress: '',
    startDateTime: '',
    endDateTime: '',
    bannerUrl: '',
    categories: '',
    tags: '',
    visibility: 'public',
    restrictedToRoles: 'jobseeker',
    organizerCompanyName: '',
    organizerEmail: '',
    organizerPhone: '',
    images: ''
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) navigate('/employer/login');
    // Prefill organizer details from employer profile
    (async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/employers/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const profile = data?.employer || data;
        if (res.ok && profile) {
          setForm(prev => ({
            ...prev,
            organizerCompanyName: prev.organizerCompanyName || profile.companyName || '',
            organizerEmail: prev.organizerEmail || profile.companyEmail || profile.contactPersonEmail || '',
            organizerPhone: prev.organizerPhone || profile.companyPhone || profile.contactPersonPhone || ''
          }));
        }
      } catch {}
    })();
  }, [navigate]);

  // Validation functions
  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'title':
        if (!value.trim()) errors.title = 'Event title is required';
        else if (value.trim().length < 3) errors.title = 'Title must be at least 3 characters';
        else if (value.trim().length > 100) errors.title = 'Title must be less than 100 characters';
        break;
        
      case 'description':
        if (!value.trim()) errors.description = 'Event description is required';
        else if (value.trim().length < 10) errors.description = 'Description must be at least 10 characters';
        else if (value.trim().length > 1000) errors.description = 'Description must be less than 1000 characters';
        break;
        
      case 'price':
        if (form.type === 'paid') {
          if (!value) errors.price = 'Price is required for paid events';
          else if (isNaN(value) || Number(value) <= 0) errors.price = 'Price must be a positive number';
          else if (Number(value) > 100000) errors.price = 'Price cannot exceed ₹1,00,000';
        }
        break;
        
      case 'seatsLimit':
        if (value && (isNaN(value) || Number(value) <= 0)) {
          errors.seatsLimit = 'Seats limit must be a positive number';
        } else if (value && Number(value) > 10000) {
          errors.seatsLimit = 'Seats limit cannot exceed 10,000';
        }
        break;
        
      case 'meetingLink':
        if (form.mode === 'online' && !value.trim()) {
          errors.meetingLink = 'Meeting link is required for online events';
        } else if (value && !isValidUrl(value)) {
          errors.meetingLink = 'Please enter a valid URL';
        }
        break;
        
      case 'venueAddress':
        if (form.mode === 'offline' && !value.trim()) {
          errors.venueAddress = 'Venue address is required for offline events';
        } else if (value && value.trim().length < 5) {
          errors.venueAddress = 'Please enter a complete venue address';
        }
        break;
        
      case 'startDateTime':
        if (!value) {
          errors.startDateTime = 'Start date and time is required';
        } else {
          const startDate = new Date(value);
          const now = new Date();
          if (startDate <= now) {
            errors.startDateTime = 'Start date must be in the future';
          }
        }
        break;
        
      case 'endDateTime':
        if (!value) {
          errors.endDateTime = 'End date and time is required';
        } else if (form.startDateTime) {
          const startDate = new Date(form.startDateTime);
          const endDate = new Date(value);
          if (endDate <= startDate) {
            errors.endDateTime = 'End date must be after start date';
          }
        }
        break;
        
      case 'organizerCompanyName':
        if (!value.trim()) errors.organizerCompanyName = 'Company name is required';
        else if (value.trim().length < 2) errors.organizerCompanyName = 'Company name must be at least 2 characters';
        break;
        
      case 'organizerEmail':
        if (!value.trim()) errors.organizerEmail = 'Contact email is required';
        else if (!isValidEmail(value)) errors.organizerEmail = 'Please enter a valid email address';
        break;
        
      case 'organizerPhone':
        if (!value.trim()) errors.organizerPhone = 'Contact phone is required';
        else if (!isValidPhone(value)) errors.organizerPhone = 'Please enter a valid phone number';
        break;
        
      case 'categories':
        if (value && value.split(',').some(cat => cat.trim().length < 2)) {
          errors.categories = 'Each category must be at least 2 characters';
        }
        break;
        
      case 'tags':
        if (value && value.split(',').some(tag => tag.trim().length < 2)) {
          errors.tags = 'Each tag must be at least 2 characters';
        }
        break;
        
      case 'images':
        if (value) {
          const urls = value.split(',').map(url => url.trim()).filter(Boolean);
          if (urls.some(url => !isValidUrl(url))) {
            errors.images = 'Please enter valid image URLs';
          }
        }
        break;
    }
    
    return errors;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const fieldErrors = validateField(name, value);
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem('employerToken');
    const body = new FormData();
    body.append('photo', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/employer/event-banner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body
      });
      const data = await res.json();
      if (data?.bannerUrl) setForm(prev => ({ ...prev, bannerUrl: data.bannerUrl }));
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = useMemo(() => {
    // Check required fields
    if (!form.title || !form.description || !form.startDateTime || !form.endDateTime) return false;
    if (!form.organizerCompanyName || !form.organizerEmail || !form.organizerPhone) return false;
    if (form.type === 'paid' && (!form.price || Number(form.price) <= 0)) return false;
    if (form.mode === 'online' && !form.meetingLink) return false;
    if (form.mode === 'offline' && !form.venueAddress) return false;
    
    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    return !hasErrors;
  }, [form, errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const token = localStorage.getItem('employerToken');
    const payload = {
      ...form,
      price: form.type === 'paid' ? Number(form.price) : 0,
      seatsLimit: form.seatsLimit ? Number(form.seatsLimit) : null,
      categories: form.categories ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      restrictedToRoles: form.visibility === 'restricted' ? [form.restrictedToRoles] : []
    };
    const res = await fetch(`${API_BASE_URL}/api/employers/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Create event failed:', res.status, text);
      alert('Failed to create event. Check console for details.');
      setSubmitting(false);
      return;
    }
    const data = await res.json();
    setSubmitting(false);
    if (data?.success) {
      navigate('/employer/events');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Event Title *</label>
          <input 
            name="title" 
            value={form.title} 
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full border rounded px-3 py-2 ${errors.title && touched.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            placeholder="Data Science Career Webinar" 
          />
          {errors.title && touched.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
        </div>
        {/* Organizer Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name (Organizer) *</label>
            <input 
              name="organizerCompanyName" 
              value={form.organizerCompanyName} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.organizerCompanyName && touched.organizerCompanyName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="Your company name" 
            />
            {errors.organizerCompanyName && touched.organizerCompanyName && (
              <p className="text-red-500 text-xs mt-1">{errors.organizerCompanyName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email *</label>
            <input 
              type="email" 
              name="organizerEmail" 
              value={form.organizerEmail} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.organizerEmail && touched.organizerEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="hr@company.com" 
            />
            {errors.organizerEmail && touched.organizerEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.organizerEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Phone *</label>
            <input 
              name="organizerPhone" 
              value={form.organizerPhone} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.organizerPhone && touched.organizerPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="+91 98765 43210" 
            />
            {errors.organizerPhone && touched.organizerPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.organizerPhone}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full border rounded px-3 py-2 ${errors.description && touched.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            rows={5} 
            placeholder="Describe your event in detail..."
          />
          {errors.description && touched.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {form.type === 'paid' && (
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input 
                type="number" 
                name="price" 
                value={form.price} 
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`w-full border rounded px-3 py-2 ${errors.price && touched.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.price && touched.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Seats Limit (optional)</label>
            <input 
              type="number" 
              name="seatsLimit" 
              value={form.seatsLimit} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.seatsLimit && touched.seatsLimit ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="100"
              min="1"
            />
            {errors.seatsLimit && touched.seatsLimit && (
              <p className="text-red-500 text-xs mt-1">{errors.seatsLimit}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select name="mode" value={form.mode} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          {form.mode === 'online' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link *</label>
              <input 
                name="meetingLink" 
                value={form.meetingLink} 
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`w-full border rounded px-3 py-2 ${errors.meetingLink && touched.meetingLink ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="https://meet.google.com/..." 
              />
              {errors.meetingLink && touched.meetingLink && (
                <p className="text-red-500 text-xs mt-1">{errors.meetingLink}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Venue Address *</label>
              <input 
                name="venueAddress" 
                value={form.venueAddress} 
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`w-full border rounded px-3 py-2 ${errors.venueAddress && touched.venueAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                placeholder="123 Main St, City" 
              />
              {errors.venueAddress && touched.venueAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.venueAddress}</p>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date & Time *</label>
            <input 
              type="datetime-local" 
              name="startDateTime" 
              value={form.startDateTime} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.startDateTime && touched.startDateTime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            />
            {errors.startDateTime && touched.startDateTime && (
              <p className="text-red-500 text-xs mt-1">{errors.startDateTime}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date & Time *</label>
            <input 
              type="datetime-local" 
              name="endDateTime" 
              value={form.endDateTime} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.endDateTime && touched.endDateTime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            />
            {errors.endDateTime && touched.endDateTime && (
              <p className="text-red-500 text-xs mt-1">{errors.endDateTime}</p>
            )}
          </div>
        </div>
        {/* Banner/Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Banner</label>
          <div 
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => document.getElementById('banner-upload').click()}
          >
            {form.bannerUrl ? (
              <div className="relative w-full h-full">
                <img 
                  src={form.bannerUrl} 
                  alt="Event banner" 
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white text-sm mt-1">Click to change</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm">Click to upload event banner</p>
                <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
          <input 
            id="banner-upload"
            type="file" 
            accept="image/*" 
            onChange={handleBannerUpload}
            className="hidden"
          />
          {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categories (comma separated)</label>
            <input 
              name="categories" 
              value={form.categories} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.categories && touched.categories ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="Workshop, Networking" 
            />
            {errors.categories && touched.categories && (
              <p className="text-red-500 text-xs mt-1">{errors.categories}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input 
              name="tags" 
              value={form.tags} 
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`w-full border rounded px-3 py-2 ${errors.tags && touched.tags ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
              placeholder="Career, Data" 
            />
            {errors.tags && touched.tags && (
              <p className="text-red-500 text-xs mt-1">{errors.tags}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <select name="visibility" value={form.visibility} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          {form.visibility === 'restricted' && (
            <div>
              <label className="block text-sm font-medium mb-1">Restricted To</label>
              <select name="restrictedToRoles" value={form.restrictedToRoles} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="jobseeker">Job Seekers</option>
              </select>
            </div>
          )}
        </div>
        <div className="pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(touched).length > 0 && (
                <span className={canSubmit ? 'text-green-600' : 'text-red-600'}>
                  {canSubmit ? '✓ All fields are valid' : 'Please fix the errors above'}
                </span>
              )}
            </div>
            <button 
              type="submit" 
              disabled={!canSubmit || submitting} 
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                canSubmit 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployerCreateEvent;


