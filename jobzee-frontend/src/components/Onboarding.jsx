import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from '../config/api';
const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [user, setUser] = useState(null);
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
    setAnimate(true);
    loadExistingUserData();
  }, []);

  useEffect(() => {
    // Check if user is already fully onboarded and not returning to update
    if (user && user.isOnboarded && !user.onboardingSkipped) {
      toast.info("Your profile is already complete!");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const loadExistingUserData = async () => {
    try {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (!userData || !token) return;
      
      const user = JSON.parse(userData);
      setUser(user);
      
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const userData = data.user;
        
        // Load existing onboarding data if available
        if (userData.experienceLevel && userData.experienceLevel !== 'not-specified') {
          setFormData({
            experienceLevel: userData.experienceLevel || "",
            preferredFields: userData.preferredFields || [],
            expectedSalary: {
              min: userData.expectedSalary?.min || "",
              max: userData.expectedSalary?.max || "",
              currency: userData.expectedSalary?.currency || "USD"
            },
            remotePreference: userData.remotePreference !== 'not-specified' ? userData.remotePreference : "",
            location: userData.location || "",
            skills: userData.skills || [],
            education: userData.education || "",
            yearsOfExperience: userData.yearsOfExperience || "",
            currentRole: userData.currentRole || "",
            preferredJobTypes: userData.preferredJobTypes || [],
            workAuthorization: userData.workAuthorization || "",
            willingToRelocate: userData.willingToRelocate || false,
            noticePeriod: userData.noticePeriod || ""
          });
          
          // Determine which step to show based on completed data
          let completedSteps = 0;
          if (userData.experienceLevel && userData.experienceLevel !== 'not-specified') completedSteps++;
          if (userData.preferredFields && userData.preferredFields.length > 0) completedSteps++;
          if (userData.expectedSalary && (userData.expectedSalary.min || userData.expectedSalary.max)) completedSteps++;
          if (userData.remotePreference && userData.remotePreference !== 'not-specified') completedSteps++;
          if (userData.skills && userData.skills.length > 0) completedSteps++;
          if (userData.preferredJobTypes && userData.preferredJobTypes.length > 0) completedSteps++;
          
          setCurrentStep(Math.min(completedSteps, steps.length - 1));
        }
      }
    } catch (error) {
      console.error("Failed to load existing user data:", error);
    }
  };

  const steps = [
    {
      title: "Experience Level",
      description: "Tell us about your experience level",
      icon: "🎯"
    },
    {
      title: "Preferred Fields",
      description: "What fields interest you most?",
      icon: "💼"
    },
    {
      title: "Salary Expectations",
      description: "What's your expected salary range?",
      icon: "💰"
    },
    {
      title: "Work Preferences",
      description: "How do you prefer to work?",
      icon: "🏢"
    },
    {
      title: "Skills & Education",
      description: "Tell us about your skills and education",
      icon: "📚"
    },
    {
      title: "Job Preferences",
      description: "What type of jobs are you looking for?",
      icon: "🎯"
    }
  ];

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

  const handleFieldToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      preferredFields: prev.preferredFields.includes(field)
        ? prev.preferredFields.filter(f => f !== field)
        : [...prev.preferredFields, field]
    }));
  };

  const handleJobTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      preferredJobTypes: prev.preferredJobTypes.includes(type)
        ? prev.preferredJobTypes.filter(t => t !== type)
        : [...prev.preferredJobTypes, type]
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast.error("User data not found. Please log in again.");
        return;
      }
      
      const token = localStorage.getItem("token");

      // Only mark user as onboarded without overwriting existing data
      const res = await fetch(`${API_BASE_URL}/api/auth/onboarding/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          isOnboarded: true,
          onboardingSkipped: true
          // Don't set other fields to avoid overwriting existing profile data
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update onboarding status");
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast.info("Onboarding skipped. You can complete your profile later from your Profile page.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      toast.error("Failed to update onboarding status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast.error("User data not found. Please log in again.");
        return;
      }
      
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/auth/onboarding/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          isOnboarded: true,
          onboardingSkipped: false
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save onboarding data");
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      
      const message = user?.onboardingSkipped 
        ? "🎉 Profile updated successfully! Your profile is now complete." 
        : "🎉 Profile setup completed! Welcome to JobZee!";
      
      toast.success(message);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Failed to save your preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What's your experience level?</h3>
            <div className="grid gap-4">
              {experienceLevels.map((level) => (
                <div
                  key={level.value}
                  onClick={() => setFormData({ ...formData, experienceLevel: level.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    formData.experienceLevel === level.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{level.label}</h4>
                      <p className="text-gray-600 text-sm">{level.description}</p>
                    </div>
                    {formData.experienceLevel === level.value && (
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What fields interest you most?</h3>
            <p className="text-gray-600 mb-4">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {jobFields.map((field) => (
                <div
                  key={field.value}
                  onClick={() => handleFieldToggle(field.value)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    formData.preferredFields.includes(field.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{field.icon}</span>
                    <span className="font-medium text-gray-900">{field.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What's your expected salary range?</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={formData.expectedSalary.min}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedSalary: { ...formData.expectedSalary, min: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
                <input
                  type="number"
                  placeholder="80000"
                  value={formData.expectedSalary.max}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedSalary: { ...formData.expectedSalary, max: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.expectedSalary.currency}
                onChange={(e) => setFormData({
                  ...formData,
                  expectedSalary: { ...formData.expectedSalary, currency: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How do you prefer to work?</h3>
            <div className="grid gap-4">
              {remoteOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setFormData({ ...formData, remotePreference: option.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    formData.remotePreference === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{option.label}</h4>
                      <p className="text-gray-600 text-sm">{option.description}</p>
                    </div>
                    {formData.remotePreference === option.value && (
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
              <input
                type="text"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tell us about your skills and education</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript, React, Node.js"
                  value={formData.skills.join(", ")}
                  onChange={(e) => setFormData({
                    ...formData,
                    skills: e.target.value.split(",").map(skill => skill.trim()).filter(skill => skill)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <input
                  type="text"
                  placeholder="e.g., Bachelor's in Computer Science"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  placeholder="2"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                <input
                  type="text"
                  placeholder="e.g., Frontend Developer"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What type of jobs are you looking for?</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Types</label>
                <div className="grid grid-cols-2 gap-3">
                  {jobTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => handleJobTypeToggle(type.value)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                        formData.preferredJobTypes.includes(type.value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Authorization</label>
                <select
                  value={formData.workAuthorization}
                  onChange={(e) => setFormData({ ...formData, workAuthorization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select authorization</option>
                  {workAuthOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="willingToRelocate"
                  checked={formData.willingToRelocate}
                  onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="willingToRelocate" className="text-sm font-medium text-gray-700">
                  Willing to relocate for the right opportunity
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                <select
                  value={formData.noticePeriod}
                  onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select notice period</option>
                  {noticePeriods.map((period) => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 ${animate ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{steps[currentStep].icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.onboardingSkipped ? 'Complete Your Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-600">
            {user?.onboardingSkipped 
              ? 'Let\'s finish setting up your profile to get better job matches' 
              : steps[currentStep].description
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Skip for now
          </button>
          
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover-lift"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
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
                  "Complete Setup"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 