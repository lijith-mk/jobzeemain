import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import API_BASE_URL from '../config/api';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const EmployerProfile = () => {
  const [employer, setEmployer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [animate, setAnimate] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    companyEmail: '',
    phone: '',
    website: '',
    companyBio: '',
    companyLogo: '',
    industry: '',
    companySize: '',
    location: '',
    founded: '',
    linkedIn: '',
    twitter: '',
    facebook: '',
    benefits: [],
    companyValues: [],
    workEnvironment: '',
    remotePolicy: '',
    latitude: '',
    longitude: ''
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  const [newBenefit, setNewBenefit] = useState('');
  const [newValue, setNewValue] = useState('');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Construction', 'Transportation', 'Entertainment',
    'Food & Beverage', 'Real Estate', 'Consulting', 'Marketing', 'Other'
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  const remotePolicies = [
    'Fully Remote', 'Hybrid', 'On-site', 'Remote-friendly', 'Flexible'
  ];

  useEffect(() => {
    setAnimate(true);
    fetchEmployerProfile();
  }, []);

  const fetchEmployerProfile = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      if (!token) {
        toast.error('Please log in as an employer');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/employers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployer(data.employer);
        // Persist latest employer data for navbar/session and notify listeners
        try {
          localStorage.setItem('employer', JSON.stringify(data.employer));
          window.dispatchEvent(new Event('user-updated'));
        } catch (_) {}
        setFormData({
          companyName: data.employer.companyName || '',
          contactName: data.employer.contactPersonName || '',
          companyEmail: data.employer.companyEmail || '',
          phone: data.employer.companyPhone || '',
          website: data.employer.website || '',
          companyBio: data.employer.companyDescription || '',
          companyLogo: data.employer.companyLogo || '',
          industry: data.employer.industry || '',
          companySize: data.employer.companySize || '',
          location: data.employer.headquarters?.address || '',
          founded: data.employer.foundedYear || '',
          linkedIn: data.employer.linkedinProfile || '',
          twitter: data.employer.twitterHandle || '',
          facebook: '',
          benefits: data.employer.benefits || [],
          companyValues: data.employer.companyValues || [],
          workEnvironment: data.employer.workCulture || '',
          remotePolicy: '',
          latitude: data.employer.headquarters?.coordinates?.latitude || '',
          longitude: data.employer.headquarters?.coordinates?.longitude || ''
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Initialize Mapbox map and geocoder when editing
  useEffect(() => {
    if (!isEditing) return;
    if (!mapContainerRef.current) return;
    if (!process.env.REACT_APP_MAPBOX_TOKEN) {
      console.warn('Missing REACT_APP_MAPBOX_TOKEN for Mapbox.');
      return;
    }

    // Define resize handler at the top of useEffect so it's in scope for cleanup
    const handleResize = () => {
      try { if (mapRef.current) mapRef.current.resize(); } catch (_) {}
    };

    try {
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

      const initialCenter = [
        formData.longitude ? Number(formData.longitude) : 0,
        formData.latitude ? Number(formData.latitude) : 0
      ];

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: formData.latitude && formData.longitude ? initialCenter : [0, 20],
        zoom: formData.latitude && formData.longitude ? 10 : 1.5
      });
      
      // Force render when map loads and when container size changes
      mapRef.current.on('load', () => {
        try { mapRef.current.resize(); } catch (_) {}
      });
      window.addEventListener('resize', handleResize);

      const marker = new mapboxgl.Marker({ draggable: true });
      if (formData.latitude && formData.longitude) {
        marker.setLngLat(initialCenter).addTo(mapRef.current);
        try { mapRef.current.resize(); } catch (_) {}
      }

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setFormData(prev => ({
          ...prev,
          latitude: lngLat.lat,
          longitude: lngLat.lng
        }));
      });

      geocoderRef.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        marker: false,
        placeholder: 'Search company location'
      });
      mapRef.current.addControl(geocoderRef.current);

      geocoderRef.current.on('result', (e) => {
        const coords = e.result?.center;
        const placeName = e.result?.place_name;
        if (coords && coords.length === 2) {
          const [lng, lat] = coords;
          marker.setLngLat([lng, lat]).addTo(mapRef.current);
          setFormData(prev => ({
            ...prev,
            location: placeName || prev.location,
            latitude: lat,
            longitude: lng
          }));
          mapRef.current.flyTo({ center: [lng, lat], zoom: 12 });
        }
      });

      mapRef.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]).addTo(mapRef.current);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
      });
    } catch (err) {
      console.error('Error initializing Mapbox:', err);
    }

    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        if (geocoderRef.current) {
          geocoderRef.current.off('result');
        }
        if (mapRef.current) {
          mapRef.current.remove();
        }
      } catch (_) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`${API_BASE_URL}/api/upload/employer/company-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.logoUrl;
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingImage(true);

    try {
      const imageUrl = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        companyLogo: imageUrl
      }));
      // Update cached employer and notify navbar immediately
      try {
        const cached = JSON.parse(localStorage.getItem('employer') || '{}');
        localStorage.setItem('employer', JSON.stringify({ ...cached, companyLogo: imageUrl }));
        window.dispatchEvent(new Event('user-updated'));
      } catch (_) {}
      setUploadingImage(false);
      toast.success('Company logo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload company logo');
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('employerToken');
      
      const updateData = {
        companyName: formData.companyName,
        companyPhone: formData.phone,
        contactPersonName: formData.contactName,
        companyDescription: formData.companyBio,
        industry: formData.industry,
        companySize: formData.companySize,
        foundedYear: formData.founded ? parseInt(formData.founded) : undefined,
        headquarters: {
          address: formData.location,
          city: formData.location,
          state: '',
          country: '',
          zipCode: '',
          coordinates: (formData.latitude && formData.longitude) ? {
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude)
          } : undefined
        },
        website: formData.website,
        linkedinProfile: formData.linkedIn,
        twitterHandle: formData.twitter,
        companyValues: formData.companyValues,
        benefits: formData.benefits,
        workCulture: formData.workEnvironment
      };
      
      console.log('🔄 Sending profile update:', updateData);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_BASE_URL}/api/employers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile update successful:', data);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        // Sync local cache from response to reflect immediately in navbar
        try {
          if (data?.employer) {
            setEmployer(data.employer);
            localStorage.setItem('employer', JSON.stringify(data.employer));
            window.dispatchEvent(new Event('user-updated'));
          }
        } catch (_) {}
        
        // Also refresh from server to ensure consistency
        await fetchEmployerProfile();
      } else {
        const errorData = await response.json();
        console.error('❌ Profile update failed:', errorData);
        toast.error(`Failed to update profile: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      toast.error('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addValue = () => {
    if (newValue.trim() && !formData.companyValues.includes(newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        companyValues: [...prev.companyValues, newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const removeValue = (index) => {
    setFormData(prev => ({
      ...prev,
      companyValues: prev.companyValues.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 premium-grid py-8 px-4">
      {/* Header */}
      <div className={`max-w-6xl mx-auto mb-8 transform transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-orange-500 h-32 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute bottom-4 left-6 text-white">
              <h1 className="text-2xl font-bold">Company Profile</h1>
              <p className="text-purple-100">Manage your company information and branding</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className={`lg:col-span-1 transform transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
          <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl p-8 sticky top-8 hover-card">
            {/* Profile Picture */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 p-1 shadow-lg premium-glow">
                  <div className="w-full h-full rounded-full bg-white/90 backdrop-blur flex items-center justify-center overflow-hidden">
                    {formData.companyLogo ? (
                      <img
                        src={formData.companyLogo}
                        alt="Company Logo"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
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
              <h2 className="text-2xl font-bold text-gray-900 mt-4">{formData.companyName || 'Company Name'}</h2>
              <p className="text-gray-600">{formData.industry || 'Industry'}</p>
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
              <div className="premium-gradient rounded-xl p-4 border border-white/30">
                <div className="flex items-center">
                  <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company Size</p>
                    <p className="font-semibold text-gray-900">
                       {formData.companySize ? companySizes.find(size => size.value === formData.companySize)?.label || formData.companySize : 'Not specified'}
                     </p>
                  </div>
                </div>
              </div>
              
              <div className="premium-gradient rounded-xl p-4 border border-white/30">
                <div className="flex items-center">
                  <div className="bg-green-600 text-white p-2 rounded-lg mr-3 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Founded</p>
                    <p className="font-semibold text-gray-900">{formData.founded || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="premium-btn w-full text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-2xl"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="premium-btn w-full text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:transform-none"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                                         onClick={() => {
                       setIsEditing(false);
                       setFormData({
                         companyName: employer?.companyName || '',
                         contactName: employer?.contactPersonName || '',
                         companyEmail: employer?.companyEmail || '',
                         phone: employer?.companyPhone || '',
                         website: employer?.website || '',
                         companyBio: employer?.companyDescription || '',
                         companyLogo: employer?.companyLogo || '',
                         industry: employer?.industry || '',
                         companySize: employer?.companySize || '',
                         location: employer?.headquarters?.address || '',
                         founded: employer?.foundedYear || '',
                         linkedIn: employer?.linkedinProfile || '',
                         twitter: employer?.twitterHandle || '',
                         facebook: '',
                         benefits: employer?.benefits || [],
                         companyValues: employer?.companyValues || [],
                         workEnvironment: employer?.workCulture || '',
                         remotePolicy: ''
                       });
                     }}
                    className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-600 transition-all duration-200 shadow-lg"
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
          <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h3>
            </div>
            
            <div className="p-8 bg-white/60 backdrop-blur">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="Enter company name"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.companyName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="Enter contact person name"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.contactName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.companyEmail}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="https://company.com"
                    />
                  ) : (
                    <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {formData.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200 mb-3"
                        placeholder="Search or type address"
                      />
                      <div ref={mapContainerRef} className="w-full h-72 rounded-xl overflow-hidden border border-gray-200" />
                      <div className="mt-2 text-xs text-gray-500">
                        {formData.latitude && formData.longitude ? (
                          <span>Selected: {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                        ) : (
                          <span>Pick a location on map or use the search bar</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.location || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  {isEditing ? (
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                    >
                      <option value="">Select Industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.industry || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Size</label>
                  {isEditing ? (
                                         <select
                       value={formData.companySize}
                       onChange={(e) => handleInputChange('companySize', e.target.value)}
                       className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                     >
                       <option value="">Select Company Size</option>
                       {companySizes.map((size) => (
                         <option key={size.value} value={size.value}>{size.label}</option>
                       ))}
                     </select>
                  ) : (
                                         <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">
                       {formData.companySize ? companySizes.find(size => size.value === formData.companySize)?.label || formData.companySize : 'Not provided'}
                     </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Founded Year</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.founded}
                      onChange={(e) => handleInputChange('founded', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="2020"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.founded || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remote Policy</label>
                  {isEditing ? (
                    <select
                      value={formData.remotePolicy}
                      onChange={(e) => handleInputChange('remotePolicy', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                    >
                      <option value="">Select Remote Policy</option>
                      {remotePolicies.map((policy) => (
                        <option key={policy} value={policy}>{policy}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">{formData.remotePolicy || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Bio */}
          <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Company Bio
              </h3>
            </div>
            
            <div className="p-8 bg-white/60 backdrop-blur">
              <label className="block text-sm font-semibold text-gray-700 mb-4">Tell us about your company</label>
              {isEditing ? (
                <textarea
                  value={formData.companyBio}
                  onChange={(e) => handleInputChange('companyBio', e.target.value)}
                  rows="6"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200 resize-none"
                  placeholder="Describe your company's mission, vision, and what makes it unique..."
                />
              ) : (
                <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-6 min-h-[120px]">
                  {formData.companyBio ? (
                    <p className="leading-relaxed">{formData.companyBio}</p>
                  ) : (
                    <p className="text-gray-500 italic">No company bio provided</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Benefits & Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Employee Benefits */}
            <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Employee Benefits
                </h3>
              </div>
              
              <div className="p-6 bg-white/60 backdrop-blur">
                {isEditing && (
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                      className="flex-1 border-2 border-gray-200 rounded-l-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                      placeholder="Add a benefit..."
                    />
                    <button
                      onClick={addBenefit}
                      className="bg-purple-600 text-white px-4 py-2 rounded-r-xl hover:bg-purple-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.benefits.length > 0 ? (
                    formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2">
                        <span className="text-gray-800 text-sm">{benefit}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeBenefit(index)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic text-center py-4">No benefits added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Company Values */}
            <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Company Values
                </h3>
              </div>
              
              <div className="p-6 bg-white/60 backdrop-blur">
                {isEditing && (
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addValue()}
                      className="flex-1 border-2 border-gray-200 rounded-l-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-orange-500 transition-colors duration-200"
                      placeholder="Add a value..."
                    />
                    <button
                      onClick={addValue}
                      className="bg-orange-600 text-white px-4 py-2 rounded-r-xl hover:bg-orange-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.companyValues.length > 0 ? (
                    formData.companyValues.map((value, index) => (
                      <div key={index} className="flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2">
                        <span className="text-gray-800 text-sm">{value}</span>
                        {isEditing && (
                          <button
                            onClick={() => removeValue(index)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic text-center py-4">No values added</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Additional Info */}
          <div className="premium-gradient border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Social Media & Links
              </h3>
            </div>
            
            <div className="p-8 bg-white/60 backdrop-blur">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors duration-200"
                      placeholder="https://linkedin.com/company/..."
                    />
                  ) : (
                    <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">
                      {formData.linkedIn ? (
                        <a href={formData.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          LinkedIn
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors duration-200"
                      placeholder="https://twitter.com/..."
                    />
                  ) : (
                    <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">
                      {formData.twitter ? (
                        <a href={formData.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Twitter
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-800 transition-colors duration-200"
                      placeholder="https://facebook.com/..."
                    />
                  ) : (
                    <div className="text-gray-900 bg-gray-50 rounded-xl px-4 py-3">
                      {formData.facebook ? (
                        <a href={formData.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Facebook
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;
