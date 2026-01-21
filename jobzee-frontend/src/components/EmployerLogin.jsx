import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from '../config/api';
const EmployerLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyEmail: "", password: "" });
  const [errors, setErrors] = useState({});
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    if (!form.companyEmail.trim()) {
      newErrors.companyEmail = "Company email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.companyEmail)) {
      newErrors.companyEmail = "Please enter a valid company email address";
    }
    
    // Password validation
    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    return newErrors;
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
        const res = await fetch(`${API_BASE_URL}/api/employers/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) {
          // Enhanced error handling based on backend response
          let errorMessage = "Login failed. Please try again.";
          
          if (data.errorType === 'validation_error') {
            // Handle validation errors from backend
            if (data.errors) {
              setErrors(data.errors);
            }
            errorMessage = "Please check your input and try again.";
          } else if (data.errorType === 'employer_not_found') {
            errorMessage = "No company found with this email address. Please check your email or register.";
            setErrors({ companyEmail: "No company found with this email" });
          } else if (data.errorType === 'invalid_password') {
            errorMessage = "Incorrect password. Please try again.";
            setErrors({ password: "Incorrect password" });
          } else if (data.errorType === 'account_deactivated') {
            errorMessage = "Your account has been deactivated. Please contact support.";
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          toast.error(`❌ ${errorMessage}`);
          handleShake();
          return;
        }

        // Save token & employer details in localStorage
        localStorage.setItem("employerToken", data.token);
        localStorage.setItem("employer", JSON.stringify(data.employer));

        // Trigger navbar update immediately
        window.dispatchEvent(new Event('user-updated'));

        setSuccess(true);
        toast.success("🎉 Login successful! Welcome back!");

        // Redirect to employer dashboard
        setTimeout(() => {
          navigate("/employer/dashboard");
        }, 1500);
        
      } catch (err) {
        toast.error("🚫 Network error! Please check your connection and try again.");
        handleShake();
      } finally {
        setLoading(false);
      }
    } else {
      handleShake();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-200 via-white to-green-200 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-300 rounded-full opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-green-300 rounded-full opacity-20 animate-pulse-slow animation-delay-300"></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-purple-300 rounded-full opacity-30 animate-bounce-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-pink-300 rounded-full opacity-30 animate-bounce-slow animation-delay-500"></div>

      <form
        onSubmit={handleSubmit}
        className={`bg-white bg-opacity-95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-700 ease-out ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${shake ? 'animate-shake' : ''}`}
        noValidate
      >
        {/* Header with Animation */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Employer Login
          </h2>
          <p className="text-gray-600">Access your company dashboard</p>
        </div>

        {/* Company Email Field */}
        <div className="mb-6">
          <label htmlFor="companyEmail" className="block font-semibold mb-2 text-gray-700 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            Company Email
          </label>
          <div className="relative">
            <input
              id="companyEmail"
              type="email"
              placeholder="Enter company email"
              value={form.companyEmail}
              onChange={(e) => {
                setForm({ ...form, companyEmail: e.target.value });
                if (errors.companyEmail) {
                  setErrors({ ...errors, companyEmail: "" });
                }
              }}
              className={`w-full border-2 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.companyEmail ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              disabled={loading || success}
            />
            {errors.companyEmail && (
              <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.companyEmail}
              </div>
            )}
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-6">
          <label htmlFor="password" className="block font-semibold mb-2 text-gray-700 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (errors.password) {
                  setErrors({ ...errors, password: "" });
                }
              }}
              className={`w-full border-2 rounded-lg px-4 py-3 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              disabled={loading || success}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={loading || success}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {errors.password && (
              <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.password}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 flex justify-center items-center ${
            success
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white cursor-default"
              : loading
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-wait"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 transform"
          } ${!loading && !success ? "hover-lift" : ""}`}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="spinner mr-2"></div>
              <span>Signing in...</span>
            </div>
          ) : success ? (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 success-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Success!</span>
            </div>
          ) : (
            "Sign In to Dashboard"
          )}
        </button>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            Don't have an employer account?{" "}
            <Link to="/employer/register" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
              Register your company
            </Link>
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/employer/forgot-password" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Forgot password?
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/login" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Job seeker login
            </Link>
          </div>
        </div>

        {/* Company Benefits Section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-center text-sm font-semibold text-gray-700 mb-4">Why choose JobZee for employers?</h4>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Access to qualified candidates
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Easy job posting and management
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Advanced applicant tracking
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployerLogin;
