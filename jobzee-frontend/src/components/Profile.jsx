import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { validateEmail, validatePhone, FormValidator, createFieldValidator } from "../utils/validationUtils";

import API_BASE_URL from '../config/api';
const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    experienceLevel: "",
    preferredFields: [],
    expectedSalary: { min: "", max: "", currency: "USD" },
    remotePreference: "",
    location: "",
    skills: [],
    education: "",
    yearsOfExperience: "",
    currentRole: "",
    preferredJobTypes: [],
    workAuthorization: "",
    willingToRelocate: false,
    noticePeriod: ""
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    setAnimate(true);
    // Load user profile data here
    loadProfileData();
  }, [navigate]);

  const loadProfileData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // The backend returns data.user, not data.profile
        const profileData = data.user || {};
        
        // Merge with existing form data, preserving any existing values
        setFormData(prevData => ({
          ...prevData,
          experienceLevel: profileData.experienceLevel || prevData.experienceLevel,
          preferredFields: profileData.preferredFields || prevData.preferredFields,
          expectedSalary: {
            min: profileData.expectedSalary?.min || prevData.expectedSalary.min,
            max: profileData.expectedSalary?.max || prevData.expectedSalary.max,
            currency: profileData.expectedSalary?.currency || prevData.expectedSalary.currency
          },
          remotePreference: profileData.remotePreference || prevData.remotePreference,
          location: profileData.location || prevData.location,
          skills: profileData.skills || prevData.skills,
          education: profileData.education || prevData.education,
          yearsOfExperience: profileData.yearsOfExperience || prevData.yearsOfExperience,
          currentRole: profileData.currentRole || prevData.currentRole,
          preferredJobTypes: profileData.preferredJobTypes || prevData.preferredJobTypes,
          workAuthorization: profileData.workAuthorization || prevData.workAuthorization,
          willingToRelocate: profileData.willingToRelocate !== undefined ? profileData.willingToRelocate : prevData.willingToRelocate,
          noticePeriod: profileData.noticePeriod || prevData.noticePeriod
        }));
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("✅ Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const experienceLevels = [
    { value: "fresher", label: "Fresher", description: "Just graduated or starting my career" },
    { value: "experienced", label: "Experienced", description: "Have some work experience" }
  ];

  const jobFields = [
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "design", label: "Design", icon: "🎨" },
    { value: "marketing", label: "Marketing", icon: "📈" },
    { value: "sales", label: "Sales", icon: "💰" },
    { value: "finance", label: "Finance", icon: "📊" },
    { value: "hr", label: "Human Resources", icon: "👥" },
    { value: "healthcare", label: "Healthcare", icon: "🏥" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "consulting", label: "Consulting", icon: "💡" },
    { value: "manufacturing", label: "Manufacturing", icon: "🏭" }
  ];

  const remoteOptions = [
    { value: "remote", label: "Remote Only", description: "Work from anywhere" },
    { value: "hybrid", label: "Hybrid", description: "Mix of remote and office" },
    { value: "onsite", label: "On-site Only", description: "Work from office" },
    { value: "any", label: "Any", description: "Flexible with all options" }
  ];

  const jobTypes = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" }
  ];

  const workAuthOptions = [
    { value: "citizen", label: "Citizen" },
    { value: "permanent-resident", label: "Permanent Resident" },
    { value: "work-visa", label: "Work Visa" },
    { value: "student-visa", label: "Student Visa" },
    { value: "other", label: "Other" }
  ];

  const noticePeriods = [
    { value: "immediate", label: "Immediate" },
    { value: "15-days", label: "15 Days" },
    { value: "30-days", label: "30 Days" },
    { value: "60-days", label: "60 Days" },
    { value: "90-days", label: "90 Days" }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 gradient-text">JobZee</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`bg-white rounded-xl shadow-lg p-8 ${animate ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Profile Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover-lift"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Profile Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                {isEditing ? (
                  <select
                    value={formData.experienceLevel || ""}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{formData.experienceLevel || "Not specified"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.currentRole || ""}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.currentRole || "Not specified"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.yearsOfExperience || ""}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.yearsOfExperience || "Not specified"} years</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.education || ""}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.education || "Not specified"}</p>
                )}
              </div>
            </div>

            {/* Job Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Fields</label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {jobFields.map((field) => (
                      <label key={field.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.preferredFields?.includes(field.value) || false}
                          onChange={(e) => {
                            const newFields = e.target.checked
                              ? [...(formData.preferredFields || []), field.value]
                              : (formData.preferredFields || []).filter(f => f !== field.value);
                            setFormData({ ...formData, preferredFields: newFields });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.preferredFields?.map((field) => {
                      const fieldData = jobFields.find(f => f.value === field);
                      return fieldData ? (
                        <span key={field} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {fieldData.icon} {fieldData.label}
                        </span>
                      ) : null;
                    })}
                    {(!formData.preferredFields || formData.preferredFields.length === 0) && (
                      <span className="text-gray-500">No fields selected</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remote Preference</label>
                {isEditing ? (
                  <select
                    value={formData.remotePreference || ""}
                    onChange={(e) => setFormData({ ...formData, remotePreference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select preference</option>
                    {remoteOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{formData.remotePreference || "Not specified"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary Range</label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.expectedSalary?.min || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        expectedSalary: { ...formData.expectedSalary, min: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.expectedSalary?.max || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        expectedSalary: { ...formData.expectedSalary, max: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {formData.expectedSalary?.min && formData.expectedSalary?.max
                      ? `${formData.expectedSalary.currency} ${formData.expectedSalary.min} - ${formData.expectedSalary.max}`
                      : "Not specified"
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Skills</h3>
            {isEditing ? (
              <input
                type="text"
                placeholder="Enter skills separated by commas"
                value={formData.skills?.join(", ") || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  skills: e.target.value.split(",").map(skill => skill.trim()).filter(skill => skill)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.skills?.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
                {(!formData.skills || formData.skills.length === 0) && (
                  <span className="text-gray-500">No skills added</span>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover-lift"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 