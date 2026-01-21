import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserEventSidebar from '../components/UserEventSidebar';

import API_BASE_URL from '../config/api';
const Participate = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  }, [navigate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events?date=upcoming&sort=recent`);
      const data = await res.json();
      setEvents(data?.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <UserEventSidebar 
          user={user} 
          onLogout={handleLogout} 
          activeTab="participate"
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
        activeTab="participate"
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
            <h1 className="text-xl font-bold text-gray-900">Participate</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Participate in Events</h1>
            <p className="text-gray-600">Join exciting events and enhance your skills</p>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <div key={event._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  {/* Header Bar */}
                  <div className="bg-teal-600 px-4 py-2 flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">
                      {event.categories?.[0] || event.tags?.[0] || 'Event'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      event.type === 'free' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-blue-700 text-white'
                    }`}>
                      {event.type === 'free' ? 'FREE' : `₹${Number(event.price).toLocaleString()}`}
                    </span>
                  </div>

                  {/* Content Area */}
                  <div className="p-4">
                    {/* Department/Organizer */}
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-400 rounded-full flex items-center justify-center mr-3">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">J</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {event.organizer || 'JobZee Events'}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Schedule */}
                    <div className="text-sm text-gray-700 mb-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(event.startDateTime)} @ {formatTime(event.startDateTime)}
                      </div>
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="capitalize">{event.mode}</span>
                      </div>
                    </div>

                    {/* Separator Line */}
                    <div className="w-full h-0.5 bg-red-500 mb-4"></div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <button className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center hover:bg-blue-200 transition-colors">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                      <Link 
                        to={`/events/${event._id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition-colors"
                      >
                        View
                      </Link>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events available</h3>
              <p className="text-gray-500">Check back later for new events to participate in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Participate;
