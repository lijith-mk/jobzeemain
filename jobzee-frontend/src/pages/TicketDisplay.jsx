import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserEventSidebar from '../components/UserEventSidebar';

import API_BASE_URL from '../config/api';
const TicketDisplay = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
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
    
    // Load ticket details
    loadTicketDetails();
  }, [ticketId, navigate]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/tickets/user/ticket-code/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data?.success) {
        setTicket(data.ticket);
      } else {
        toast.error(data?.message || 'Failed to load ticket');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
      navigate('/events');
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
      month: 'long',
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
            <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/events')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <UserEventSidebar 
          user={user} 
          onLogout={handleLogout} 
          activeTab="tickets"
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
        activeTab="tickets"
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
            <h1 className="text-xl font-bold text-gray-900">My Ticket</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Event Ticket</h1>
            <p className="text-gray-600">Your ticket for the event</p>
          </div>

          {/* Ticket Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{ticket.eventId?.title}</h2>
                    <p className="text-blue-100">{ticket.eventId?.organizerCompanyName}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </div>
                    <p className="text-blue-100 text-sm mt-2">Ticket #{ticket.ticketId}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Event Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Date & Time</p>
                          <p className="text-gray-600">{formatDateTime(ticket.eventId?.startDateTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Mode</p>
                          <p className="text-gray-600 capitalize">{ticket.eventId?.mode}</p>
                          {ticket.eventId?.mode === 'online' && ticket.eventId?.meetingLink && (
                            <p className="text-blue-600 text-sm mt-1">Meeting Link: {ticket.eventId.meetingLink}</p>
                          )}
                          {ticket.eventId?.mode === 'offline' && ticket.eventId?.venueAddress && (
                            <p className="text-gray-600 text-sm mt-1">{ticket.eventId.venueAddress}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Ticket Type</p>
                          <p className="text-gray-600">{ticket.ticketType}</p>
                          {ticket.ticketType === 'Paid' && (
                            <p className="text-gray-600">Price: ₹{ticket.ticketPrice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900">Ticket ID</p>
                        <p className="text-gray-600 font-mono text-sm">{ticket.ticketId}</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">Issued On</p>
                        <p className="text-gray-600">{formatDateTime(ticket.issuedAt)}</p>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">Attendee</p>
                        <p className="text-gray-600">{ticket.userId?.name}</p>
                        <p className="text-gray-500 text-sm">{ticket.userId?.email}</p>
                      </div>

                      {ticket.usedAt && (
                        <div>
                          <p className="font-medium text-gray-900">Used On</p>
                          <p className="text-gray-600">{formatDateTime(ticket.usedAt)}</p>
                        </div>
                      )}

                      {ticket.cancelledAt && (
                        <div>
                          <p className="font-medium text-gray-900">Cancelled On</p>
                          <p className="text-gray-600">{formatDateTime(ticket.cancelledAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                {ticket.qrData && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">QR Code</h3>
                    <div className="flex justify-center">
                      <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                        {ticket.qrImageUrl ? (
                          <img 
                            src={ticket.qrImageUrl} 
                            alt="Ticket QR Code" 
                            className="w-48 h-48"
                          />
                        ) : (
                          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                            <p className="text-gray-500 text-sm text-center">
                              QR Code loading...<br />
                              Data: {ticket.qrData}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-center text-gray-500 text-sm mt-2">
                      Show this QR code at the event entrance
                    </p>
                    <div className="text-center mt-4">
                      <p className="text-xs text-gray-400 font-mono">
                        QR Data: {ticket.qrData}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/events')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Back to Events
                  </button>
                  <button
                    onClick={() => navigate('/my-tickets')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    View All Tickets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDisplay;
