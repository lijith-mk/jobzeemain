import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import sessionManager from '../utils/sessionManager';
import CartIcon from './CartIcon';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEmployerDropdownOpen, setIsEmployerDropdownOpen] = useState(false);

  // Refs for click outside detection
  const employerDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const refreshFromSession = () => {
    console.log('🔄 Navbar: Refreshing from session...');
    if (sessionManager.isLoggedIn()) {
      const currentUser = sessionManager.getCurrentUser();
      const userType = sessionManager.getUserType();
      console.log('🔄 Navbar: Current user:', currentUser);
      console.log('🔄 Navbar: User type:', userType);

      if (currentUser) {
        setIsLoggedIn(true);
        if (userType === 'user') {
          setUser({ ...currentUser, userType: 'user' });
        } else if (userType === 'employer') {
          const employerUser = {
            ...currentUser,
            userType: 'employer',
            name: currentUser.companyName || currentUser.contactPersonName,
            email: currentUser.companyEmail || currentUser.contactPersonEmail,
            companyLogo: currentUser.companyLogo
          };
          console.log('🔄 Navbar: Setting employer user:', employerUser);
          setUser(employerUser);
        }
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshFromSession();
  }, [location]);

  // Update when profile changes (e.g., photo uploaded) without route change
  useEffect(() => {
    const handleUserUpdated = () => {
      console.log('🔄 Navbar: User updated event received');
      refreshFromSession();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'employer' || e.key === 'employerToken' || e.key === 'token' || e.key === 'user') {
        console.log('🔄 Navbar: Storage change detected for auth/cart related data');
        // Add a small delay to prevent rapid successive calls
        setTimeout(() => {
          refreshFromSession();
        }, 100);

        // Dispatch auth change event for cart context
        window.dispatchEvent(new CustomEvent('authChange'));
      }
    };

    window.addEventListener('user-updated', handleUserUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employerDropdownRef.current && !employerDropdownRef.current.contains(event.target)) {
        setIsEmployerDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Use session manager to logout
    const userType = user?.userType;
    sessionManager.logout();
    setIsLoggedIn(false);
    setUser(null);
    setIsProfileDropdownOpen(false);
    toast.success('👋 Successfully logged out!');

    // Redirect based on user type
    if (userType === 'employer') {
      navigate('/employer/login');
    } else {
      navigate('/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Shop context: limit header items to My Purchases, Shop, Dashboard
  const isShopContext = /^\/(shop|marketplace)(\/|$)|^\/cart(\/|$)|^\/orders(\/|$)|^\/payments\/shop(\/|$)/.test(location.pathname);
  // Hide shop links on jobs/events/applications/employer interviews
  // Hide shop links on jobs/events/applications/employer interviews
  const hideShopNav = /^(\/jobs|\/applications|\/my-applications|\/events|\/participate|\/employer\/interviews|\/employer\/events)(\/|$)/.test(location.pathname);
  // Check if we are on the mentor discovery page
  const isMentorPage = /^\/mentors(\/|$)/.test(location.pathname);
  // Check if we are on My Sessions page
  const isMySessionsPage = /^\/my-sessions(\/|$)/.test(location.pathname);
  // Check if we are on Practice Arena page
  const isPracticeArenaPage = /^\/tests(\/|$)/.test(location.pathname);
  // Check if we are on Learning Hub page
  const isLearningHubPage = /^\/(learning-hub|course)(\/|$)/.test(location.pathname);


  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                JobZee
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            {!isMentorPage && (
              <div className="ml-10 flex items-baseline space-x-8">
                {isLearningHubPage ? (
                  <>
                    {/* Learning Hub Context - Only user-related links */}
                    <Link
                      to="/learning-hub"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive('/learning-hub') || location.pathname.startsWith('/course')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Learning Hub
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive('/dashboard')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/tests"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive('/tests')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Practice Arena
                    </Link>
                  </>
                ) : isPracticeArenaPage ? (
                  <>
                    {/* Practice Arena Context - Only user-related links */}
                    <Link
                      to="/tests"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/tests')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      Practice Arena
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/dashboard')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/my-applications"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/my-applications') || isActive('/applications')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/interviews"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/interviews')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      My Interviews
                    </Link>
                  </>
                ) : isShopContext ? (
                  <>
                    {isLoggedIn && (
                      <Link
                        to="/orders"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/orders')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        My Purchases
                      </Link>
                    )}
                    <Link
                      to="/shop"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/shop') || isActive('/marketplace')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      🛒 Shop
                    </Link>
                    {isLoggedIn && (
                      <Link
                        to={user?.userType === 'employer' ? '/employer/dashboard' : '/dashboard'}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/dashboard') || isActive('/employer/dashboard')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {!isMySessionsPage && !isPracticeArenaPage && (
                      <Link
                        to="/jobs"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/jobs')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        Browse Jobs
                      </Link>
                    )}

                    {/* Require login for Internships link */}
                    {!isMySessionsPage && !isPracticeArenaPage && (
                      isLoggedIn ? (
                        <Link
                          to="/internships"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/internships')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                          Internships
                        </Link>
                      ) : (
                        <button
                          onClick={() => navigate('/login')}
                          className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                        >
                          Internships
                        </button>
                      )
                    )}

                    {/* Practice Arena link - visible to logged-in users only */}
                    {isLoggedIn && user?.userType === 'user' && !isPracticeArenaPage && (
                      <Link
                        to="/tests"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/tests')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        Practice Arena
                      </Link>
                    )}

                    {isLoggedIn && !hideShopNav && !isMySessionsPage && !isPracticeArenaPage && (
                      <Link
                        to="/orders"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/orders')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        My Purchases
                      </Link>
                    )}
                    {!hideShopNav && !isMySessionsPage && !isPracticeArenaPage && (
                      <Link
                        to="/shop"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/shop') || isActive('/marketplace')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        🛒 Shop
                      </Link>
                    )}
                    {!hideShopNav && isLoggedIn && !isPracticeArenaPage && (
                      <Link
                        to={user?.userType === 'employer' ? '/employer/dashboard' : '/dashboard'}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/dashboard') || isActive('/employer/dashboard')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        Dashboard
                      </Link>
                    )}
                    {!hideShopNav && isLoggedIn && user?.userType === 'user' && !isMySessionsPage && !isPracticeArenaPage && (
                      <Link
                        to="/my-applications"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/my-applications') || isActive('/applications')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        My Applications
                      </Link>
                    )}
                    {!hideShopNav && !isMySessionsPage && !isPracticeArenaPage && (
                      <Link
                        to="/about"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/about')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        About
                      </Link>
                    )}
                    {/* Contact link removed as per requirement */}
                    {(!hideShopNav && (!isLoggedIn || user?.userType === 'employer') && !isMySessionsPage && !isPracticeArenaPage) && (
                      <Link
                        to="/pricing"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive('/pricing') || isActive('/plans')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        Pricing
                      </Link>
                    )}
                    {/* Mentor Registration Link removed */}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Employer Dropdown - Only show when NOT logged in */}
          {!isLoggedIn && (
            <div className="hidden md:block relative" ref={employerDropdownRef}>
              <button
                onClick={() => setIsEmployerDropdownOpen(!isEmployerDropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 rounded-lg hover:from-purple-700 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>For Employers</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isEmployerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Employer Dropdown Menu */}
              {isEmployerDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">🏢 Employer Portal</p>
                    <p className="text-xs text-gray-600">Post jobs and find talent</p>
                  </div>
                  <Link
                    to="/employer/register"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-200"
                    onClick={() => setIsEmployerDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Register Company</p>
                      <p className="text-xs text-gray-500">Create employer account</p>
                    </div>
                  </Link>
                  <Link
                    to="/employer/login"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                    onClick={() => setIsEmployerDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Employer Login</p>
                      <p className="text-xs text-gray-500">Access your dashboard</p>
                    </div>
                  </Link>
                  <Link
                    to="/pricing"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                    onClick={() => setIsEmployerDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">View Pricing</p>
                      <p className="text-xs text-gray-500">See our plans</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Cart Icon - Show only when logged in and not hidden */}
          {isLoggedIn && !hideShopNav && !isMentorPage && !isMySessionsPage && (
            <div className="hidden md:block mr-4">
              <CartIcon showLabel={false} size="md" />
            </div>
          )}

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:block">
            {!isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-green-600 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-blue-50"
                >
                  {/* Enhanced User Avatar with Photo Support */}
                  <div className="relative">
                    {user?.avatar || user?.profilePhoto || user?.companyLogo ? (
                      <img
                        src={user.avatar || user.profilePhoto || user.companyLogo}
                        alt={user?.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-blue-300 transition-all duration-300 transform hover:scale-110"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-transparent hover:border-blue-300 transition-all duration-300 transform hover:scale-110 ${user?.avatar || user?.profilePhoto || user?.companyLogo ? 'hidden' : 'flex'}`}>
                      <span className="text-white text-sm font-semibold">
                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-medium">{user?.name || user?.companyName || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.userType || 'user'}</p>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 navbar-dropdown">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {user?.userType && (
                        <p className="text-xs text-blue-600 capitalize mt-1">{user.userType}</p>
                      )}
                    </div>
                    {/* Profile Link */}
                    <Link
                      to={user?.userType === 'employer' ? '/employer/profile' : '/profile'}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Profile
                      </div>
                    </Link>
                    {/* Purchases */}
                    <Link
                      to="/orders"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        My Purchases
                      </div>
                    </Link>
                    {/* My Sessions Link - Only for regular users */}
                    {user?.userType === 'user' && (
                      <Link
                        to="/my-sessions"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          My Sessions
                        </div>
                      </Link>
                    )}
                    {/* My Applications Link - Only for regular users */}
                    {user?.userType === 'user' && (
                      <Link
                        to="/my-applications"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          My Applications
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon - Mobile - Show only when logged in and not hidden */}
          {isLoggedIn && !hideShopNav && !isMentorPage && !isMySessionsPage && (
            <div className="md:hidden mr-4">
              <CartIcon showLabel={false} size="sm" />
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block mobile-menu-enter' : 'hidden'} md:hidden bg-white border-t border-gray-200 mobile-nav`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {isShopContext ? (
            <>
              {isLoggedIn && (
                <Link
                  to="/orders"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/orders')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Purchases
                </Link>
              )}
              <Link
                to="/shop"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/shop') || isActive('/marketplace')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🛒 Shop
              </Link>
              {isLoggedIn && (
                <Link
                  to={user?.userType === 'employer' ? '/employer/dashboard' : '/dashboard'}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/dashboard') || isActive('/employer/dashboard')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            <>
              {!isMySessionsPage && (
                <Link
                  to="/jobs"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/jobs')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Jobs
                </Link>
              )}

              {isLoggedIn && user?.userType === 'user' && (
                <Link
                  to="/my-sessions"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/my-sessions')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Sessions
                </Link>
              )}
              {isLoggedIn && !hideShopNav && !isMySessionsPage && (
                <Link
                  to="/orders"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/orders')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Purchases
                </Link>
              )}
              {!hideShopNav && !isMySessionsPage && (
                <Link
                  to="/shop"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/shop') || isActive('/marketplace')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🛒 Shop
                </Link>
              )}
              {!hideShopNav && isLoggedIn && (
                <Link
                  to={user?.userType === 'employer' ? '/employer/dashboard' : '/dashboard'}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/dashboard') || isActive('/employer/dashboard')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </>
          )}
          {isLoggedIn && user?.userType === 'user' && !isMySessionsPage && (
            <Link
              to="/my-applications"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/my-applications') || isActive('/applications')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Applications
            </Link>
          )}
          {isLoggedIn && user?.userType === 'user' && (
            <Link
              to="/tests"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/tests')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Practice Arena
            </Link>
          )}
          {!isMySessionsPage && (
            <Link
              to="/about"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/about')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
          )}
          {/* Contact link removed as per requirement */}
          {(!isLoggedIn || user?.userType === 'employer') && !isMySessionsPage && (
            <Link
              to="/pricing"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${isActive('/pricing') || isActive('/plans')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
          )}
          {/* Mentor Registration Link - Mobile removed */}
        </div>

        {/* Mobile Employer Section - Only show when NOT logged in */}
        {!isLoggedIn && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-2 space-y-2">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gray-900 mb-2">🏢 For Employers</p>
              </div>
              <Link
                to="/employer/register"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                Register Company
              </Link>
              <Link
                to="/employer/login"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                Employer Login
              </Link>
              <Link
                to="/pricing"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                View Pricing
              </Link>
            </div>
          </div>
        )}

        {/* Mobile auth buttons */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {!isLoggedIn ? (
            <div className="px-2 space-y-2">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-600 to-green-500 text-white hover:from-blue-700 hover:to-green-600 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="px-2 space-y-2">
              <div className="flex items-center px-3 py-3 bg-gray-50 rounded-lg mx-2">
                <div className="relative mr-3">
                  {user?.avatar || user?.profilePhoto || user?.companyLogo ? (
                    <img
                      src={user.avatar || user.profilePhoto || user.companyLogo}
                      alt={user?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-300"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-blue-300 ${user?.avatar || user?.profilePhoto || user?.companyLogo ? 'hidden' : 'flex'}`}>
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name || user?.companyName || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 capitalize mt-1">{user?.userType || 'user'}</p>
                </div>
              </div>
              <Link
                to={user?.userType === 'employer' ? '/employer/profile' : '/profile'}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              {user?.userType === 'user' && (
                <Link
                  to="/my-applications"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Applications
                </Link>
              )}
              <Link
                to={user?.userType === 'employer' ? '/employer/dashboard' : '/dashboard'}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav >
  );
};

export default Navbar; 