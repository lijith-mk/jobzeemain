import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from "../config/api";

const MentorLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "password":
        if (!value.trim()) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Validate all fields
  const validate = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  };

  // Handle field focus
  const handleFocus = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate on focus if field has value
    if (form[name]) {
      const error = validateField(name, form[name]);
      setErrors({ ...errors, [name]: error });
    }
  };

  // Handle field change with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/mentors/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
          // Enhanced error handling based on backend response
          let errorMessage = "Login failed. Please try again.";

          if (data.errorType === "validation_error") {
            // Handle validation errors from backend
            if (data.errors) {
              setErrors(data.errors);
            }
            errorMessage = "Please check your input and try again.";
          } else if (data.errorType === "mentor_not_found") {
            errorMessage =
              "No mentor account found with this email address. Please check your email or register.";
            setErrors({ email: "No mentor found with this email" });
          } else if (data.errorType === "invalid_password") {
            errorMessage = "Incorrect password. Please try again.";
            setErrors({ password: "Incorrect password" });
          } else if (data.errorType === "account_not_approved") {
            errorMessage =
              "Your mentor account is pending approval. Please wait for admin verification.";
          } else if (data.errorType === "account_rejected") {
            errorMessage =
              "Your mentor account has been rejected. Please contact support for more information.";
          } else if (data.message) {
            errorMessage = data.message;
          }

          toast.error(`❌ ${errorMessage}`);
          handleShake();
          return;
        }

        // Save token & mentor details in localStorage
        localStorage.setItem("mentorToken", data.token);
        localStorage.setItem("mentor", JSON.stringify(data.mentor));

        // Trigger navbar update immediately
        window.dispatchEvent(new Event("user-updated"));

        setSuccess(true);
        toast.success("🎉 Login successful! Welcome back, Mentor!");

        // Redirect based on application status
        setTimeout(() => {
          if (!data.hasCompletedApplication) {
            // No application submitted yet
            navigate("/mentor/application");
          } else if (data.verificationStatus === "pending") {
            // Application submitted but pending review
            navigate("/mentor/pending");
          } else if (data.verificationStatus === "approved") {
            // Application approved - full access
            navigate("/mentor/dashboard");
          } else if (data.verificationStatus === "rejected") {
            // Application rejected - show pending page with rejection message
            navigate("/mentor/pending");
          } else {
            // Default to pending page
            navigate("/mentor/pending");
          }
        }, 1500);
      } catch (err) {
        console.error("Mentor login error:", err);
        toast.error(
          "🚫 Network error! Please check your connection and try again.",
        );
        handleShake();
      } finally {
        setLoading(false);
      }
    } else {
      handleShake();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-200 via-white to-pink-200 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse-slow animation-delay-300"></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-300 rounded-full opacity-30 animate-bounce-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-indigo-300 rounded-full opacity-30 animate-bounce-slow animation-delay-500"></div>

      <form
        onSubmit={handleSubmit}
        className={`bg-white bg-opacity-95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-700 ease-out ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${shake ? "animate-shake" : ""}`}
        noValidate
      >
        {/* Header with Animation */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Mentor Login
          </h2>
          <p className="text-gray-600">Guide the next generation</p>
        </div>

        {/* Email Field */}
        <div className="mb-6">
          <label
            htmlFor="email"
            className="block font-semibold mb-2 text-gray-700 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 border ${
                errors.email && touched.email ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.email && touched.email ? "focus:ring-red-200" : "focus:ring-purple-500"
              } focus:border-transparent transition-all duration-200`}
              required
            />
            {errors.email && touched.email && (
              <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.email}
              </div>
            )}
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block font-semibold mb-2 text-gray-700 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder="Enter your password"
              className={`w-full px-4 py-3 border ${
                errors.password && touched.password ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.password && touched.password ? "focus:ring-red-200" : "focus:ring-purple-500"
              } focus:border-transparent transition-all duration-200`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
            {errors.password && touched.password && (
              <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.password}
              </div>
            )}
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="mb-6 text-right">
          <Link
            to="/mentor/forgot-password"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
            loading || success
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
              Signing In...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
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
              Success! Redirecting...
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              New to mentoring?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-gray-600 mb-3">Don't have a mentor account?</p>
          <Link
            to="/mentor/register"
            className="inline-flex items-center px-6 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-200 font-semibold"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Register as Mentor
          </Link>
        </div>

        {/* Other Login Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-3">Or login as:</p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Job Seeker
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/employer/login"
              className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
            >
              Employer
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MentorLogin;
