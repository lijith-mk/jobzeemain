import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from '../config/api';
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
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
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        
        if (!res.ok) {
          // Handle specific error types
          let errorMessage = "Failed to send reset email. Please try again.";
          
          if (data.errorType === 'validation_error') {
            errorMessage = data.message || "Please check your input and try again.";
          } else if (data.errorType === 'google_auth_user') {
            errorMessage = data.message;
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          toast.error(`❌ ${errorMessage}`);
          handleShake();
          return;
        }

        setSuccess(true);
        toast.success("✉️ Password reset instructions sent! Check your email.");
        
        // Show success message for 3 seconds, then redirect
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Forgot Password
          </h2>
          <p className="text-gray-600">Enter your email to reset your password</p>
        </div>

        {!success && (
          <>
            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block font-semibold mb-2 text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  className={`w-full border-2 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  disabled={loading || success}
                />
                {errors.email && (
                  <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 flex justify-center items-center ${
                loading
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-wait"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 transform"
              } ${!loading ? "hover-lift" : ""}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  <span>Sending Reset Link...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Reset Link
                </>
              )}
            </button>
          </>
        )}

        {/* Success Message */}
        {success && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">Email Sent!</h3>
            <p className="text-gray-600 mb-4">
              If an account with this email exists, you will receive password reset instructions shortly.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            Remember your password?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
              Sign in here
            </Link>
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/register" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Create account
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/employer/login" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Employer login
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-center text-sm font-semibold text-gray-700 mb-4">Need Help?</h4>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-600 justify-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check your spam folder if you don't see the email
            </div>
            <div className="flex items-center text-xs text-gray-600 justify-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reset link expires in 1 hour
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
