import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from '../config/api';
const EmployerResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [form, setForm] = useState({ 
    token: token || "",
    newPassword: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState({});
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    // Token validation
    if (!form.token.trim()) {
      newErrors.token = "Reset token is required";
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!form.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (!passwordRegex.test(form.newPassword)) {
      newErrors.newPassword = "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character";
    }
    
    // Confirm password validation
    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    return newErrors;
  };

  useEffect(() => {
    setAnimate(true);
    
    // Update form token if it comes from URL
    if (token) {
      setForm(prev => ({ ...prev, token }));
    }
  }, [token]);

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
        const res = await fetch(`${API_BASE_URL}/api/employers/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: form.token,
            newPassword: form.newPassword
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          // Handle specific error types
          let errorMessage = "Failed to reset password. Please try again.";
          
          if (data.errorType === 'validation_error') {
            errorMessage = data.message || "Please check your input and try again.";
          } else if (data.errorType === 'invalid_token') {
            errorMessage = "Invalid or expired reset token. Please request a new reset link.";
          } else if (data.errorType === 'account_deactivated') {
            errorMessage = data.message;
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          toast.error(`❌ ${errorMessage}`);
          handleShake();
          
          // If token is invalid, redirect to forgot password
          if (data.errorType === 'invalid_token') {
            setTimeout(() => {
              navigate("/employer/forgot-password");
            }, 3000);
          }
          return;
        }

        setSuccess(true);
        toast.success("✅ Password reset successful! You can now login with your new password.");
        
        // Show success message for 3 seconds, then redirect
        setTimeout(() => {
          navigate("/employer/login");
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-200 via-white to-indigo-200 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-indigo-300 rounded-full opacity-20 animate-pulse-slow animation-delay-300"></div>
      <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-pink-300 rounded-full opacity-30 animate-bounce-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-blue-300 rounded-full opacity-30 animate-bounce-slow animation-delay-500"></div>

      <form
        onSubmit={handleSubmit}
        className={`bg-white bg-opacity-95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-700 ease-out ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } ${shake ? 'animate-shake' : ''}`}
        noValidate
      >
        {/* Header with Animation */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            Reset Password
          </h2>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {!success && (
          <>
            {/* Token Field (hidden if from URL) */}
            {!token && (
              <div className="mb-6">
                <label htmlFor="token" className="block font-semibold mb-2 text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    id="token"
                    type="text"
                    placeholder="Enter reset token from email"
                    value={form.token}
                    onChange={(e) => {
                      setForm({ ...form, token: e.target.value });
                      if (errors.token) {
                        setErrors({ ...errors, token: "" });
                      }
                    }}
                    className={`w-full border-2 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                      errors.token ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400'
                    }`}
                    disabled={loading || success}
                  />
                  {errors.token && (
                    <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.token}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* New Password Field */}
            <div className="mb-6">
              <label htmlFor="newPassword" className="block font-semibold mb-2 text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={(e) => {
                    setForm({ ...form, newPassword: e.target.value });
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: "" });
                    }
                  }}
                  className={`w-full border-2 rounded-lg px-4 py-3 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                    errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400'
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
                {errors.newPassword && (
                  <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.newPassword}
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block font-semibold mb-2 text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm({ ...form, confirmPassword: e.target.value });
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: "" });
                    }
                  }}
                  className={`w-full border-2 rounded-lg px-4 py-3 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400'
                  }`}
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading || success}
                >
                  {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <div className="flex items-center mt-2 text-red-500 text-sm animate-fade-in-up">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.confirmPassword}
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
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-wait"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 transform"
              } ${!loading ? "hover-lift" : ""}`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Reset Password
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
            <h3 className="text-xl font-semibold text-green-600 mb-2">Password Reset Complete!</h3>
            <p className="text-gray-600 mb-4">
              Your password has been successfully reset. You can now login with your new password.
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
            <Link to="/employer/login" className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors">
              Sign in here
            </Link>
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/employer/forgot-password" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Request new reset link
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/login" className="text-gray-500 hover:text-gray-700 hover:underline transition-colors">
              Job seeker login
            </Link>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-center text-sm font-semibold text-gray-700 mb-4">Security Requirements</h4>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              At least 8 characters long
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Contains uppercase and lowercase letters
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Includes numbers and special characters
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployerResetPassword;
