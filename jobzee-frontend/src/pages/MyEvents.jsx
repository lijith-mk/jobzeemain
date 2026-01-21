import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserEventSidebar from '../components/UserEventSidebar';

import API_BASE_URL from '../config/api';
const MyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 10 });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const userObj = JSON.parse(userData);
    setUser(userObj);
    
    // Load events
    loadEvents();
  }, [navigate, filters]);

  const loadEvents = async () => {
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

      const res = await fetch(`${API_BASE_URL}/api/events/user/my-events?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data?.success) {
        setEvents(data.events || []);
        setPagination(data.pagination || {});
      } else {
        toast.error(data?.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

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
      case 'registered': return 'bg-green-100 text-green-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'registered': return 'Registered';
      case 'attended': return 'Attended';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return 'Unknown';
    }
  };

  const isEventUpcoming = (startDateTime) => {
    return new Date(startDateTime) > new Date();
  };

  const isEventPast = (endDateTime) => {
    return new Date(endDateTime) < new Date();
  };

  const getEventProgress = (start, end) => {
    const now = Date.now();
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!startMs || !endMs || endMs <= startMs) return 0;
    if (now <= startMs) return 0;
    if (now >= endMs) return 100;
    return Math.round(((now - startMs) / (endMs - startMs)) * 100);
  };

  const handleShareEvent = async (eventId) => {
    const url = `${window.location.origin}/events/${eventId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Check out this event', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Event link copied');
      }
    } catch (e) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Event link copied');
      } catch (_) {
        toast.error('Unable to share link');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <UserEventSidebar 
          user={user} 
          onLogout={handleLogout} 
          activeTab="my-events"
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
        activeTab="my-events"
        onTabChange={handleTabChange}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          {/* Mobile Header with Menu Button */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Events</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Events</h1>
            <p className="text-gray-600">Events you've registered for</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {events.map(registration => (
                <div key={registration._id} className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300">
                  {/* Premium Header */}
                  <div className="relative px-6 py-6 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 text-white">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
                      <div className="absolute -top-12 -right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                      <div className="max-w-2xl">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 ring-1 ring-white/30 mb-2">
                          Registered
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">{registration.eventId?.title}</h3>
                        <p className="text-white/80 text-sm">{registration.eventId?.organizerCompanyName}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold shadow-sm ring-1 ring-white/25 ${getStatusColor(registration.status)}`}>
                          {getStatusText(registration.status)}
                        </div>
                        <p className="text-white/80 text-xs mt-1">
                          {isEventUpcoming(registration.eventId?.startDateTime) ? 'Upcoming' : 
                           isEventPast(registration.eventId?.endDateTime) ? 'Past' : 'Live'}
                        </p>
                      </div>
                    </div>
                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-white/80 mb-2">
                        <span>{formatDate(registration.eventId?.startDateTime)} {formatTime(registration.eventId?.startDateTime)}</span>
                        <span>{formatDate(registration.eventId?.endDateTime)} {formatTime(registration.eventId?.endDateTime)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-white/90 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                          style={{ width: `${getEventProgress(registration.eventId?.startDateTime, registration.eventId?.endDateTime)}%` }}
                        ></div>
                      </div>
                    </div>
                    {/* Corner Ribbon */}
                    <div className="absolute top-0 right-0 translate-x-8 -translate-y-5 rotate-45">
                      <div className="bg-white text-indigo-700 font-semibold text-xs px-6 py-1 shadow-md">Premium</div>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Event Details */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600">{formatDate(registration.eventId?.startDateTime)} @ {formatTime(registration.eventId?.startDateTime)}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-600 capitalize">{registration.eventId?.mode}</span>
                          </div>
                          {registration.eventId?.mode === 'online' && registration.eventId?.meetingLink && (
                            <div className="text-blue-600 text-sm">
                              <a href={registration.eventId.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Registration Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Registration Info</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 text-gray-900 capitalize">{registration.ticketType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <span className="ml-2 text-gray-900">₹{registration.amountPaid}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Payment:</span>
                            <span className="ml-2 text-gray-900 capitalize">{registration.paymentStatus}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Registered:</span>
                            <span className="ml-2 text-gray-900">{formatDate(registration.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Description */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {registration.eventId?.description || 'No description available.'}
                        </p>
                        {registration.eventId?.categories && registration.eventId.categories.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {registration.eventId.categories.slice(0, 3).map((category, index) => (
                                <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                      <Link
                        to={`/events/${registration.eventId?._id}`}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:from-indigo-700 hover:to-blue-700 transition-colors font-medium"
                      >
                        View Event
                      </Link>
                      <Link
                        to={`/my-tickets`}
                        className="px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                      >
                        View Tickets
                      </Link>
                      {registration.eventId?.mode === 'online' && registration.eventId?.meetingLink && (
                        <a
                          href={registration.eventId.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
                        >
                          Join Meeting
                        </a>
                      )}
                      <button
                        onClick={() => handleShareEvent(registration.eventId?._id)}
                        className="px-4 py-2 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-medium"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
              <Link
                to="/events"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Events
              </Link>
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

export default MyEvents;
