import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import API_BASE_URL from '../config/api';
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [animate, setAnimate] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const employerData = localStorage.getItem("employer");
    const token = localStorage.getItem("employerToken");
    
    if (!employerData || !token) {
      navigate("/employer/login");
      return;
    }

    setEmployer(JSON.parse(employerData));
    fetchDashboardStats(token);
    fetchJobCount(token);
    fetchRecentJobs(token);
    fetchNotifications(token);
    setAnimate(true);

    // Refresh notifications every 30 seconds
    const notificationInterval = setInterval(() => {
      fetchNotifications(token);
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, [navigate]);

  // Refresh employer data when component becomes visible (e.g., after payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = localStorage.getItem("employerToken");
        if (token) {
          fetchDashboardStats(token);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchDashboardStats = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/dashboard/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        
        // Update local employer data with latest subscription info
        const currentEmployer = JSON.parse(localStorage.getItem("employer") || "{}");
        const updatedEmployer = {
          ...currentEmployer,
          subscriptionPlan: data.stats.subscriptionPlan,
          jobPostingLimit: data.stats.jobPostingLimit,
          jobPostingsUsed: data.stats.jobPostingsUsed
        };
        setEmployer(updatedEmployer);
        localStorage.setItem("employer", JSON.stringify(updatedEmployer));
      } else {
        console.error("Failed to fetch dashboard stats");
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCount = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/jobs`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setJobCount(data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching job count:", err);
    }
  };

  const fetchRecentJobs = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/jobs?limit=3`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRecentJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching recent jobs:", err);
    }
  };

  const fetchNotifications = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications/latest`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('employerToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/employers/notifications/${notificationId}/read`, {
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
    if (diff < 3600) return `${Math.floor(diff/60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`;
    return new Date(iso).toLocaleDateString();
  };

  const canPostMoreJobs = () => {
    if (!employer) return false;
    return employer.subscriptionPlan === 'free' ? jobCount < 1 : true;
  };

  const handlePostJobClick = () => {
    if (!canPostMoreJobs()) {
      setShowUpgradeModal(true);
    } else {
      navigate('/employer/post-job');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("employerToken");
    localStorage.removeItem("employer");
    toast.success("Logged out successfully");
    setTimeout(() => {
      navigate("/employer/login");
    }, 1000);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!employer || !stats) return null;

  const dashboardStats = [
    { 
      title: "Active Job Posts", 
      value: stats.jobPostingsUsed?.toString() || "0", 
      icon: "💼", 
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      // colorful accents
      barGradient: "from-blue-500/0 via-blue-500/30 to-blue-500/0",
      bubbleGradient: "from-blue-400/30 to-blue-600/30",
      pillBg: "bg-emerald-50",
      pillText: "text-emerald-700",
      pillBorder: "border-emerald-200",
      trend: `${stats.remainingJobPosts || 0} remaining`,
      change: "+3%"
    },
    { 
      title: "Total Applications", 
      value: stats.totalApplicationsReceived?.toString() || "0", 
      icon: "📋", 
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      barGradient: "from-green-500/0 via-green-500/30 to-green-500/0",
      bubbleGradient: "from-green-400/30 to-emerald-600/30",
      pillBg: "bg-green-50",
      pillText: "text-green-700",
      pillBorder: "border-green-200",
      trend: "+12 this week",
      change: "+12%"
    },
    { 
      title: "Profile Views", 
      value: stats.profileViews?.toString() || "0", 
      icon: "👁️", 
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      barGradient: "from-indigo-500/0 via-indigo-500/30 to-indigo-500/0",
      bubbleGradient: "from-indigo-400/30 to-violet-600/30",
      pillBg: "bg-indigo-50",
      pillText: "text-indigo-700",
      pillBorder: "border-indigo-200",
      trend: "+5 this week",
      change: "+5%"
    },
    { 
      title: "Hired Candidates", 
      value: stats.totalJobPosts?.toString() || "0", 
      icon: "🎯", 
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      barGradient: "from-rose-500/0 via-rose-500/30 to-rose-500/0",
      bubbleGradient: "from-amber-400/30 to-rose-600/30",
      pillBg: "bg-rose-50",
      pillText: "text-rose-700",
      pillBorder: "border-rose-200",
      trend: "All time",
      change: "+2%"
    }
  ];

  const activityFromNotifications = (notifications || []).map((n) => {
    const type = n.type || 'system';
    let icon = 'ℹ️';
    let color = 'text-gray-600';
    if (type === 'application') { icon = '📝'; color = 'text-blue-600'; }
    else if (type === 'profile') { icon = '👀'; color = 'text-green-600'; }
    else if (type === 'job_status') { icon = '🔥'; color = 'text-orange-600'; }
    return {
      id: n._id,
      icon,
      color,
      message: n.title ? `${n.title}${n.message ? ' – ' + n.message : ''}` : (n.message || ''),
      time: formatTimeAgo(n.createdAt)
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 premium-grid">
      {/* Premium Header with Glassmorphism */}
      <header className="premium-glass border-b border-white/20 sticky top-0 z-50 shadow-lg backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Company Badge */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">JobZee</h1>
                  <p className="text-xs text-gray-500 -mt-1">Employer Dashboard</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">For Employers</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(stats.verificationStatus)}`}>
                  {stats.isVerified ? '✓ Verified' : 'Pending'}
                </div>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Subscription Plan Badge */}
              <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(stats.subscriptionPlan)}`}>
                {stats.subscriptionPlan.charAt(0).toUpperCase() + stats.subscriptionPlan.slice(1)} Plan
              </div>
              
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
                      ) : notifications.map((n) => (
                        <div 
                          key={n._id} 
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`}
                          onClick={() => markNotificationAsRead(n._id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{n.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(n.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100">
                      <Link to="/employer/notifications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all notifications</Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Premium Company Profile */}
              <div className="flex items-center space-x-4">
                {/* Premium Company Info */}
                <div className="text-right hidden sm:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                    <p className="text-sm font-bold text-gray-900 premium-shimmer">{employer.companyName}</p>
                    <p className="text-xs text-gray-600 font-medium">Employer Dashboard</p>
                  </div>
                </div>
                
                {/* Premium Company Avatar with Glassmorphism */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                  
                  {employer.companyLogo ? (
                    <div className="relative">
                      <img 
                        src={employer.companyLogo}
                        alt="Company Logo"
                        className="w-12 h-12 rounded-2xl border-2 border-white/30 cursor-pointer group-hover:border-blue-400/50 transition-all duration-300 object-cover shadow-lg group-hover:shadow-2xl group-hover:scale-110 backdrop-blur-sm"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl cursor-pointer group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 shadow-lg backdrop-blur-sm border border-white/20">
                      {employer.companyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Premium Dropdown Menu with Glassmorphism */}
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0">
                    {/* Premium Header */}
                    <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          {employer.companyLogo ? (
                            <img 
                              src={employer.companyLogo}
                              alt="Company Logo"
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {employer.companyName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg premium-shimmer">{employer.companyName}</p>
                          <p className="text-sm text-gray-600 font-medium">{employer.email}</p>
                          <div className="flex items-center mt-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getSubscriptionColor(stats.subscriptionPlan)}`}>
                              {stats.subscriptionPlan.charAt(0).toUpperCase() + stats.subscriptionPlan.slice(1)} Plan
                            </div>
                            <div className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getVerificationStatusColor(stats.verificationStatus)}`}>
                              {stats.isVerified ? '✓ Verified' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Premium Menu Items */}
                    <div className="p-3">
                      <Link 
                        to="/employer/profile" 
                        className="flex items-center space-x-4 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 group/menu"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover/menu:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Company Profile</span>
                          <p className="text-xs text-gray-500">Manage your company information</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover/menu:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      <Link 
                        to="/employer/settings" 
                        className="flex items-center space-x-4 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 rounded-xl transition-all duration-300 group/menu"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover/menu:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Settings</span>
                          <p className="text-xs text-gray-500">Account preferences & security</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover/menu:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      <Link 
                        to="/employer/billing" 
                        className="flex items-center space-x-4 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl transition-all duration-300 group/menu"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover/menu:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Billing & Invoices</span>
                          <p className="text-xs text-gray-500">Manage subscription & payments</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover/menu:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      <hr className="my-3 border-gray-200/50" />
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-4 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-300 group/menu"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover/menu:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-red-700">Sign Out</span>
                          <p className="text-xs text-red-500">Logout from your account</p>
                        </div>
                        <svg className="w-5 h-5 text-red-400 group-hover/menu:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
        {/* Premium Hero Section with Advanced Effects */}
        <div className={`premium-gradient rounded-3xl border border-white/30 overflow-hidden mb-8 shadow-2xl hover-card ${animate ? 'premium-card-entrance' : 'opacity-0'}`}>
          <div className="premium-hero px-8 py-16 relative">
            {/* Premium floating elements */}
            <div className="absolute inset-0">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl premium-float"></div>
              <div className="absolute bottom-10 left-10 w-24 h-24 bg-purple-300/20 rounded-full blur-lg premium-float" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-pink-300/20 rounded-full blur-md premium-float" style={{animationDelay: '4s'}}></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between">
              <div className="flex-1 text-center lg:text-left mb-8 lg:mb-0">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    {employer.companyLogo ? (
                      <img 
                        src={employer.companyLogo}
                        alt="Company Logo"
                        className="w-12 h-12 rounded-lg border-2 border-white/50 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                        {employer.companyName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-2 premium-shimmer">
                      Welcome, {employer.companyName}!
                    </h2>
                    <p className="text-white/90 text-xl font-medium">
                      Ready to find your next great hire?
                    </p>
                  </div>
                </div>
                
                <div className="max-w-2xl mx-auto lg:mx-0">
                  <p className="text-xl text-white/90 mb-8 leading-relaxed font-medium">
                    Post jobs, review applications, and connect with top talent. Manage your entire recruitment process in one place.
                  </p>
                  <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                    <button
                      onClick={handlePostJobClick}
                      className="premium-btn text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl flex items-center space-x-3 premium-glow"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Post New Job</span>
                    </button>
                    <Link
                      to="/employer/candidates"
                      className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/40 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 hover:border-white/60 transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Browse Candidates</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Professional illustration */}
              <div className="hidden xl:block">
                <div className="relative">
                  <div className="w-48 h-48 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center&auto=format&q=80"
                      alt="Professional workplace"
                      className="w-40 h-40 rounded-xl object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-green-500 text-white p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute -top-4 -left-4 bg-white text-blue-600 px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
                    {stats.subscriptionPlan.charAt(0).toUpperCase() + stats.subscriptionPlan.slice(1)} Plan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Grid with Advanced Effects */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 ${animate ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
          {dashboardStats.map((stat, index) => (
            <div
              key={index}
              className="premium-stat-card relative overflow-hidden rounded-2xl p-8 hover-card group cursor-pointer premium-card-entrance"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {/* subtle top highlight bar using per-card color */}
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.barGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              {/* soft colorful background glow */}
              <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br ${stat.bubbleGradient} opacity-60`} />
              <div className="flex items-center justify-between mb-6">
                <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center text-3xl ${stat.iconColor} ring-2 ring-current/20 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full ${stat.pillBg} ${stat.pillText} border-2 ${stat.pillBorder} text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5-5 5 5" />
                    </svg>
                    <span>{stat.change}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">{stat.title}</h3>
                <p className="text-4xl font-black text-gray-900 mb-2 premium-shimmer">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Quick Actions & Recent Activity */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 ${
          animate ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          {/* Premium Quick Actions */}
          <div className="premium-gradient relative overflow-hidden rounded-2xl p-8 shadow-xl hover-card">
            <div className="pointer-events-none absolute -top-16 -left-10 w-40 h-40 rounded-full blur-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20" />
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span>Quick Actions</span>
            </h3>
            <div className="space-y-4">
              <button 
                onClick={handlePostJobClick}
                className="premium-btn w-full text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">📝</span>
                  <span>Post New Job</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <Link
                to="/employer/my-jobs"
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">👥</span>
                  <span>My Jobs</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/interviews"
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">🗓️</span>
                  <span>Interviews</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/events"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">🎉</span>
                  <span>Events</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/profile"
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">🏢</span>
                  <span>Update Company Profile</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/internships"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">🎓</span>
                  <span>Internships</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/tests"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">📝</span>
                  <span>Assessment Tests</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                to="/employer/billing"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-4 px-6 rounded-2xl transition duration-300 hover:scale-105 font-bold text-lg shadow-xl hover:shadow-2xl block flex items-center justify-between group"
              >
                <span className="flex items-center">
                  <span className="mr-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-2xl">💰</span>
                  <span>Billing & Invoices</span>
                </span>
                <svg className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          {/* Premium Subscription Status */}
          <div className="premium-gradient relative overflow-hidden rounded-2xl p-8 shadow-xl hover-card">
            <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full blur-2xl bg-gradient-to-br from-emerald-400/20 to-blue-400/20" />
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Subscription Status</span>
            </h3>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-semibold text-gray-700">Job Posts Used</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.jobPostingLimit === null || stats.jobPostingLimit === undefined
                    ? `${stats.jobPostingsUsed}/Unlimited`
                    : `${stats.jobPostingsUsed}/${stats.jobPostingLimit}`}
                </span>
              </div>
              <div className="w-full bg-gray-200/70 rounded-full h-3 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-lg" 
                  style={{ 
                    width: stats.jobPostingLimit === null || stats.jobPostingLimit === undefined
                      ? '100%'
                      : `${(stats.jobPostingsUsed / stats.jobPostingLimit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                <span className="text-lg font-semibold text-gray-700">Plan</span>
                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getSubscriptionColor(stats.subscriptionPlan)}`}>
                  {stats.subscriptionPlan.charAt(0).toUpperCase() + stats.subscriptionPlan.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                <span className="text-lg font-semibold text-gray-700">Status</span>
                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${stats.hasActiveSubscription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {stats.hasActiveSubscription ? 'Active' : 'Expired'}
                </span>
              </div>
            </div>
            {stats.subscriptionPlan === 'free' && (
              <Link
                to="/pricing"
                className="premium-btn w-full mt-6 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl block text-center"
              >
                Upgrade Plan
              </Link>
            )}
          </div>

          {/* Premium Recent Activity */}
          <div className="premium-gradient relative overflow-hidden rounded-2xl p-8 shadow-xl hover-card">
            <div className="pointer-events-none absolute -bottom-16 -left-10 w-40 h-40 rounded-full blur-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/20" />
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span>Recent Activity</span>
            </h3>
            <div className="space-y-4">
              {(activityFromNotifications.length > 0 ? activityFromNotifications : []).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-300 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{activity.icon}</span>
                  <div className="flex-1">
                    <p className={`text-lg font-semibold ${activity.color} mb-1`}>{activity.message}</p>
                    <p className="text-sm text-gray-500 font-medium">{activity.time}</p>
                  </div>
                </div>
              ))}
              {activityFromNotifications.length === 0 && (
                <div className="flex items-center text-lg text-gray-500 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl px-6 py-4 w-fit shadow-lg">
                  <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-semibold">No recent activity</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium Job Posts Overview */}
        <div className={`premium-gradient rounded-2xl shadow-xl border border-white/30 ${
          animate ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <div className="p-8 border-b border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                </svg>
              </div>
              <span className="premium-shimmer">Recent Job Posts</span>
            </h3>
          </div>
          <div className="p-8">
            {recentJobs.length > 0 ? (
              <div className="space-y-6">
                {recentJobs.map((job, index) => (
                  <div key={job._id} className="premium-gradient border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                        <p className="text-lg text-gray-600 mb-4 font-medium">{job.location}</p>
                        <div className="flex items-center space-x-6 text-base text-gray-600">
                          <span className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-xl">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">{job.jobType}</span>
                          </span>
                          <span className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-xl">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">{job.experienceLevel}</span>
                          </span>
                          <span className="flex items-center space-x-2 bg-white/50 px-4 py-2 rounded-xl">
                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="font-semibold">{job.salary?.min && job.salary?.max ? `$${job.salary.min} - $${job.salary.max}` : 'Salary not specified'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' :
                          job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status === 'active' ? 'Live' :
                           job.status === 'pending' ? 'Pending' :
                           job.status === 'approved' ? 'Approved' :
                           job.status === 'rejected' ? 'Rejected' :
                           job.status}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-6">
                  <Link 
                    to="/employer/my-jobs"
                    className="premium-btn text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl inline-flex items-center space-x-2"
                  >
                    <span>View All Jobs</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-6 premium-float">🎯</div>
                <h4 className="text-3xl font-bold text-gray-900 mb-4 premium-shimmer">Ready to hire?</h4>
                <p className="text-xl text-gray-600 mb-8 font-medium">Post your first job and start receiving applications from qualified candidates.</p>
                <button 
                  onClick={handlePostJobClick}
                  className="premium-btn text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl premium-glow"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
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
              <p className="text-gray-600 mb-6">Are you sure you want to logout from your employer dashboard?</p>
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

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan Limit Reached</h3>
              <p className="text-gray-600 mb-6">
                Your free plan allows only 1 job posting. To post more jobs and unlock additional features, please upgrade your plan.
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/pricing"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors block text-center"
                >
                  View Pricing Plans
                </Link>
                
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
