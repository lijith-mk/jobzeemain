import React, { useState, useRef } from 'react';

import API_BASE_URL from '../config/api';
const PhotoUpload = ({ 
  currentPhoto = null, 
  onPhotoUpload = () => {}, 
  type = 'profile', // 'profile' or 'company-logo'
  maxSize = 5, // MB
  className = "" 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentPhoto);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError('');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size should be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append(type === 'company-logo' ? 'file' : 'file', file);

      const endpoint = type === 'company-logo' 
        ? '/api/upload/employer/company-logo'
        : '/api/upload/user/profile-photo';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Call parent callback
      const newUrl = data.photoUrl || data.logoUrl;
      onPhotoUpload(newUrl);

      // Immediately persist to localStorage and notify listeners (e.g., Navbar)
      try {
        if (type === 'company-logo') {
          const cachedEmployer = JSON.parse(localStorage.getItem('employer') || '{}');
          localStorage.setItem('employer', JSON.stringify({ ...cachedEmployer, companyLogo: newUrl }));
        } else {
          const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
          // Support both keys used around the app
          localStorage.setItem('user', JSON.stringify({ ...cachedUser, profilePhoto: newUrl, avatar: newUrl }));
        }
        window.dispatchEvent(new Event('user-updated'));
      } catch (_) {}
      
      // Show success message
      setTimeout(() => {
        setError('');
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
      setPreview(currentPhoto); // Reset preview on error
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!currentPhoto && !preview) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const endpoint = type === 'company-logo' 
        ? '/api/upload/employer/profile-photo'
        : '/api/upload/user/profile-photo';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove photo');
      }

      setPreview(null);
      onPhotoUpload(null);

      // Immediately persist removal and notify listeners
      try {
        if (type === 'company-logo') {
          const cachedEmployer = JSON.parse(localStorage.getItem('employer') || '{}');
          const { companyLogo, ...rest } = cachedEmployer || {};
          localStorage.setItem('employer', JSON.stringify({ ...rest, companyLogo: null }));
        } else {
          const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...cachedUser, profilePhoto: null, avatar: null }));
        }
        window.dispatchEvent(new Event('user-updated'));
      } catch (_) {}
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Remove error:', error);
      setError(error.message || 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : preview
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          /* Photo Preview */
          <div className="relative group">
            <div className="aspect-square w-full max-w-xs mx-auto p-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl m-4 flex items-center justify-center">
                <div className="flex space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Change</span>
                  </button>
                  
                  <button
                    onClick={removePhoto}
                    disabled={uploading}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Upload Interface */
          <div className="p-8 text-center">
            <div className="mb-4">
              {uploading ? (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {uploading ? (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">Uploading...</p>
                <p className="text-sm text-gray-500">Please wait while we process your photo</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {type === 'company-logo' ? 'Upload Company Logo' : 'Upload Profile Photo'}
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag and drop your photo here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-500 font-medium underline"
                  >
                    browse
                  </button>
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                  <span className="bg-gray-100 px-2 py-1 rounded">JPG</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">PNG</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">WebP</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Max {maxSize}MB</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!error && preview && !uploading && currentPhoto !== preview && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-600">Photo uploaded successfully!</p>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
