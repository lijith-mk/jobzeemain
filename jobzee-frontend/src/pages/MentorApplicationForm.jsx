import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: "",
    currentRole: "",
    company: "",
    yearsOfExperience: "",
    skills: [],
    linkedinUrl: "",
    whyMentor: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Get mentor info from localStorage
  useEffect(() => {
    const mentor = JSON.parse(localStorage.getItem("mentor") || "{}");
    if (!mentor._id) {
      toast.error("Please login first");
      navigate("/mentor/login");
    }
  }, [navigate]);

  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Sales",
    "Engineering",
    "Design",
    "HR",
    "Legal",
    "Consulting",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSkillAdd = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (!formData.skills.includes(skill)) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skill],
        }));
        setSkillInput("");
        if (errors.skills) {
          setErrors((prev) => ({
            ...prev,
            skills: "",
          }));
        }
      } else {
        toast.warning("Skill already added");
      }
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please upload a PDF or image file (PNG, JPG, JPEG)"
        );
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setProofFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.industry.trim()) {
      newErrors.industry = "Industry is required";
    }

    if (!formData.currentRole.trim()) {
      newErrors.currentRole = "Current role is required";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    if (!formData.yearsOfExperience || formData.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = "Years of experience must be 0 or greater";
    }

    if (formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }

    if (formData.linkedinUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(formData.linkedinUrl)) {
        newErrors.linkedinUrl = "Please enter a valid URL (starting with http:// or https://)";
      }
    }

    if (!formData.whyMentor.trim()) {
      newErrors.whyMentor = "Please tell us why you want to mentor";
    } else if (formData.whyMentor.trim().length < 50) {
      newErrors.whyMentor =
        "Please provide at least 50 characters (currently " +
        formData.whyMentor.trim().length +
        ")";
    } else if (formData.whyMentor.trim().length > 1000) {
      newErrors.whyMentor =
        "Please keep it under 1000 characters (currently " +
        formData.whyMentor.trim().length +
        ")";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const mentor = JSON.parse(localStorage.getItem("mentor") || "{}");
      if (!mentor._id) {
        toast.error("Please login first");
        navigate("/mentor/login");
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("mentorId", mentor._id);
      formDataToSend.append("industry", formData.industry);
      formDataToSend.append("currentRole", formData.currentRole);
      formDataToSend.append("company", formData.company);
      formDataToSend.append("yearsOfExperience", formData.yearsOfExperience);
      formDataToSend.append("skills", formData.skills.join(","));
      formDataToSend.append("linkedinUrl", formData.linkedinUrl || "");
      formDataToSend.append("whyMentor", formData.whyMentor);

      if (proofFile) {
        formDataToSend.append("file", proofFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/mentor-applications/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("mentorToken")}`,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      toast.success("✅ Application submitted successfully!");
      setTimeout(() => {
        navigate("/mentor/pending");
      }, 1500);
    } catch (error) {
      console.error("Application submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Mentor Application
          </h1>
          <p className="text-gray-600">
            Complete your mentor profile to start helping others
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6"
        >
          {/* Industry */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.industry
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            >
              <option value="">Select Industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
            )}
          </div>

          {/* Current Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="currentRole"
              value={formData.currentRole}
              onChange={handleInputChange}
              placeholder="e.g., Senior Software Engineer"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.currentRole
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            {errors.currentRole && (
              <p className="text-red-500 text-sm mt-1">{errors.currentRole}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g., Google"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.company
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              placeholder="e.g., 5"
              min="0"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.yearsOfExperience
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            {errors.yearsOfExperience && (
              <p className="text-red-500 text-sm mt-1">
                {errors.yearsOfExperience}
              </p>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skills <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleSkillAdd}
              placeholder="Type a skill and press Enter"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.skills
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            <p className="text-sm text-gray-500 mt-1">
              Type a skill and press Enter to add it
            </p>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(skill)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.skills && (
              <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
            )}
          </div>

          {/* Profile Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profile Link <span className="text-gray-400">(Optional - LinkedIn/Portfolio)</span>
            </label>
            <input
              type="url"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/yourprofile"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.linkedinUrl
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            {errors.linkedinUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.linkedinUrl}</p>
            )}
          </div>

          {/* Why Mentor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Why do you want to mentor? <span className="text-red-500">*</span>
            </label>
            <textarea
              name="whyMentor"
              value={formData.whyMentor}
              onChange={handleInputChange}
              rows={6}
              placeholder="Tell us about your motivation to mentor others (50-1000 characters)..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.whyMentor
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-purple-500"
                }`}
            />
            <div className="flex justify-between mt-1">
              <p className="text-sm text-gray-500">
                {formData.whyMentor.trim().length}/1000 characters (minimum 50)
              </p>
              {errors.whyMentor && (
                <p className="text-red-500 text-sm">{errors.whyMentor}</p>
              )}
            </div>
          </div>

          {/* Upload Proof */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Proof{" "}
              <span className="text-gray-400">(Optional - PDF / LinkedIn screenshot)</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h4m-12-4h.02M36 20h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="proof-file"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="proof-file"
                      name="proof-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, PNG, JPG, JPEG up to 5MB
                </p>
              </div>
            </div>
            {proofPreview && (
              <div className="mt-4">
                <img
                  src={proofPreview}
                  alt="Proof preview"
                  className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                />
              </div>
            )}
            {proofFile && !proofPreview && (
              <div className="mt-4 flex items-center space-x-2 text-purple-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">{proofFile.name}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorApplicationForm;

