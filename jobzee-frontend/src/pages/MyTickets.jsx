import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserEventSidebar from '../components/UserEventSidebar';

import API_BASE_URL from '../config/api';
const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 10 });
  const [pagination, setPagination] = useState({});
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const userObj = JSON.parse(userData);
    setUser(userObj);
    
    // Load tickets
    loadTickets();
  }, [navigate, filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      params.set('page', filters.page);
      params.set('limit', filters.limit);

      const res = await fetch(`${API_BASE_URL}/api/tickets/user/my-tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data?.success) {
        setTickets(data.tickets || []);
        setPagination(data.pagination || {});
      } else {
        toast.error(data?.message || 'Failed to load tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    console.log('Tab changed to:', tab);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200';
      case 'used': return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200';
      default: return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'used': return 'Used';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <UserEventSidebar 
          user={user} 
          onLogout={handleLogout} 
          activeTab="my-tickets"
          onTabChange={handleTabChange}
        />
      </div>

      {/* Mobile Sidebar */}
      <UserEventSidebar 
        isMobile
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user} 
        onLogout={handleLogout} 
        activeTab="my-tickets"
        onTabChange={handleTabChange}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 grid place-items-center text-gray-700 dark:text-gray-200 hover-lift"
            >
              {isDark ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a9 9 0 11-10.63-10.6 1 1 0 00-1.13 1.63A7 7 0 1019.93 12a1 1 0 001.71 1z"/></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-2v3h2zm0 19v-3h-2v3h2zm8-11h3v-2h-3v2zM1 12H4v-2H1v2zm15.24-7.16l1.42 1.42 1.79-1.8-1.41-1.41-1.8 1.79zM4.22 18.36l-1.8 1.79 1.41 1.41 1.8-1.79-1.41-1.41z"/></svg>
              )}
            </button>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Tickets</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your event tickets</p>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover-lift"
            >
              {isDark ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a9 9 0 11-10.63-10.6 1 1 0 00-1.13 1.63A7 7 0 1019.93 12a1 1 0 001.71 1z"/></svg>
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.45 14.32l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 4V1h-2v3h2zm0 19v-3h-2v3h2zm8-11h3v-2h-3v2zM1 12H4v-2H1v2zm15.24-7.16l1.42 1.42 1.79-1.8-1.41-1.41-1.8 1.79zM4.22 18.36l-1.8 1.79 1.41 1.41 1.8-1.79-1.41-1.41z"/></svg>
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 opacity-60 pointer-events-none"></div>
            <div className="relative p-6 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Filter by Status</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleFilterChange({ status: '' })} className={`px-3 py-1.5 rounded-full text-sm transition-all ${!filters.status ? 'bg-gray-900 text-white shadow dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>All</button>
                  <button onClick={() => handleFilterChange({ status: 'valid' })} className={`px-3 py-1.5 rounded-full text-sm transition-all ${filters.status==='valid' ? 'bg-emerald-600 text-white shadow' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Valid</button>
                  <button onClick={() => handleFilterChange({ status: 'used' })} className={`px-3 py-1.5 rounded-full text-sm transition-all ${filters.status==='used' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Used</button>
                  <button onClick={() => handleFilterChange({ status: 'cancelled' })} className={`px-3 py-1.5 rounded-full text-sm transition-all ${filters.status==='cancelled' ? 'bg-rose-600 text-white shadow' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Cancelled</button>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
                  <div className="h-32 bg-gradient-to-r from-blue-600/80 to-purple-600/80 animate-pulse" />
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {tickets.map(ticket => (
                <div key={ticket._id} className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift">
                  {/* Ticket Ribbon */}
                  <div className="absolute -left-10 top-6 -rotate-12">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-1.5 text-xs font-semibold tracking-wider rounded-full shadow">
                      #{ticket.ticketId}
                    </div>
                  </div>

                  {/* Ticket Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{ticket.eventId?.title}</h3>
                        <p className="text-blue-100 text-sm">{ticket.eventId?.organizerCompanyName}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-white/95 dark:bg-gray-900/90 ${getStatusColor(ticket.status).replace('bg-', 'bg-')}`}>
                          <span className={`inline-block w-2 h-2 rounded-full ${ticket.status==='valid' ? 'bg-emerald-500' : ticket.status==='used' ? 'bg-blue-500' : ticket.status==='cancelled' ? 'bg-rose-500' : 'bg-gray-500'}`}></span>
                          {getStatusText(ticket.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Event Details */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Event Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">{formatDate(ticket.eventId?.startDateTime)} @ {formatTime(ticket.eventId?.startDateTime)}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{ticket.eventId?.mode}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ticket Info</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Type:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-200">{ticket.ticketType}</span>
                            {ticket.ticketType === 'Paid' && (
                              <span className="ml-2 text-gray-600 dark:text-gray-300">(₹{ticket.ticketPrice})</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Issued:</span>
                            <span className="ml-2 text-gray-900 dark:text-gray-200">{formatDate(ticket.issuedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-center">
                        <Link
                          to={`/ticket/${ticket.ticketId}`}
                          className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-all text-center font-medium mb-2 hover-glow"
                        >
                          <span className="relative z-10">View Ticket</span>
                          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></span>
                        </Link>
                        <Link
                          to={`/events/${ticket.eventId?._id}`}
                          className="group relative overflow-hidden bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-all text-center font-medium hover-glow"
                        >
                          <span className="relative z-10">View Event</span>
                          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && tickets.length === 0 && (
            <div className="relative overflow-hidden text-center py-16 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-70"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-2xl opacity-70"></div>
              <div className="relative">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white grid place-items-center shadow-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Discover events and claim your first ticket.</p>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:shadow-md transition-all font-medium"
                >
                  <span>Browse Events</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.current} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
