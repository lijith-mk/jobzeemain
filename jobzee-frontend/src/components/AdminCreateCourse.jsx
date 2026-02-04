import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminCreateCourse.css';

const AdminCreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingInstructorPhoto, setUploadingInstructorPhoto] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [instructorPhotoPreview, setInstructorPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    skillCategory: 'technical',
    category: 'web-development',
    targetJobRoles: '',
    level: 'beginner',
    skills: '',
    duration: '',
    prerequisites: '',
    instructorName: '',
    instructorBio: '',
    instructorPhoto: '',
    tags: '',
    isPaid: false,
    price: '',
    currency: 'INR',
    discountPrice: '',
    isActive: true
  });

  const skillCategories = [
    { value: 'technical', label: 'Technical' },
    { value: 'business', label: 'Business' },
    { value: 'creative', label: 'Creative' },
    { value: 'communication', label: 'Communication' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'other', label: 'Other' }
  ];

  const categories = [
    { value: 'web-development', label: 'Web Development' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'mobile-development', label: 'Mobile Development' },
    { value: 'cloud-computing', label: 'Cloud Computing' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'soft-skills', label: 'Soft Skills' },
    { value: 'other', label: 'Other' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingThumbnail(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('photo', file);

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/upload/admin/course-thumbnail`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFormData(prev => ({ ...prev, thumbnail: data.imageUrl }));
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast.error('Failed to upload thumbnail');
      setThumbnailPreview(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleInstructorPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setInstructorPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingInstructorPhoto(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('photo', file);

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/upload/admin/instructor-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFormData(prev => ({ ...prev, instructorPhoto: data.imageUrl }));
      toast.success('Instructor photo uploaded successfully!');
    } catch (error) {
      console.error('Instructor photo upload error:', error);
      toast.error('Failed to upload instructor photo');
      setInstructorPhotoPreview(null);
    } finally {
      setUploadingInstructorPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare data
      const courseData = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail || undefined,
        skillCategory: formData.skillCategory,
        category: formData.category,
        targetJobRoles: formData.targetJobRoles ? formData.targetJobRoles.split(',').map(r => r.trim()) : [],
        level: formData.level,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        duration: formData.duration ? Number(formData.duration) : 0,
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()) : [],
        instructor: {
          name: formData.instructorName || undefined,
          bio: formData.instructorBio || undefined,
          photo: formData.instructorPhoto || undefined
        },
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        isPaid: formData.isPaid,
        price: formData.isPaid && formData.price ? Number(formData.price) : 0,
        currency: formData.currency || 'INR',
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        isActive: formData.isActive,
        modules: [] // Empty initially, lessons will be added separately
      };

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/courses`,
        courseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Course created successfully!');
      navigate(`/admin/courses/${data.course._id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-create-course-container">
      <div className="admin-create-course-header">
        <button className="back-btn" onClick={() => navigate('/admin/courses')}>
          ← Back to Courses
        </button>
        <h1>Create New Course</h1>
        <p>Set up a new course. You'll add lessons in the next step.</p>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Full Stack Web Development Bootcamp"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this course..."
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>Course Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              disabled={uploadingThumbnail}
              className="file-input"
            />
            {uploadingThumbnail && (
              <div className="upload-progress">
                <span>Uploading thumbnail...</span>
              </div>
            )}
            {thumbnailPreview && (
              <div className="image-preview">
                <img src={thumbnailPreview} alt="Thumbnail preview" />
                <p className="text-success">✓ Thumbnail uploaded</p>
              </div>
            )}
            <small>Upload a course thumbnail image (Max 5MB, JPG/PNG)</small>
          </div>
        </div>

        {/* Classification */}
        <div className="form-section">
          <h2>Classification</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Skill Category *</label>
              <select name="skillCategory" value={formData.skillCategory} onChange={handleChange}>
                {skillCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>General Category *</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty Level *</label>
            <select name="level" value={formData.level} onChange={handleChange}>
              {difficultyLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Target Job Roles</label>
            <input
              type="text"
              name="targetJobRoles"
              value={formData.targetJobRoles}
              onChange={handleChange}
              placeholder="Full Stack Developer, Frontend Developer, Backend Developer (comma-separated)"
            />
            <small>Enter job roles this course prepares students for (comma-separated)</small>
          </div>

          <div className="form-group">
            <label>Skills Covered</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB, Express (comma-separated)"
            />
            <small>Enter specific skills covered in this course (comma-separated)</small>
          </div>
        </div>

        {/* Course Details */}
        <div className="form-section">
          <h2>Course Details</h2>
          
          <div className="form-group">
            <label>Estimated Duration (hours)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="40"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Prerequisites</label>
            <input
              type="text"
              name="prerequisites"
              value={formData.prerequisites}
              onChange={handleChange}
              placeholder="Basic JavaScript, HTML/CSS (comma-separated)"
            />
            <small>What should students know before taking this course? (comma-separated)</small>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="javascript, web development, beginner-friendly (comma-separated)"
            />
            <small>Add tags to help students find this course (comma-separated)</small>
          </div>
        </div>

        {/* Instructor Information */}
        <div className="form-section">
          <h2>Instructor Information (Optional)</h2>
          
          <div className="form-group">
            <label>Instructor Name</label>
            <input
              type="text"
              name="instructorName"
              value={formData.instructorName}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label>Instructor Bio</label>
            <textarea
              name="instructorBio"
              value={formData.instructorBio}
              onChange={handleChange}
              placeholder="Brief bio about the instructor..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Instructor Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleInstructorPhotoUpload}
              disabled={uploadingInstructorPhoto}
              className="file-input"
            />
            {uploadingInstructorPhoto && (
              <div className="upload-progress">
                <span>Uploading photo...</span>
              </div>
            )}
            {instructorPhotoPreview && (
              <div className="image-preview">
                <img src={instructorPhotoPreview} alt="Instructor preview" />
                <p className="text-success">✓ Photo uploaded</p>
              </div>
            )}
            <small>Upload instructor photo (Max 5MB, JPG/PNG)</small>
          </div>
        </div>

        {/* Visibility */}
        <div className="form-section">
          <h2>Visibility</h2>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span>Active (visible to students)</span>
            </label>
            <small>Uncheck to save as draft</small>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h2>Pricing</h2>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
              />
              <span>This is a paid course</span>
            </label>
            <small>Enable payment requirement for enrollment</small>
          </div>

          {formData.isPaid && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="999"
                    min="0"
                    step="0.01"
                    required={formData.isPaid}
                  />
                </div>

                <div className="form-group">
                  <label>Currency *</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required={formData.isPaid}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Discount Price (Optional)</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  placeholder="799"
                  min="0"
                  step="0.01"
                />
                <small>Leave empty if no discount</small>
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/admin/courses')}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateCourse;
