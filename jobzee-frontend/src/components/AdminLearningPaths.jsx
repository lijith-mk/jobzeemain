import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const AdminLearningPaths = () => {
  const [paths, setPaths] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageCoursesModal, setShowManageCoursesModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathCourses, setPathCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    targetJobRole: '',
    level: 'beginner',
    estimatedDuration: '',
    skills: '',
    prerequisites: '',
    outcomes: '',
    category: '',
    tags: ''
  });

  // Fetch learning paths
  const fetchPaths = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/learning-paths`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaths(response.data.data || []);
    } catch (error) {
      console.error('Error fetching paths:', error);
      toast.error('Failed to fetch learning paths');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    fetchPaths();
    fetchCourses();
  }, []);

  // Create learning path
  const handleCreatePath = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        prerequisites: formData.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
        outcomes: formData.outcomes.split(',').map(s => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
        estimatedDuration: parseInt(formData.estimatedDuration) || 0
      };

      await axios.post(`${API_BASE_URL}/api/learning-paths`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Learning path created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchPaths();
    } catch (error) {
      console.error('Error creating path:', error);
      toast.error(error.response?.data?.message || 'Failed to create learning path');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for a path
  const fetchPathCourses = async (pathId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/learning-paths/${pathId}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pathCoursesData = response.data.data || [];
      setPathCourses(pathCoursesData);

      // Filter available courses (not yet added to path)
      const addedCourseIds = pathCoursesData.map(pc => pc.courseId._id);
      const available = courses.filter(c => !addedCourseIds.includes(c._id));
      setAvailableCourses(available);
    } catch (error) {
      console.error('Error fetching path courses:', error);
      toast.error('Failed to fetch path courses');
    }
  };

  // Add course to path
  const handleAddCourse = async (courseId) => {
    if (!selectedPath) return;

    try {
      const token = localStorage.getItem('adminToken');
      const nextOrder = pathCourses.length + 1;

      await axios.post(
        `${API_BASE_URL}/api/learning-paths/${selectedPath._id}/courses`,
        {
          courseId,
          order: nextOrder,
          isRequired: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Course added to learning path');
      fetchPathCourses(selectedPath._id);
    } catch (error) {
      console.error('Error adding course:', error);
      toast.error(error.response?.data?.message || 'Failed to add course');
    }
  };

  // Remove course from path
  const handleRemoveCourse = async (courseId) => {
    if (!selectedPath) return;

    if (!window.confirm('Are you sure you want to remove this course?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${API_BASE_URL}/api/learning-paths/${selectedPath._id}/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Course removed from learning path');
      fetchPathCourses(selectedPath._id);
    } catch (error) {
      console.error('Error removing course:', error);
      toast.error('Failed to remove course');
    }
  };

  // Toggle course required status
  const handleToggleRequired = async (pathCourse) => {
    try {
      const token = localStorage.getItem('adminToken');
      // This would need a backend endpoint to update the mapping
      // For now, we'll use the reorder endpoint with the same order
      toast.info('Feature coming soon: Toggle required/optional status');
    } catch (error) {
      console.error('Error toggling required:', error);
    }
  };

  // Native drag and drop handlers
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const items = Array.from(pathCourses);
    const draggedItemContent = items[draggedItem];
    items.splice(draggedItem, 1);
    items.splice(index, 0, draggedItemContent);

    setDraggedItem(index);
    setPathCourses(items);
  };

  const handleDragEnd = async () => {
    if (draggedItem === null || !selectedPath) return;

    try {
      const token = localStorage.getItem('adminToken');
      const courseOrders = pathCourses.map((item, index) => ({
        courseId: item.courseId._id,
        order: index + 1
      }));

      await axios.post(
        `${API_BASE_URL}/api/learning-paths/${selectedPath._id}/courses/reorder`,
        { courseOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Course order updated');
    } catch (error) {
      console.error('Error reordering courses:', error);
      toast.error('Failed to update order');
      fetchPathCourses(selectedPath._id);
    } finally {
      setDraggedItem(null);
    }
  };

  // Publish/Unpublish path
  const handleToggleStatus = async (path) => {
    const newStatus = path.status === 'published' ? 'draft' : 'published';

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/api/learning-paths/${path._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Learning path ${newStatus}`);
      fetchPaths();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete path
  const handleDeletePath = async (pathId) => {
    if (!window.confirm('Are you sure you want to delete this learning path? This will remove all course mappings.')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/api/learning-paths/${pathId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Learning path deleted');
      fetchPaths();
    } catch (error) {
      console.error('Error deleting path:', error);
      toast.error('Failed to delete learning path');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: '',
      targetJobRole: '',
      level: 'beginner',
      estimatedDuration: '',
      skills: '',
      prerequisites: '',
      outcomes: '',
      category: '',
      tags: ''
    });
  };

  const openManageCoursesModal = (path) => {
    setSelectedPath(path);
    fetchPathCourses(path._id);
    setShowManageCoursesModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Paths</h2>
          <p className="text-gray-600 mt-1">Create and manage structured learning paths for different job roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Learning Path</span>
        </button>
      </div>

      {/* Learning Paths Grid */}
      {loading && paths.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading learning paths...</p>
        </div>
      ) : paths.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Paths Yet</h3>
          <p className="text-gray-600 mb-4">Create your first learning path to organize courses for specific job roles</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Learning Path
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <div key={path._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              {/* Path Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{path.title}</h3>
                    <p className="text-sm text-gray-600">{path.targetJobRole}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    path.status === 'published' ? 'bg-green-100 text-green-800' :
                    path.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {path.status || 'draft'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{path.description}</p>

                {/* Path Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <span>📊</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      path.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      path.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {path.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📚</span>
                    <span>{path.totalLessons || 0} courses</span>
                  </div>
                  {path.estimatedDuration && (
                    <div className="flex items-center space-x-1">
                      <span>⏱️</span>
                      <span>{path.estimatedDuration}h</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {path.skills && path.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {path.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                      {path.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{path.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openManageCoursesModal(path)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Manage Courses
                  </button>
                  <button
                    onClick={() => handleToggleStatus(path)}
                    className={`px-3 py-2 rounded text-sm ${
                      path.status === 'published'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {path.status === 'published' ? '📝 Draft' : '✅ Publish'}
                  </button>
                  <button
                    onClick={() => handleDeletePath(path._id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Create Learning Path</h3>
              <p className="text-gray-600 mt-1">Define a structured learning journey for a specific job role</p>
            </div>

            <form onSubmit={handleCreatePath} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Path Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., fullstack-web-developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Full Stack Web Developer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this learning path covers..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Job Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetJobRole}
                    onChange={(e) => setFormData({ ...formData, targetJobRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Full Stack Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Technology"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HTML, CSS, JavaScript, React, Node.js"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Basic programming knowledge, Computer fundamentals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Outcomes (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.outcomes}
                  onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Build full-stack apps, Deploy to production, Work with databases"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., web development, programming, career"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Learning Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Courses Modal */}
      {showManageCoursesModal && selectedPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Manage Courses</h3>
              <p className="text-gray-600 mt-1">{selectedPath.title}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Courses in Path (Ordered) */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    <span>📚 Courses in Path ({pathCourses.length})</span>
                    <span className="text-sm font-normal text-gray-600">Drag to reorder</span>
                  </h4>

                  <div className="space-y-2">
                    {pathCourses.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">No courses added yet</p>
                        <p className="text-sm text-gray-500 mt-1">Add courses from the right panel</p>
                      </div>
                    ) : (
                      pathCourses.map((item, index) => (
                        <div
                          key={item._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white border rounded-lg p-3 cursor-move transition-all ${
                            draggedItem === index ? 'opacity-50 shadow-lg' : 'shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                              <span className="text-gray-400 text-lg">⋮⋮</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm">
                                {item.courseId?.title}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  item.isRequired
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {item.isRequired ? 'Mandatory' : 'Optional'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.courseId?.level}
                                </span>
                                {item.courseId?.duration && (
                                  <span className="text-xs text-gray-500">
                                    ⏱️ {item.courseId.duration}h
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCourse(item.courseId._id)}
                              className="flex-shrink-0 text-red-600 hover:text-red-800 text-sm"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Available Courses */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    ➕ Available Courses ({availableCourses.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableCourses.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">All courses have been added</p>
                      </div>
                    ) : (
                      availableCourses.map((course) => (
                        <div
                          key={course._id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm">
                                {course.title}
                              </h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-600">
                                  {course.category}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                                  course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {course.level}
                                </span>
                                {course.duration && (
                                  <span className="text-xs text-gray-500">
                                    ⏱️ {course.duration}h
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddCourse(course._id)}
                              className="ml-2 flex-shrink-0 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Drag courses to reorder them. The order defines the recommended learning sequence.
                </div>
                <button
                  onClick={() => {
                    setShowManageCoursesModal(false);
                    setSelectedPath(null);
                    fetchPaths(); // Refresh to update course counts
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningPaths;
