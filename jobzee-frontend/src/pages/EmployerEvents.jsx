import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployerQRScanner from './EmployerQRScanner';
import EventAnalytics from '../components/EventAnalytics';
import EventNotifications from '../components/EventNotifications';

import API_BASE_URL from '../config/api';
const EmployerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEvents: 0, pendingApproval: 0, approvedEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) {
      navigate('/employer/login');
      return;
    }
    fetch(`${API_BASE_URL}/api/employers/events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('List events failed:', res.status, text);
          return { success: false };
        }
        return res.json();
      })
      .then(data => {
        if (data?.success) setEvents(data.events || []);
      })
      .finally(() => setLoading(false));

    // Stats
    fetch(`${API_BASE_URL}/api/employers/events-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        try { return await res.json(); } catch { return {}; }
      })
      .then(data => { if (data?.success) setStats(data.stats); })
      .catch(() => {});
  }, [navigate]);

  const [activeTab, setActiveTab] = useState('events');
  const [showRegsFor, setShowRegsFor] = useState(null);
  const [regs, setRegs] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | price_asc | price_desc | title_asc
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [prevRevenue, setPrevRevenue] = useState(null);
  const [revenueChanged, setRevenueChanged] = useState(false);

  // Watch revenue change for sparkle/pulse
  useEffect(() => {
    const current = Number(stats.totalRevenue || 0);
    if (prevRevenue === null) { setPrevRevenue(current); return; }
    if (current !== prevRevenue) {
      setRevenueChanged(true);
      setPrevRevenue(current);
      const t = setTimeout(() => setRevenueChanged(false), 1400);
      return () => clearTimeout(t);
    }
  }, [stats.totalRevenue, prevRevenue]);

  const openRegs = async (evtId) => {
    setShowRegsFor(evtId);
    setRegsLoading(true);
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/employers/events/${evtId}/registrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success) setRegs(data.registrations || []);
    } finally { setRegsLoading(false); }
  };

  // Compute filtered + sorted events
  const displayedEvents = [...events]
    .filter(evt => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || [evt.title, evt.description, (evt.categories||[]).join(' '), (evt.tags||[]).join(' ')].some(v => (v||'').toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || String(evt.status||'').toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.startDateTime) - new Date(a.startDateTime);
      if (sortBy === 'oldest') return new Date(a.startDateTime) - new Date(b.startDateTime);
      if (sortBy === 'price_asc') return (Number(a.price)||0) - (Number(b.price)||0);
      if (sortBy === 'price_desc') return (Number(b.price)||0) - (Number(a.price)||0);
      if (sortBy === 'title_asc') return String(a.title||'').localeCompare(String(b.title||''));
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      {/* Header Card */}
      <div className="relative bg-gradient-to-br from-slate-100 via-indigo-200/90 to-slate-300/80 rounded-2xl border border-indigo-200 p-5 lg:p-6 shadow-lg mb-6 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-60 pointer-events-none grid-pattern" />
        {/* Soft color blobs */}
        <div className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/0 via-black/0 to-black/10" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-gray-600 mt-1">Create, manage, and track your employer events</p>
          </div>
          <Link to="/employer/events/create" className="btn-modern bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] whitespace-nowrap">+ Create Event</Link>
        </div>
        {/* Controls: Search / Filters / Sort / View */}
        <div className="mt-4 rounded-2xl p-4 border border-blue-200 shadow-md bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-xl">
                <input
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  placeholder="Search events by title, descr..."
                  className="w-full rounded-xl border border-blue-200 pl-11 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-400"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
              </div>
              {/* Status */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⚑</span>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="appearance-none rounded-xl border border-blue-200 pl-8 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
              {/* Sort */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⇅</span>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="appearance-none rounded-xl border border-blue-200 pl-8 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="title_asc">Title: A to Z</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
            {/* View toggle */}
            <div className="inline-flex items-center rounded-xl border border-blue-100 bg-white overflow-hidden shadow-sm">
              <button onClick={()=>setViewMode('grid')} className={`px-3.5 py-2 text-sm font-semibold inline-flex items-center gap-1 ${viewMode==='grid' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`} aria-pressed={viewMode==='grid'}>
                <span>▦</span>
                <span>Grid</span>
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={()=>setViewMode('list')} className={`px-3.5 py-2 text-sm font-semibold inline-flex items-center gap-1 ${viewMode==='list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`} aria-pressed={viewMode==='list'}>
                <span>≣</span>
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {[
            { id: 'events', label: 'My Events', icon: '🎉' },
            { id: 'registrations', label: 'Registrations', icon: '🧾' },
            { id: 'qr-scanner', label: 'QR Scanner', icon: '🔍' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${activeTab===tab.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:shadow'} hover:-translate-y-0.5`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeTab==='events' && (loading ? (
        <div>Loading...</div>
      ) : events.length === 0 ? (
        <div className="bg-white p-6 rounded border text-center">
          <p className="mb-4">No events yet.</p>
          <Link to="/employer/events/create" className="text-blue-600 underline">Create your first event</Link>
        </div>
      ) : (
        <>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
          {[ 
            { label: 'Total Events Created', value: stats.totalEvents, icon: '📅', color: 'from-blue-50 to-indigo-50 text-blue-700', chipBg: 'bg-blue-100', chipBorder: 'border-blue-200' },
            { label: 'Pending Approval', value: stats.pendingApproval, icon: '⏳', color: 'from-amber-50 to-yellow-50 text-amber-700', chipBg: 'bg-amber-100', chipBorder: 'border-amber-200' },
            { label: 'Approved / Active', value: stats.approvedEvents, icon: '✅', color: 'from-emerald-50 to-green-50 text-emerald-700', chipBg: 'bg-emerald-100', chipBorder: 'border-emerald-200' },
            { label: 'Total RSVPs / Tickets', value: stats.totalRegistrations, icon: '🎟️', color: 'from-sky-50 to-cyan-50 text-sky-700', chipBg: 'bg-sky-100', chipBorder: 'border-sky-200' },
            { label: 'Revenue', value: `₹${Number(stats.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'from-rose-50 to-pink-50 text-rose-700', chipBg: 'bg-rose-100', chipBorder: 'border-rose-200', isRevenue: true },
          ].map((card, idx) => {
            const delays = ['animation-delay-100','animation-delay-200','animation-delay-300','animation-delay-400','animation-delay-500'];
            const delayClass = delays[idx] || 'animation-delay-100';
            return (
            <div key={idx} className={`group relative rounded-3xl p-[1.5px] bg-gradient-to-br ${card.color} shadow-sm hover:shadow-lg transition-all animate-slide-in-bottom ${delayClass}`}> 
              <div className="relative rounded-[18px] bg-white/75 backdrop-blur-md border border-white/70 p-6 overflow-hidden">
                <div className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-white/40" />
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.chipBg} ${card.chipBorder} border shadow-sm text-xl`}>{card.icon}</span>
                    <div className="leading-tight">
                      <div className="text-[10px] tracking-widest text-gray-500">{card.label.split(' ')[0]}</div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-600">{card.label.split(' ').slice(1).join(' ') || '\u00A0'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 text-gray-700 border border-white/70">Now</span>
                </div>
                <div className="mt-4 relative">
                  <div className={`text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent ${card.isRevenue && revenueChanged ? 'animate-pulse-slow' : ''}`}>{card.value}</div>
                  {card.isRevenue && revenueChanged && (
                    <>
                      <span className="particle" style={{left:'80%', top:'-6px', width:'6px', height:'6px', background:'#f43f5e'}}></span>
                      <span className="particle" style={{left:'65%', top:'12px', width:'4px', height:'4px', background:'#f59e0b'}}></span>
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
        {viewMode==='grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((evt, idx) => {
            const start = new Date(evt.startDateTime);
            const end = new Date(evt.endDateTime);
            const dateStr = `${start.toLocaleString('en-US', { month: 'short' })} ${String(start.getDate()).padStart(2,'0')} to ${end.toLocaleString('en-US', { month: 'short' })} ${String(end.getDate()).padStart(2,'0')}${start.getFullYear() !== end.getFullYear() ? ' ' + end.getFullYear() : ''}`;
            const timeStr = `@ ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const category = (evt.categories && evt.categories[0]) || (evt.tags && evt.tags[0]) || 'Event';
            const isFree = String(evt.type).toLowerCase() === 'free' || Number(evt.price) === 0;
            const goEdit = () => navigate(`/employer/events/${evt._id}/edit`);
            const delEvent = async () => {
              // eslint-disable-next-line no-restricted-globals
              if (!confirm('Delete this event?')) return;
              try {
                const token = localStorage.getItem('employerToken');
                const res = await fetch(`${API_BASE_URL}/api/employers/events/${evt._id}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                  setEvents(prev => prev.filter(e => e._id !== evt._id));
                }
              } catch (e) {}
            };
            const delays = ['animation-delay-100','animation-delay-200','animation-delay-300','animation-delay-400','animation-delay-500','animation-delay-600'];
            const delayClass = delays[idx % delays.length];
            return (
              <div key={evt._id} className={`group relative bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-lg transition-all animate-slide-in-bottom ${delayClass}`}>
                {/* Colorful banner strip */}
                <div className="relative h-24 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600">
                  {evt.bannerUrl && (
                    <img src={evt.bannerUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-70 transform transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800 shadow border border-white/60">{category}</span>
                    {evt.status === 'pending' && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-black shadow border border-yellow-300">Pending</span>
                    )}
                    {evt.status === 'rejected' && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow border border-red-400">Rejected</span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isFree ? 'bg-emerald-500 text-white' : 'bg-indigo-700 text-white'} shadow border border-white/20`}>{isFree ? 'FREE' : `₹${Number(evt.price).toLocaleString()}`}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 -mt-10 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-white shadow border-2 border-white overflow-hidden flex items-center justify-center">
                      {evt.bannerUrl ? (
                        <img src={evt.bannerUrl} alt="logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🎫</span>
                      )}
                    </div>
                    <div className="text-white font-semibold drop-shadow">{(evt.mode || 'event').toString().toUpperCase()}</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{evt.title}</h3>
                  <p className="text-gray-600 mt-1 line-clamp-2">{evt.description}</p>
                  <div className="text-sm text-gray-700 mt-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="font-medium">{dateStr} {timeStr}</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5" />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button onClick={goEdit} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>
                      <span className="text-gray-300">|</span>
                      <button onClick={delEvent} className="inline-flex items-center gap-1 text-red-600 hover:underline">
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                    <button onClick={() => navigate(`/employer/events/${evt._id}`)} className="inline-flex items-center gap-1 text-emerald-600 hover:underline text-sm">
                      <span>👁️</span>
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
        <div className="space-y-4">
          {displayedEvents.map((evt, idx) => {
            const start = new Date(evt.startDateTime);
            const end = new Date(evt.endDateTime);
            const dateStr = `${start.toLocaleString('en-US', { month: 'short' })} ${String(start.getDate()).padStart(2,'0')} to ${end.toLocaleString('en-US', { month: 'short' })} ${String(end.getDate()).padStart(2,'0')}${start.getFullYear() !== end.getFullYear() ? ' ' + end.getFullYear() : ''}`;
            const timeStr = `@ ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const category = (evt.categories && evt.categories[0]) || (evt.tags && evt.tags[0]) || 'Event';
            const isFree = String(evt.type).toLowerCase() === 'free' || Number(evt.price) === 0;
            const goEdit = () => navigate(`/employer/events/${evt._id}/edit`);
            const delEvent = async () => {
              // eslint-disable-next-line no-restricted-globals
              if (!confirm('Delete this event?')) return;
              try {
                const token = localStorage.getItem('employerToken');
                const res = await fetch(`${API_BASE_URL}/api/employers/events/${evt._id}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) { setEvents(prev => prev.filter(e => e._id !== evt._id)); }
              } catch (e) {}
            };
            const delays = ['animation-delay-100','animation-delay-200','animation-delay-300','animation-delay-400','animation-delay-500','animation-delay-600'];
            const delayClass = delays[idx % delays.length];
            return (
              <div key={evt._id} className={`bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-lg transition-all animate-slide-in-bottom ${delayClass}`}>
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-56 relative bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600">
                    {evt.bannerUrl && (<img src={evt.bannerUrl} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-70" />)}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-800 shadow">{category}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
                      {isFree ? 'FREE' : `₹${Number(evt.price).toLocaleString()}`}
                    </div>
                    <div className="h-32 sm:h-full" />
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{evt.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{evt.description}</p>
                        <div className="mt-3 text-sm text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="font-medium">{dateStr} {timeStr}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <button onClick={goEdit} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><span>✏️</span><span>Edit</span></button>
                        <span className="text-gray-300">|</span>
                        <button onClick={delEvent} className="inline-flex items-center gap-1 text-red-600 hover:underline"><span>🗑️</span><span>Delete</span></button>
                      </div>
                      <button onClick={() => navigate(`/employer/events/${evt._id}`)} className="inline-flex items-center gap-1 text-emerald-600 hover:underline text-sm"><span>👁️</span><span>View</span></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
        </>
      ))}

      {activeTab==='registrations' && (
        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Select Event</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                <select value={selectedEventId} onChange={async (e)=>{
                const id = e.target.value; setSelectedEventId(id);
                if (!id) { setRegs([]); return; }
                setRegsLoading(true);
                try {
                  const token = localStorage.getItem('employerToken');
                  const res = await fetch(`${API_BASE_URL}/api/employers/events/${id}/registrations`, { headers: { 'Authorization': `Bearer ${token}` } });
                  const data = await res.json();
                  if (data?.success) setRegs(data.registrations || []);
                } finally { setRegsLoading(false); }
              }} className="w-full border border-blue-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Choose an event --</option>
                {events.map(e => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
              </div>
            </div>
            <div>
              <Link to="/employer/events/create" className="btn-modern bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 inline-block">Create Event</Link>
            </div>
          </div>
          {regsLoading ? (
            <div className="text-sm text-gray-600">Loading attendees…</div>
          ) : !selectedEventId ? (
            <div className="text-sm text-gray-600">Choose an event to view attendees.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-50/80 backdrop-blur z-10">
                  <tr className="text-left text-gray-700">
                    <th className="px-4 py-3 font-semibold">User Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">RSVP Status</th>
                    <th className="px-4 py-3 font-semibold">Payment Status</th>
                    <th className="px-4 py-3 font-semibold">Ticket Code</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No registrations yet.</td></tr>
                  ) : regs.map(r => (
                    <tr key={r._id} className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.user?.name || 'User'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.user?.email || ''}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status==='registered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : r.status==='cancelled' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.paymentStatus==='paid' ? 'bg-blue-100 text-blue-700 border border-blue-200' : r.ticketType==='free' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{r.paymentStatus || (r.ticketType==='free' ? 'Free' : 'N/A')}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-gray-800">{r.ticketCode || '–'}</td>
                      <td className="px-4 py-3">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-indigo-300 text-indigo-700 hover:bg-indigo-50">Send Reminder</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab==='analytics' && (
        <EventAnalytics events={events} stats={stats} />
      )}

      {activeTab==='notifications' && (
        <EventNotifications />
      )}

      {/* Registrations Modal */}
      {showRegsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registrations</h3>
              <button onClick={() => { setShowRegsFor(null); setRegs([]); }} className="text-gray-600">✕</button>
            </div>
            {regsLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {regs.length === 0 ? (
                  <div className="text-sm text-gray-600">No registrations</div>
                ) : regs.map(r => (
                  <div key={r._id} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="font-medium text-gray-800">{r.user?.name || 'User'}</div>
                      <div className="text-xs text-gray-600">{r.user?.email || ''}</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="mr-3 capitalize">{r.status}</span>
                      <span className="mr-3 capitalize">{r.paymentStatus || (r.ticketType==='free'?'Free':'N/A')}</span>
                      <span className="mr-3">{r.ticketCode || '–'}</span>
                      <span className="mr-3 capitalize">{r.ticketType}</span>
                    </div>
                    <div>
                      <button className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Send Reminder</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab==='qr-scanner' && (
        <EmployerQRScanner />
      )}
    </div>
  );
};

export default EmployerEvents;


