import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API_BASE_URL from "../config/api";

const MentorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    country: "",
    city: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Validation functions for each field
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Full name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Name should only contain letters and spaces";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "phone":
        if (!value.trim()) {
          error = "Phone number is required";
        } else {
          // Remove all spaces, dashes, and parentheses for validation
          const cleanedPhone = value.replace(/[\s\-()]/g, '');
          
          // Indian phone number validation
          // Format: +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX (10 digits starting with 6-9)
          const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
          
          if (!indianPhoneRegex.test(cleanedPhone)) {
            error = "Enter valid Indian mobile number (10 digits starting with 6-9)";
          }
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        } else if (!/(?=.*[a-z])/.test(value)) {
          error = "Password must contain at least one lowercase letter";
        } else if (!/(?=.*[A-Z])/.test(value)) {
          error = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*\d)/.test(value)) {
          error = "Password must contain at least one number";
        }
        break;

      case "country":
        if (!value.trim()) {
          error = "Country is required";
        } else if (value.trim().length < 2) {
          error = "Country name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Country name should only contain letters";
        }
        break;

      case "city":
        if (!value.trim()) {
          error = "City is required";
        } else if (value.trim().length < 2) {
          error = "City name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "City name should only contain letters";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate on focus if field has value
    if (formData[name]) {
      const error = validateField(name, formData[name]);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      toast.error("Please fix all validation errors");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      if (photo) {
        data.append("photo", photo);
      }

      const response = await fetch(`${API_BASE_URL}/api/mentors/register`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        navigate("/mentor/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] rounded-full bg-pink-600/20 blur-[100px] animate-float"></div>
      </div>

      {/* Left Panel - Inspirational Content (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-16 text-white">
        <div
          className={`transition-all duration-1000 transform ${animate ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-500/30">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Inspire the Next <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Generation
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-md leading-relaxed">
            Join our community of world-class mentors. Share your knowledge,
            guide aspiring professionals, and shape the future of the industry.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Global Reach</h3>
                <p className="text-sm text-slate-400">
                  Connect with mentees worldwide
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Earn & Grow</h3>
                <p className="text-sm text-slate-400">
                  Monetize your expertise flexibly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto">
        <div
          className={`w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl transition-all duration-1000 transform ${animate ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Create Profile
            </h2>
            <p className="text-slate-500 mt-2">
              Start your mentorship journey today
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Photo Upload - Premium Style */}
            <div className="flex justify-center mb-8">
              <div className="relative group cursor-pointer">
                <div
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 ${photoPreview ? "border-purple-500" : "border-slate-200"} transition-all duration-300 group-hover:border-purple-400 shadow-xl shadow-purple-500/10`}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-purple-500 transition-colors">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2.5 rounded-full shadow-lg transform group-hover:scale-110 transition-transform border-2 border-white">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    name="name"
                    type="text"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.name && touched.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 group-hover:border-slate-300'
                    }`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    name="email"
                    type="email"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 group-hover:border-slate-300'
                    }`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.phone && touched.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.password && touched.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.password && touched.password && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    Country
                  </label>
                  <input
                    name="country"
                    type="text"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.country && touched.country
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="USA"
                    value={formData.country}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.country && touched.country && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.country}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 outline-none transition-all ${
                      errors.city && touched.city
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                    }`}
                    placeholder="New York"
                    value={formData.city}
                    onChange={handleChange}
                    onFocus={handleFocus}
                  />
                  {errors.city && touched.city && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
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
              ) : (
                "Complete Registration"
              )}
            </button>

            <p className="text-center text-slate-500 text-sm mt-6">
              Already a mentor?{" "}
              <Link
                to="/mentor/login"
                className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorRegister;
