import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { validateEmail, validatePhone, FormValidator } from '../utils/validationUtils';
import SalaryPrediction from './SalaryPrediction';

import API_BASE_URL from '../config/api';
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [animate, setAnimate] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    location: '',
    bio: '',
    profilePicture: '',
    title: '',
    experience: '',
    education: '',
    skills: [],
    languages: [],
    portfolio: '',
    github: '',
    linkedIn: '',
    twitter: '',
    website: '',
    resume: '',
    preferences: {
      jobType: '',
      salaryRange: '',
      availability: '',
      remotePreference: '',
      industries: []
    },
    achievements: [],
    certifications: []
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [showMandatoryFieldsPopup, setShowMandatoryFieldsPopup] = useState(false);
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
  const [locQuery, setLocQuery] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);

  // Validate mandatory fields
  const validateMandatoryFields = () => {
    const mandatoryFields = ['name', 'email', 'phone', 'country'];
    const missingFields = [];
    
    mandatoryFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        mandatory: `Please fill in the following required fields: ${missingFields.join(', ')}`
      }));
      return false;
    }
    
    return true;
  };

  // Auto-logout on page close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (3-5 years)',
    'Senior Level (6-10 years)',
    'Expert Level (10+ years)'
  ];

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'
  ];

  const availabilities = [
    'Immediately', 'Within 2 weeks', 'Within 1 month', 'Within 3 months'
  ];

  const remotePreferences = [
    'Fully Remote', 'Hybrid', 'On-site', 'Remote-friendly', 'Flexible'
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Construction', 'Transportation', 'Entertainment',
    'Food & Beverage', 'Real Estate', 'Consulting', 'Marketing', 'Other'
  ];

  const salaryRanges = [
    '$30k - $50k', '$50k - $75k', '$75k - $100k', 
    '$100k - $150k', '$150k - $200k', '$200k+'
  ];

  useEffect(() => {
    setAnimate(true);
    fetchUserProfile();
  }, []);

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
    setFormData({ ...formData, location: f.place_name || '' });
    setLocQuery(f.place_name || '');
    setShowLocSuggestions(false);
  };

  // Observe sections to highlight active header tab while scrolling
  useEffect(() => {
    const sectionIds = ['basic', 'bio', 'skills', 'prefs'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        // When top 30% of a section is visible, consider it active
        rootMargin: '0px 0px -70% 0px',
        threshold: 0.1
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleTabClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          country: data.user.country || '',
          location: data.user.location || '',
          bio: data.user.bio || '',
          profilePicture: data.user.profilePhoto || '', // Fixed mapping
          title: data.user.title || '',
          experience: data.user.experience || '',
          education: data.user.education || '',
          skills: data.user.skills || [],
          languages: data.user.languages || [],
          portfolio: data.user.portfolio || '',
          github: data.user.socialMedia?.github || '',
          linkedIn: data.user.socialMedia?.linkedIn || '',
          twitter: data.user.socialMedia?.twitter || '',
          website: data.user.website || '',
          resume: data.user.resume || '',
          preferences: {
            jobType: data.user.preferences?.jobType || '',
            salaryRange: data.user.preferences?.salaryRange || '',
            availability: data.user.preferences?.availability || '',
            remotePreference: data.user.preferences?.remotePreference || '',
            industries: data.user.preferences?.industries || []
          },
          achievements: data.user.achievements || [],
          certifications: data.user.certifications || [],
          // Add the new profile fields
          experienceLevel: data.user.experienceLevel || '',
          expectedSalary: {
            min: data.user.expectedSalary?.min || '',
            max: data.user.expectedSalary?.max || '',
            currency: data.user.expectedSalary?.currency || 'USD'
          },
          remotePreference: data.user.remotePreference || '',
          preferredJobTypes: data.user.preferredJobTypes || [],
          workAuthorization: data.user.workAuthorization || '',
          willingToRelocate: data.user.willingToRelocate || false,
          noticePeriod: data.user.noticePeriod || ''
        });
      } else {
        toast.error('Failed to fetch profile');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload/user/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.photoUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingImage(true);

    try {
      const imageUrl = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      // Update cached user immediately and notify listeners (e.g., Navbar)
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...cached, profilePhoto: imageUrl, avatar: imageUrl }));
        window.dispatchEvent(new Event('user-updated'));
      } catch (_) {}
      toast.success('Profile photo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload profile photo');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume size should be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid resume file (PDF, DOC, DOCX)');
      return;
    }

    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload/user/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          resume: data.resumeUrl
        }));
        toast.success('Resume uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSave = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate mandatory fields first
    if (!validateMandatoryFields()) {
      setShowMandatoryFieldsPopup(true);
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          socialMedia: {
            github: formData.github,
            linkedIn: formData.linkedIn,
            twitter: formData.twitter
          }
        })
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        await fetchUserProfile();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim() && !formData.achievements.includes(newAchievement.trim())) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const toggleIndustry = (industry) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        industries: prev.preferences.industries.includes(industry)
          ? prev.preferences.industries.filter(i => i !== industry)
          : [...prev.preferences.industries, industry]
      }
    }));
  };
  
  // Enhanced validation handlers
  const validatePhoneField = (phone, onFocus = false) => {
    const validation = validatePhone(phone, { region: 'IN' }); // Default to India
    setValidationErrors(prev => ({
      ...prev,
      phone: validation.errors
    }));
    return validation;
  };
  
  const handlePhoneChange = (value) => {
    handleInputChange('phone', value);
    if (fieldTouched.phone) {
      validatePhoneField(value);
    }
  };
  
  const handlePhoneFocus = () => {
    setFieldTouched(prev => ({ ...prev, phone: true }));
    validatePhoneField(formData.phone, true);
  };
  
  const handlePhoneBlur = () => {
    validatePhoneField(formData.phone);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20">
          <div className="animate-pulse space-y-4">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto"></div>
            <div className="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-white/20 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-white/20 rounded"></div>
              <div className="h-4 bg-white/20 rounded w-5/6"></div>
              <div className="h-4 bg-white/20 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-10 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>
      </div>
      {/* Header */}
      <div className={`max-w-6xl mx-auto mb-8 transform transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="rounded-xl shadow-sm ring-1 ring-black/5 bg-white/80 backdrop-blur px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-emerald-500"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">{formData.name || 'My Profile'}</h1>
                <p className="text-xs text-gray-500">{formData.title || 'Manage your information and preferences'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {[
                { id: 'basic', label: 'Basic' },
                { id: 'bio', label: 'Bio' },
                { id: 'skills', label: 'Skills' },
                { id: 'prefs', label: 'Preferences' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3 py-1 rounded-full ring-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    activeSection === tab.id
                      ? 'bg-indigo-600 text-white ring-indigo-600 shadow-sm'
                      : 'ring-gray-200 text-gray-700 hover:ring-indigo-200 hover:text-indigo-700 bg-white/60'
                  }`}
                  aria-current={activeSection === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className={`lg:col-span-1 space-y-8 transform transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
          {/* Sticky Profile Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 lg:sticky lg:top-24 ring-1 ring-black/5">
            {/* Profile Picture */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 p-[3px] shadow-xl">
                  <div className="w-full h-full rounded-full bg-white/90 backdrop-blur flex items-center justify-center overflow-hidden">
                    {formData.profilePicture ? (
                      <img
                        src={formData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-4 tracking-tight">{formData.name || 'Your Name'}</h2>
              <p className="text-gray-600">{formData.title || 'Professional Title'}</p>
              <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formData.location || 'Location'}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl p-4 ring-1 ring-black/5">
                <div className="flex items-center">
                  <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience Level</p>
                    <p className="font-semibold text-gray-900">{formData.experience || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-purple-50 rounded-xl p-4 ring-1 ring-black/5">
                <div className="flex items-center">
                  <div className="bg-green-500 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Skills</p>
                    <p className="font-semibold text-gray-900">{formData.skills.length} skills</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl p-4 ring-1 ring-black/5">
                <div className="flex items-center">
                  <div className="bg-purple-500 text-white p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resume</p>
                    <p className="font-semibold text-gray-900">{formData.resume ? 'Uploaded' : 'Not uploaded'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Salary Prediction */}
            <SalaryPrediction />
          </div>
          
          {/* Scrollable Resume Upload Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 ring-1 ring-black/5">
            {/* Resume Upload */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 ring-1 ring-black/5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Resume/CV</h3>
                {formData.resume ? (
                  <div className="flex items-center justify-between bg-white/90 backdrop-blur rounded-lg p-3 ring-1 ring-black/5">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resume.pdf</p>
                        <p className="text-xs text-gray-500">Uploaded successfully</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={formData.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                      {isEditing && (
                        <button
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={uploadingResume}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50"
                        >
                          {uploadingResume ? 'Uploading...' : 'Replace'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 text-sm mb-3">No resume uploaded</p>
                    {isEditing && (
                      <button
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={uploadingResume}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 shadow"
                      >
                        {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX (Max: 10MB)</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02] shadow-xl"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-xl disabled:opacity-50 disabled:transform-none"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchUserProfile();
                    }}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`lg:col-span-2 space-y-8 transform transition-all duration-700 delay-400 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          {/* Basic Information */}
          <div id="basic" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6">
              <h3 className="text-xl font-extrabold text-white flex items-center tracking-wide">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h3>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 bg-white/70"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 bg-white/70"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.title || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onFocus={handlePhoneFocus}
                        onBlur={handlePhoneBlur}
                        className={`w-full border rounded-xl px-4 py-3 text-gray-800 focus:outline-none transition-all duration-200 bg-white/70 ${
                          validationErrors.phone && validationErrors.phone.length > 0 && fieldTouched.phone
                            ? 'border-red-400 focus:border-transparent focus:ring-4 focus:ring-red-200'
                            : 'border-gray-200 focus:border-transparent focus:ring-4 focus:ring-indigo-200'
                        }`}
                        placeholder="Enter phone number (e.g., +91 9876543210)"
                      />
                      {validationErrors.phone && validationErrors.phone.length > 0 && fieldTouched.phone && (
                        <div className="mt-1 text-sm text-red-600">
                          {validationErrors.phone.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        <span>💡 India format: +91 XXXXXXXXXX or XXXXXXXXXX</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  {isEditing ? (
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 bg-white/70"
                    >
                      <option value="">Select Country</option>
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="India">India</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.country || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={locQuery || formData.location}
                        onChange={(e) => { setLocQuery(e.target.value); setShowLocSuggestions(true); }}
                        onFocus={() => setShowLocSuggestions(true)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 bg-white/70"
                        placeholder={MAPBOX_TOKEN ? "Search location" : "Search location (set REACT_APP_MAPBOX_TOKEN)"}
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
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.location || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                  {isEditing ? (
                    <select
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 bg-white/70"
                    >
                      <option value="">Select Experience Level</option>
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3 ring-1 ring-black/5">{formData.experience || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div id="bio" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 px-8 py-6">
              <h3 className="text-xl font-extrabold text-white flex items-center tracking-wide">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Professional Bio
              </h3>
            </div>
            
            <div className="p-8">
              <label className="block text-sm font-semibold text-gray-700 mb-4">Tell us about yourself</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows="6"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 resize-none bg-white/70"
                  placeholder="Describe your professional background, achievements, and career goals..."
                />
              ) : (
                <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-6 min-h-[120px] ring-1 ring-black/5">
                  {formData.bio ? (
                    <p className="leading-relaxed">{formData.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">No bio provided</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Skills & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills */}
            <div id="skills" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
              <div className="bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-4">
                <h3 className="text-lg font-extrabold text-white flex items-center tracking-wide">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Skills
                </h3>
              </div>
              
              <div className="p-6">
                {isEditing && (
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 border border-gray-200 rounded-l-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-violet-200 transition-all duration-200 bg-white/70"
                      placeholder="Add a skill..."
                    />
                    <button
                      onClick={addSkill}
                      className="bg-violet-600 text-white px-4 py-2 rounded-r-xl hover:bg-violet-700 transition-all duration-200 shadow"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center bg-violet-50 text-violet-800 px-3 py-1 rounded-full text-sm ring-1 ring-black/5">
                          <span>{skill}</span>
                          {isEditing && (
                            <button
                              onClick={() => removeSkill(index)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic text-center py-4">No skills added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
              <div className="bg-gradient-to-r from-orange-600 to-rose-600 px-6 py-4">
                <h3 className="text-lg font-extrabold text-white flex items-center tracking-wide">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Languages
                </h3>
              </div>
              
              <div className="p-6">
                {isEditing && (
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                      className="flex-1 border border-gray-200 rounded-l-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-orange-200 transition-all duration-200 bg-white/70"
                      placeholder="Add a language..."
                    />
                    <button
                      onClick={addLanguage}
                      className="bg-orange-600 text-white px-4 py-2 rounded-r-xl hover:bg-orange-700 transition-all duration-200 shadow"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.languages.map((language, index) => (
                        <div key={index} className="flex items-center bg-orange-50 text-orange-800 px-3 py-1 rounded-full text-sm ring-1 ring-black/5">
                          <span>{language}</span>
                          {isEditing && (
                            <button
                              onClick={() => removeLanguage(index)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic text-center py-4">No languages added</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job Preferences */}
          <div id="prefs" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h3 className="text-xl font-extrabold text-white flex items-center tracking-wide">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Job Preferences
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Expected Salary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min Salary</label>
                  <input
                    type="number"
                    value={formData.expectedSalary?.min || ''}
                    onChange={(e) => handleInputChange('expectedSalary', { ...formData.expectedSalary, min: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                    placeholder="Min salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Salary</label>
                  <input
                    type="number"
                    value={formData.expectedSalary?.max || ''}
                    onChange={(e) => handleInputChange('expectedSalary', { ...formData.expectedSalary, max: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                    placeholder="Max salary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <select
                    value={formData.expectedSalary?.currency || 'USD'}
                    onChange={(e) => handleInputChange('expectedSalary', { ...formData.expectedSalary, currency: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              {/* Remote Preference */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remote Preference</label>
                <select
                  value={formData.remotePreference || ''}
                  onChange={(e) => handleInputChange('remotePreference', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                >
                  <option value="">Select preference</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                  <option value="any">Any</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={locQuery || formData.location || ''}
                    onChange={(e) => { setLocQuery(e.target.value); setShowLocSuggestions(true); }}
                    onFocus={() => setShowLocSuggestions(true)}
                    disabled={!isEditing}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                    placeholder={MAPBOX_TOKEN ? "Search location" : "Search location (set REACT_APP_MAPBOX_TOKEN)"}
                  />
                  {showLocSuggestions && locSuggestions.length > 0 && isEditing && (
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
              </div>

              {/* Job Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Job Types</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferredJobTypes?.includes(type) || false}
                        onChange={(e) => {
                          const currentTypes = formData.preferredJobTypes || [];
                          if (e.target.checked) {
                            handleInputChange('preferredJobTypes', [...currentTypes, type]);
                          } else {
                            handleInputChange('preferredJobTypes', currentTypes.filter(t => t !== type));
                          }
                        }}
                        disabled={!isEditing}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Authorization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Authorization</label>
                <select
                  value={formData.workAuthorization || ''}
                  onChange={(e) => handleInputChange('workAuthorization', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                >
                  <option value="">Select authorization</option>
                  <option value="citizen">Citizen</option>
                  <option value="permanent-resident">Permanent Resident</option>
                  <option value="work-visa">Work Visa</option>
                  <option value="student-visa">Student Visa</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Willing to Relocate */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.willingToRelocate || false}
                    onChange={(e) => handleInputChange('willingToRelocate', e.target.checked)}
                    disabled={!isEditing}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-semibold text-gray-700">Willing to relocate</span>
                </label>
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notice Period</label>
                <select
                  value={formData.noticePeriod || ''}
                  onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                  disabled={!isEditing}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-transparent focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:bg-gray-100 bg-white/70"
                >
                  <option value="">Select notice period</option>
                  <option value="immediate">Immediate</option>
                  <option value="15-days">15 days</option>
                  <option value="30-days">30 days</option>
                  <option value="60-days">60 days</option>
                  <option value="90-days">90 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Fields Popup */}
      {showMandatoryFieldsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Required Fields Missing</h3>
              <p className="text-gray-600">Please fill in the following required fields to continue:</p>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">{validationErrors.mandatory}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowMandatoryFieldsPopup(false)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Got it, I'll fill them
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 transform z-50">
          <div className="premium-gradient border border-white/30 backdrop-blur-xl rounded-2xl shadow-2xl px-4 sm:px-6 py-3 flex items-center space-x-3">
            <button
              onClick={() => {
                setIsEditing(false);
                fetchUserProfile();
              }}
              className="bg-white/70 hover:bg-white text-gray-800 px-4 sm:px-5 py-2 rounded-xl font-semibold transition-all duration-200 ring-1 ring-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="premium-btn text-white px-5 sm:px-6 py-2 rounded-xl font-bold shadow-xl disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
