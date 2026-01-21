import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import UserEventSidebar from '../components/UserEventSidebar';

import API_BASE_URL from '../config/api';
const UserEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState(null);
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
    
    // Load event details
    loadEventDetails();
    // Load my registration (if any)
    loadMyRegistration();
  }, [eventId, navigate]);

  const loadEventDetails = async () => {
    setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        const data = await res.json();
        if (data?.success) setEvent(data.event);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistration = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/registration`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success) setRegistration(data.registration);
    } catch (err) {
      // ignore
    }
  };

  const ensureRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

  const registerForEvent = async () => {
    if (!event) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Could not register');
        return;
      }

      // Free event flow
      if (event.type === 'free' || !data.order) {
        toast.success('Registered successfully');
        setRegistration(data.registration || { status: 'registered', ticketType: 'free' });
        await loadEventDetails();
        
        // Redirect to ticket display if ticket is available
        if (data.ticket && data.ticket.ticketId) {
          navigate(`/ticket/${data.ticket.ticketId}`);
        }
        return;
      }

      // Paid event flow
      await ensureRazorpay();
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'JobZee',
        description: event.title,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/events/${eventId}/verify`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            
            if (!verifyRes.ok || !verifyData?.success) {
              toast.error(verifyData?.message || 'Payment verification failed');
              return;
            }
            toast.success('Payment successful. Registered for event.');
            setRegistration(verifyData.registration);
            await loadEventDetails();
            
            // Redirect to ticket display if ticket is available
            if (verifyData.ticket && verifyData.ticket.ticketId) {
              navigate(`/ticket/${verifyData.ticket.ticketId}`);
            }
          } catch (err) {
            console.error(err);
            toast.error('Could not verify payment');
          }
        },
        prefill: {},
        notes: { eventId },
        theme: { color: '#2563eb' }
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err) {
      console.error(err);
      toast.error('Could not register');
    } finally {
      setRegistering(false);
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

  const getProgress = (startDate, endDate) => {
    const now = Date.now();
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (!s || !e || e <= s) return 0;
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  };

  const getTimeLeft = (date) => {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Started';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return `${d}d ${h}h ${m}m`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event?.title || 'Event', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch (e) {
      try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch (_) {}
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

  if (!event) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/events')} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  const isUpcoming = start > new Date();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <UserEventSidebar 
          user={user} 
          onLogout={handleLogout} 
          activeTab="events"
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
        activeTab="events"
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
            <h1 className="text-xl font-bold text-gray-900">Event Details</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
        </div>

          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </button>
          </div>

          {/* Event Hero (Glass + Neon) */}
          <div className="relative rounded-3xl overflow-hidden mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
            {/* Background layer */}
            {(event.bannerUrl || event.bannerURL || event.banner) ? (
              <img 
                src={event.bannerUrl || event.bannerURL || event.banner}
                alt={event.title}
                className="w-full h-[300px] md:h-[360px] object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-[260px] md:h-[320px] bg-gradient-to-r from-fuchsia-500 via-indigo-600 to-cyan-500"></div>
            )}
            {/* Glow gradients */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-fuchsia-500/30 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/30 blur-3xl"></div>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 md:p-5 flex items-start md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                    <span>{event.categories?.[0] || event.tags?.[0] || 'Featured Event'}</span>
                  </div>
                  <h1 className="mt-2 text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                    {event.title}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base mt-1">
                    {new Date(event.startDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="shrink-0">
                  <div className={`px-4 py-2 md:px-5 md:py-3 rounded-2xl text-white font-extrabold tracking-wide shadow-[0_0_30px] ${event.type === 'free' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-fuchsia-600 shadow-fuchsia-500/40'}`}>
                    {event.type === 'free' ? 'FREE' : `₹${Number(event.price).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Content */}
          <div className="p-0 md:p-2">
              {/* Event Details Grid */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="space-y-6">
                  {/* Quick facts */}
                  <div className="rounded-2xl p-5 shadow-lg border border-white/40 bg-white/60 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-indigo-500/40 shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date & Time</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(event.startDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-emerald-500/40 shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Mode & Location</div>
                        <div className="font-semibold text-gray-900 capitalize">{event.mode}</div>
                        {event.mode === 'online' && event.meetingLink && (
                          <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm underline break-all">{event.meetingLink}</a>
                        )}
                        {event.mode === 'offline' && event.venueAddress && (
                          <div className="text-sm text-gray-700">{event.venueAddress}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="rounded-2xl p-5 shadow-lg border border-white/40 bg-white/60 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-cyan-500/40 shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 4v8"/></svg>
                      </div>
                      <div className="font-semibold text-gray-900">Organizer Contact</div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      {event.organizerCompanyName && <div><span className="font-medium">Company:</span> {event.organizerCompanyName}</div>}
                      {event.organizerEmail && <div><span className="font-medium">Email:</span> <a className="text-blue-600 hover:underline" href={`mailto:${event.organizerEmail}`}>{event.organizerEmail}</a></div>}
                      {event.organizerPhone && <div><span className="font-medium">Phone:</span> <a className="text-blue-600 hover:underline" href={`tel:${event.organizerPhone}`}>{event.organizerPhone}</a></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories and Tags */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {event.categories && event.categories.map((category, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 text-indigo-700 border border-indigo-400/30"
                    >
                      {category}
                    </span>
                  ))}
                  {event.tags && event.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-full text-sm font-medium bg-white/60 backdrop-blur border border-gray-300/60 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Event Images Gallery */}
              {event.images && event.images.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Event Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.images.map((img, idx) => (
                      <div key={idx} className="group relative w-full h-40 bg-gray-100 rounded-2xl overflow-hidden border border-white/60 shadow-md">
                        <img
                          src={img}
                          alt={`Event image ${idx+1}`}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={registerForEvent}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-extrabold text-lg tracking-wide hover:from-fuchsia-700 hover:via-violet-700 hover:to-cyan-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-[0_10px_30px] shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transform hover:-translate-y-0.5"
                  disabled={!isUpcoming || registering}
                >
                  {!isUpcoming ? '❌ Event Ended' : (registering ? 'Processing...' : (registration ? '✅ Registered' : '🎯 Register for Event'))}
                </button>
                <button onClick={handleShare} className="flex items-center justify-center px-8 py-4 border-2 border-white/60 bg-white/50 backdrop-blur text-gray-800 rounded-2xl hover:bg-white/70 hover:border-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Event
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEventDetails;







