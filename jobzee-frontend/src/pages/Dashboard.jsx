import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getDashboardAssets, getDashboardBackgrounds, handleImageErrorEnhanced } from '../services/dashboardAssets';
import JobDetailsModal from '../components/JobDetailsModal';
import RecommendedInternships from '../components/RecommendedInternships';

import API_BASE_URL from '../config/api';
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState({ percentage: 85, items: [] });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dashboardAssets, setDashboardAssets] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);
  const [interviewCount, setInterviewCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    setAnimate(true);

    // Load profile data and calculate completion
    loadProfileData();

    // Load dashboard assets
    loadDashboardAssets();

    // Load user applications
    loadUserApplications();

    // Load interviews count
    loadInterviewInvites();

    // Load upcoming interviews
    loadUpcomingInterviews();

    // Load saved jobs count
    loadSavedJobsCount();

    // Load notifications
    loadNotifications();

    // Load session count
    loadSessionCount();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Refresh notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(notificationInterval);
    };
  }, [navigate]);

  // Load enhanced dashboard assets from MongoDB
  const loadDashboardAssets = async () => {
    try {
      // Try to get enhanced assets first
      const enhancedAssets = await getDashboardAssets();

      // Convert to legacy format for backward compatibility
      const legacyFormat = {
        backgrounds: {},
        gradients: {}
      };

      // Map enhanced assets to legacy format
      Object.keys(enhancedAssets.backgrounds || {}).forEach(category => {
        const asset = enhancedAssets.backgrounds[category];
        legacyFormat.backgrounds[category] = asset.url;
        legacyFormat.gradients[category] = {
          gradient: enhancedAssets.fallbacks[category]?.gradient || `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
          overlay: `bg-gradient-to-br from-black/30 to-black/50`,
          color: enhancedAssets.metadata[category]?.color || '#3B82F6'
        };
      });

      setDashboardAssets(legacyFormat);
      console.log('✅ Enhanced dashboard assets loaded successfully!');
    } catch (error) {
      console.error('Failed to load enhanced dashboard assets:', error);

      // Fallback to legacy method
      try {
        const legacyAssets = await getDashboardBackgrounds();
        setDashboardAssets(legacyAssets);
        console.log('✅ Fallback dashboard assets loaded successfully!');
      } catch (fallbackError) {
        console.error('Failed to load fallback dashboard assets:', fallbackError);
        // Use hardcoded fallbacks
        setDashboardAssets({
          backgrounds: null,
          gradients: {
            applications: {
              gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
              overlay: 'from-blue-900/85 to-blue-800/90',
              color: '#3B82F6'
            },
            interviews: {
              gradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700',
              overlay: 'from-emerald-900/85 to-emerald-800/90',
              color: '#10B981'
            },
            profileViews: {
              gradient: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700',
              overlay: 'from-indigo-900/85 to-indigo-800/90',
              color: '#8B5CF6'
            },
            savedJobs: {
              gradient: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
              overlay: 'from-amber-900/85 to-amber-800/90',
              color: '#F59E0B'
            }
          }
        });
        console.log('✅ Hardcoded fallback assets loaded!');
      }
    }
  };

  const loadUpcomingInterviews = async () => {
    try {
      setUpcomingLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/interviews/my?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = (data.interviews || [])
          .filter(iv => iv.status !== 'cancelled')
          .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
          .slice(0, 3);
        setUpcomingInterviews(list);
      }
    } catch (err) {
      console.error('Failed to load upcoming interviews:', err);
    } finally {
      setUpcomingLoading(false);
    }
  };

  const loadSessionCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/sessions/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to load session count:', err);
    }
  };

  const formatInterviewWhen = (iso, tz) => {
    if (!iso) return '';
    const d = new Date(iso);
    const date = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}${tz ? ` (${tz})` : ''}`;
  };

  // Function to calculate profile completion
  const calculateProfileCompletion = (profileData) => {
    const profileFields = [
      { key: 'name', label: 'Full Name', weight: 10 },
      { key: 'title', label: 'Professional Title', weight: 10 },
      { key: 'phone', label: 'Phone Number', weight: 8 },
      { key: 'location', label: 'Location', weight: 8 },
      { key: 'bio', label: 'Professional Bio', weight: 12 },
      { key: 'skills', label: 'Skills', weight: 15 },
      { key: 'languages', label: 'Languages', weight: 8 },
      { key: 'experience', label: 'Experience Level', weight: 10 },
      { key: 'profilePicture', label: 'Profile Picture', weight: 7 },
      { key: 'expectedSalary', label: 'Expected Salary', weight: 8 },
      { key: 'remotePreference', label: 'Remote Preference', weight: 4 }
    ];

    let completedWeight = 0;
    const completedItems = [];
    const incompleteItems = [];

    profileFields.forEach(field => {
      const value = profileData[field.key];
      let isComplete = false;

      if (field.key === 'skills' || field.key === 'languages') {
        isComplete = Array.isArray(value) && value.length > 0;
      } else if (field.key === 'expectedSalary') {
        isComplete = value && (value.min || value.max);
      } else if (field.key === 'profilePicture') {
        isComplete = value && value.trim() !== '';
      } else {
        isComplete = value && value.toString().trim() !== '';
      }

      if (isComplete) {
        completedWeight += field.weight;
        completedItems.push({ label: field.label, completed: true });
      } else {
        incompleteItems.push({ label: field.label, completed: false });
      }
    });

    // Add resume upload check
    const hasResume = profileData?.resume && profileData.resume.trim() !== '';
    if (hasResume) {
      completedWeight += 8;
      completedItems.push({ label: 'Resume Uploaded', completed: true });
    } else {
      incompleteItems.push({ label: 'Resume Uploaded', completed: false });
    }

    const percentage = Math.min(100, Math.round(completedWeight));
    return {
      percentage,
      items: [...completedItems, ...incompleteItems]
    };
  };

  // Function to load profile data
  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const profileData = {
          name: data.user.name || '',
          title: data.user.title || '',
          phone: data.user.phone || '',
          location: data.user.location || '',
          bio: data.user.bio || '',
          skills: data.user.skills || [],
          languages: data.user.languages || [],
          experience: data.user.experience || '',
          profilePicture: data.user.profilePhoto || '',
          expectedSalary: {
            min: data.user.expectedSalary?.min || '',
            max: data.user.expectedSalary?.max || ''
          },
          remotePreference: data.user.remotePreference || '',
          resume: data.user.resume || ''
        };
        const completion = calculateProfileCompletion(profileData);
        setProfileCompletion(completion);
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  };

  // Function to load user applications
  const loadUserApplications = async () => {
    try {
      setApplicationsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/applications/my-applications`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.applications) {
          // Format the applications to match the expected structure
          const formattedApplications = data.applications.slice(0, 4).map(app => ({
            _id: app.jobId?._id || app._id,
            title: app.jobTitle || app.jobId?.title,
            company: app.companyName || app.jobId?.company,
            location: app.jobId?.location || 'Location not specified',
            jobType: app.jobId?.jobType || 'Full-time',
            appliedAt: app.appliedAt,
            status: app.applicationStatus,
            employer: {
              companyName: app.companyName,
              companyLogo: null // Will be populated from job data if needed
            }
          }));
          setUserApplications(formattedApplications);
        }
        // Set total applications count (supports both controllers)
        setApplicationsCount(
          (typeof data.count === 'number' ? data.count : (data.pagination?.total || 0))
        );
      }
    } catch (error) {
      console.error("Failed to load user applications:", error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Function to load saved jobs count
  const loadSavedJobsCount = async () => {
    try {
      setSavedJobsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/saved-jobs/my-jobs?limit=1`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSavedJobsCount(data.pagination?.total || 0);
        }
      }
    } catch (error) {
      console.error("Failed to load saved jobs count:", error);
    } finally {
      setSavedJobsLoading(false);
    }
  };

  // Function to load interview invites count
  const loadInterviewInvites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/interviews/my?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // We only get the list; compute total via a secondary request or header in future.
        // For now, fetch with a larger limit and count locally (data sets are typically small).
        const resAll = await fetch(`${API_BASE_URL}/api/interviews/my?limit=500`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resAll.ok) {
          const data = await resAll.json();
          setInterviewCount(Array.isArray(data.interviews) ? data.interviews.length : 0);
        }
      }
    } catch (err) {
      console.error('Failed to load interview invites:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/user/notifications/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const formatTimeAgo = (iso) => {
    if (!iso) return '';
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return new Date(iso).toLocaleDateString();
  };

  const handleViewJob = async (jobId) => {
    try {
      // First, try to find the job in userApplications (has application data)
      const existingJob = userApplications.find(job => job._id === jobId);
      if (existingJob) {
        // Use the job data from userApplications which includes application info
        setSelectedJob({
          ...existingJob,
          status: existingJob.application?.status || 'applied',
          appliedAt: existingJob.application?.appliedAt
        });
        setShowJobModal(true);
        return;
      }

      // If not found in userApplications, fetch from API
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data.job);
        setShowJobModal(true);
      } else {
        console.error('Failed to fetch job details');
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
    }
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setSelectedJob(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Create enhanced dashboard stats with Cloudinary images
  const getJobStats = () => {
    const baseStats = [
      {
        id: "applications",
        title: "Applications Sent",
        value: applicationsLoading ? "..." : applicationsCount.toString(),
        change: applicationsCount > 0 ? "+" + Math.min(100, Math.floor(applicationsCount * 0.05)) + "%" : "0%",
        changeType: applicationsCount > 0 ? "positive" : "neutral",
        description: "Job applications submitted this month",
        icon: "📝",
        iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        backgroundImage: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756236764/desones_vkv4fh.png"
      },
      {
        id: "interviews",
        title: "Interview Invites",
        value: interviewCount.toString(),
        change: interviewCount > 0 ? "+" + Math.min(100, Math.floor(interviewCount * 5)) + "%" : "0%",
        changeType: "positive",
        description: "Interview opportunities this month",
        icon: "🎯",
        iconPath: "M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4",
        backgroundImage: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756236776/destwos_ub4yxy.png"
      },
      {
        id: "profileViews",
        title: "Profile Views",
        value: "0",
        change: "0%",
        changeType: "positive",
        description: "Employers viewed your profile",
        icon: "👁️",
        iconPath: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
        backgroundImage: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756236921/desthrees_yqomx3.png"
      },
      {
        id: "mySessions",
        title: "My Sessions",
        value: sessionCount.toString(),
        change: sessionCount > 0 ? "+" + sessionCount : "0",
        changeType: "positive",
        description: "Scheduled mentor sessions",
        icon: "📅",
        iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        backgroundImage: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756236776/destwos_ub4yxy.png" // Reusing an image or using a new one if available
      },
      {
        id: "savedJobs",
        title: "Saved Jobs",
        value: savedJobsLoading ? "..." : savedJobsCount.toString(),
        change: savedJobsCount > 0 ? "+" + Math.min(100, Math.floor(savedJobsCount * 0.1)) + "%" : "0%",
        changeType: savedJobsCount > 0 ? "positive" : "neutral",
        description: "Jobs saved for future reference",
        icon: "❤️",
        iconPath: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
        backgroundImage: "https://res.cloudinary.com/dxspcarx8/image/upload/v1756236931/desfourss_hklwst.png"
      },
    ];

    // If dashboard assets are loaded, use Cloudinary images, otherwise use direct URLs
    return baseStats.map(stat => ({
      ...stat,
      backgroundImage: dashboardAssets?.backgrounds?.[stat.id] || stat.backgroundImage,
      fallbackGradient: dashboardAssets?.gradients?.[stat.id]?.gradient || `bg-gradient-to-br from-${stat.id === 'applications' ? 'blue' : stat.id === 'interviews' ? 'emerald' : stat.id === 'profileViews' ? 'indigo' : 'amber'}-500 to-${stat.id === 'applications' ? 'blue' : stat.id === 'interviews' ? 'emerald' : stat.id === 'profileViews' ? 'indigo' : 'amber'}-700`,
      gradientOverlay: dashboardAssets?.gradients?.[stat.id]?.overlay || `from-${stat.id === 'applications' ? 'blue' : stat.id === 'interviews' ? 'emerald' : stat.id === 'profileViews' ? 'indigo' : 'amber'}-900/85 to-${stat.id === 'applications' ? 'blue' : stat.id === 'interviews' ? 'emerald' : stat.id === 'profileViews' ? 'indigo' : 'amber'}-800/90`
    }));
  };

  const jobStats = getJobStats();


  // Helper function to format salary
  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return 'Salary not specified';
    if (salary.min && salary.max) {
      return `${salary.currency || 'USD'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    if (salary.min) return `${salary.currency || 'USD'} ${salary.min.toLocaleString()}+`;
    if (salary.max) return `Up to ${salary.currency || 'USD'} ${salary.max.toLocaleString()}`;
    return 'Salary not specified';
  };

  // Helper function to format date
  const formatApplicationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Professional Header - Indeed/Naukri Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">JobZee</h1>
                  <p className="text-xs text-gray-500 -mt-1">Find your dream job</p>
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">

              {/* Shop Link */}
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors shadow"
              >
                <span className="mr-2">🛒</span> Shop
              </Link>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-8.5-9.5a3.5 3.5 0 117 0v9a.5.5 0 01-.5.5h-6a.5.5 0 01-.5-.5v-9zM13 7.5V6a3 3 0 00-6 0v1.5" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                      ) : notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => markNotificationAsRead(notification._id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">User Dashboard</p>
                </div>
                <div className="relative group">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer group-hover:border-blue-300 transition-all duration-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer group-hover:border-blue-300 transition-all duration-200 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/profile" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>My Profile</span>
                      </Link>
                      <Link to="/my-applications" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>My Applications</span>
                      </Link>
                      <Link to="/my-sessions" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>My Sessions</span>
                      </Link>
                      <Link to="/saved-jobs" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Saved Jobs</span>
                      </Link>
                      <Link to="/internships" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0-7l9-5-9-5-9 5 9 5z" />
                        </svg>
                        <span>Internships</span>
                      </Link>
                      <Link to="/my-internship-applications" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>My Internship Applications</span>
                      </Link>
                      <Link to="/settings" className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Hero Section - Indeed Style */}
        <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8 ${animate ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 relative">
            {/* Professional background pattern */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-blue-600 opacity-90"></div>
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
              <div className="flex-1 text-center lg:text-left mb-8 lg:mb-0">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border-2 border-white/50 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Welcome, {user.name.split(' ')[0]}!
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Ready to take the next step in your career?
                    </p>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto lg:mx-0">
                  <p className="text-xl text-blue-50 mb-8 leading-relaxed">
                    Explore personalized job recommendations, track your applications, and connect with top employers.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <Link
                      to="/jobs"
                      className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search Jobs</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Professional illustration */}
              <div className="hidden xl:block">
                <div className="relative">
                  <div className="w-48 h-48 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <img
                      src="https://res.cloudinary.com/dxspcarx8/image/upload/v1756236090/desten_notf9n.png"
                      alt="Professional workspace"
                      className="w-40 h-40 rounded-xl object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-green-500 text-white p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute -top-4 -left-4 bg-white text-blue-600 px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
                    Profile {profileCompletion.percentage}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Stats Grid - Enhanced with Cloudinary */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${animate ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
          {jobStats.map((stat, index) => (
            <div
              key={stat.id}
              onClick={() => {
                if (stat.id === 'applications') navigate('/my-applications');
                else if (stat.id === 'interviews') navigate('/interviews');
                else if (stat.id === 'mySessions') navigate('/my-sessions');
                else if (stat.id === 'savedJobs') navigate('/saved-jobs');
              }}
              className="group relative rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-1"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {/* Enhanced Background with Image/Gradient */}
              <div className="absolute inset-0">
                {stat.backgroundImage ? (
                  <>
                    <img
                      src={stat.backgroundImage}
                      alt={stat.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        // Hide image and show gradient fallback
                        e.target.style.display = 'none';
                        const fallbackElement = e.target.nextElementSibling;
                        if (fallbackElement) {
                          fallbackElement.classList.remove('hidden');
                        }
                      }}
                      onLoad={(e) => {
                        // Ensure image is visible when loaded
                        e.target.style.display = 'block';
                      }}
                    />
                    {/* Gradient Fallback */}
                    <div className={`hidden w-full h-full ${stat.fallbackGradient}`}></div>
                    {/* Dark Overlay for Text Readability */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientOverlay} group-hover:opacity-90 transition-opacity duration-300`}></div>
                  </>
                ) : (
                  /* Pure Gradient Background */
                  <>
                    <div className={`w-full h-full ${stat.fallbackGradient}`}></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 group-hover:opacity-90 transition-opacity duration-300"></div>
                  </>
                )}
              </div>

              {/* Content with Enhanced Styling */}
              <div className="relative z-10 p-6 h-40 flex flex-col justify-between">
                {/* Header with Change Indicator */}
                <div className="flex items-center justify-between mb-auto">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-xs font-bold text-white">{stat.change}</span>
                  </div>
                  <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide uppercase">{stat.title}</h3>
                  <p className="text-4xl font-bold text-white leading-none group-hover:text-white transition-colors duration-300">{stat.value}</p>
                  <p className="text-xs text-white/80 font-medium">{stat.description}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-white/70">Last 30 days</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Subtle Border Effect */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 ${animate ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <Link
                to="/jobs"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Find Jobs</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/events"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl hover:from-teal-100 hover:to-emerald-100 transition-all duration-300 border border-emerald-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-500 rounded-lg group-hover:bg-teal-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m6 7H4m0 0v6a2 2 0 002 2h12a2 2 0 002-2v-6M4 14l2-7h12l2 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Explore Events</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/applications"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">My Applications</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/interviews"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 border border-emerald-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">My Interviews</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/internships"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all duration-300 border border-orange-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0-7l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Apply to Internships</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/mentors"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl hover:from-violet-100 hover:to-fuchsia-100 transition-all duration-300 border border-violet-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-violet-500 rounded-lg group-hover:bg-violet-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Find a Mentor</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/tests"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl hover:from-rose-100 hover:to-red-100 transition-all duration-300 border border-rose-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rose-500 rounded-lg group-hover:bg-rose-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Practice Arena</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                to="/learning-hub"
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl hover:from-indigo-100 hover:to-cyan-100 transition-all duration-300 border border-indigo-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">Learning Hub</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Profile Strength</h3>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white opacity-90">Completion</span>
                  <span className="font-bold text-2xl">{profileCompletion.percentage}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                  <div className="bg-white h-3 rounded-full transition-all duration-1000" style={{ width: `${profileCompletion.percentage}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                {profileCompletion.items.slice(0, 3).map((item, index) => (
                  <div key={index} className={`flex items-center justify-between text-sm ${item.completed ? '' : 'opacity-60'}`}>
                    <span className={item.completed ? 'opacity-90' : ''}>{item.label}</span>
                    {item.completed ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    )}
                  </div>
                ))}
                {profileCompletion.items.length > 3 && (
                  <div className="text-sm opacity-75 text-center pt-2">
                    +{profileCompletion.items.length - 3} more items
                  </div>
                )}
              </div>

              {/* Complete Profile Button */}
              {(profileCompletion.percentage < 100 || user?.onboardingSkipped) && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    {user?.onboardingSkipped ? 'Complete Your Profile' : 'Improve Profile'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interview Tracker */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upcoming Interviews</h3>
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {upcomingLoading ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600">Loading...</div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">No upcoming interviews</h4>
                <p className="text-sm text-gray-600 mt-1">You’ll see scheduled interviews here once scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((iv) => (
                  <div key={iv._id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{iv.applicationId?.companyName || iv.jobId?.company || 'Company'}</p>
                        <p className="text-sm text-gray-700">{iv.applicationId?.jobTitle || iv.jobId?.title || 'Job Title'}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatInterviewWhen(iv.scheduledAt, iv.timezone)}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">{iv.status}</span>
                        <div className="mt-2 text-xs text-gray-500">{iv.locationType === 'online' ? 'Online' : iv.locationType === 'in_person' ? 'In person' : iv.locationType === 'phone' ? 'Phone' : 'Other'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modern Job Applications Section */}
        <div className={`bg-white rounded-2xl shadow-lg border-0 overflow-hidden ${animate ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
          }`}>
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Your Job Applications</h3>
                  <p className="text-sm text-gray-600">Track your recent applications and their status</p>
                </div>
              </div>
              <Link
                to="/applications"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                View All
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {applicationsLoading ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">Loading your applications...</p>
              </div>
            ) : userApplications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start applying to jobs to see them here</p>
                <Link
                  to="/jobs"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              userApplications.map((job, index) => (
                <div key={job._id} className={`p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group cursor-pointer`} style={{ animationDelay: `${1000 + index * 200}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <img
                            src={job.employer?.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=3b82f6&color=fff&size=64`}
                            alt={job.company}
                            className="w-14 h-14 rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=3b82f6&color=fff&size=64`;
                            }}
                          />
                          {job.remote === 'remote' && (
                            <div className="absolute -top-1 -right-1 bg-green-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              Remote
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{job.title}</h4>
                              <p className="text-gray-600 font-medium">{job.company}</p>

                              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{job.location}</span>
                                </span>

                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                  <span className="font-semibold text-gray-700">{formatSalary(job.salary)}</span>
                                </span>

                                <span className="flex items-center space-x-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}</span>
                                </span>
                              </div>

                              {/* Skills */}
                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {job.skills.slice(0, 4).map((skill, skillIndex) => (
                                    <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                      {skill}
                                    </span>
                                  ))}
                                  {job.skills.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                                      +{job.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${job.status === "applied" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          job.status === "reviewed" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            job.status === "shortlisted" ? "bg-green-50 text-green-700 border-green-200" :
                              job.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                                job.status === "hired" ? "bg-green-50 text-green-700 border-green-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                          }`}>
                          {job.status === "shortlisted" ? "🎯 Shortlisted" :
                            job.status === "reviewed" ? "👀 Reviewed" :
                              job.status === "rejected" ? "❌ Rejected" :
                                job.status === "hired" ? "🎉 Hired" :
                                  "✉️ Applied"}
                        </span>

                        <div className="group/menu relative">
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                            <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">View Details</button>
                            <button
                              onClick={() => handleViewJob(job._id)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              View Job
                            </button>
                            <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg">Withdraw</button>
                          </div>
                        </div>
                      </div>

                      <span className="text-sm text-gray-500 font-medium">{formatApplicationDate(job.appliedAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {userApplications.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {userApplications.length} recent applications
                </p>
                <Link
                  to="/my-applications"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  View All Applications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Internships Section */}
        <RecommendedInternships />
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout? You'll be redirected to the home page.</p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-lg transition duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={showJobModal}
        onClose={closeJobModal}
      />
    </div>
  );
};

export default Dashboard; 