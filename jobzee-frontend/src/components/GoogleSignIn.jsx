import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const GoogleSignIn = ({ onSuccess, onError, disabled = false }) => {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    // Load Google Sign-In script
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        toast.error('Failed to load Google Sign-In. Please try again.');
      };
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render the Google Sign-In button
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            }
          );
        } catch (error) {
          console.error('Google Sign-In initialization error:', error);
          toast.error('Google Sign-In setup failed. Please refresh and try again.');
        }
      }
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.log('Google Sign-In cleanup error:', error);
        }
      }
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      console.log('Google Sign-In credential received');
      setIsAuthenticating(true);
      
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Send credential to backend for verification
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      console.log('Google authentication successful:', data.user.email);

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Dispatch auth change event for cart context
      window.dispatchEvent(new CustomEvent('authChange'));

      // Set success state for animation
      setAuthSuccess(true);

      // Show success message
      toast.success(`🎉 Welcome ${data.user.name}! Signed in with Google.`);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data);
      }

      // Navigation logic with animation delay
      setTimeout(() => {
        if (data.isNewUser || !data.user.isOnboarded) {
          // New user or incomplete profile - go to onboarding
          navigate('/onboarding');
        } else {
          // Existing user - navigate based on user type and role
          if (data.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (data.user.authProvider === 'google' && data.user.role === 'user') {
            // Regular user signed in with Google
            navigate('/dashboard');
          } else {
            // Default to user dashboard
            navigate('/dashboard');
          }
        }
      }, 2000); // Increased delay for better animation experience

    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.message.includes('Invalid Google token')) {
        errorMessage = 'Google authentication failed. Please try again.';
      } else if (error.message.includes('Database connection')) {
        errorMessage = 'Server connection issue. Please try again in a moment.';
      } else if (error.message.includes('Incomplete Google profile')) {
        errorMessage = 'Your Google profile is incomplete. Please try again.';
      }
      
      toast.error(`❌ ${errorMessage}`);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleManualSignIn = () => {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google Sign-In prompt not displayed or skipped');
            toast.info('Please click the Google Sign-In button to continue.');
          }
        });
      } catch (error) {
        console.error('Manual Google Sign-In error:', error);
        toast.error('Unable to show Google Sign-In. Please refresh and try again.');
      }
    }
  };

  return (
    <div className="w-full relative">
      {/* Loading Overlay with Enhanced Animation */}
      {isAuthenticating && (
        <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-md flex items-center justify-center z-10 rounded-lg animate-fade-in-up">
          <div className="flex flex-col items-center space-y-3">
            {/* Animated Google Logo */}
            <div className="relative">
              <div className="w-10 h-10 animate-pulse-slow">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              {/* Rotating Border */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
            </div>
            <div className="text-center">
              <span className="text-blue-600 font-medium animate-pulse">Authenticating with Google...</span>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Overlay with Enhanced Animation */}
      {authSuccess && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-blue-50 bg-opacity-95 backdrop-blur-md flex items-center justify-center z-10 rounded-lg animate-fade-in-up">
          <div className="flex flex-col items-center space-y-3">
            {/* Success Animation */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-bounce-slow">
                <svg className="w-6 h-6 text-white success-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Success Ripple Effect */}
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-30"></div>
              <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-20 animation-delay-300"></div>
            </div>
            <div className="text-center">
              <span className="text-green-600 font-semibold text-lg">Success!</span>
              <p className="text-green-500 text-sm mt-1 animate-fade-in-up animation-delay-200">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Google Sign-In Button Container with Hover Effects */}
      <div 
        id="google-signin-button" 
        className={`w-full transition-all duration-500 transform ${disabled || isAuthenticating 
          ? 'opacity-50 pointer-events-none scale-95' 
          : 'hover:scale-105 hover:shadow-lg'
        } ${!isAuthenticating ? 'animate-fade-in-up' : ''}`}
        style={{ minHeight: '44px' }}
      />
      
      {/* Fallback button if Google button doesn't load */}
      <button
        type="button"
        onClick={handleManualSignIn}
        disabled={disabled || isAuthenticating}
        className={`w-full mt-2 inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
          disabled || isAuthenticating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        }`}
        style={{ display: 'none' }} // Hidden by default, shown if main button fails
        id="fallback-google-button"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
};

export default GoogleSignIn;
