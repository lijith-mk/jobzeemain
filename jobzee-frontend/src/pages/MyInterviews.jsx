import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const MyInterviews = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadInterviews(token);
  }, [navigate]);

  const loadInterviews = async (token) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/interviews/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load interviews');
      }
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load interviews');
    } finally {
      setLoading(false);
    }
  };

  const respond = async (id, response) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/interviews/${id}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit response');
      }
      toast.success(response === 'accepted' ? 'Interview accepted' : 'Interview declined');
      // Optimistic update
      setInterviews(prev => prev.map(iv => iv._id === id ? { ...iv, candidateResponse: { ...(iv.candidateResponse||{}), status: response, respondedAt: new Date().toISOString() } } : iv));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Action failed');
    }
  };

  const formatDateTime = (iso, tz) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }) + (tz ? ` (${tz})` : '');
    } catch {
      return iso;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-slate-100 via-indigo-100/70 to-slate-200/60 p-6 shadow-lg mb-6">
          <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">My Interviews</h1>
            <p className="text-gray-600 mt-1">Track your upcoming and past interviews</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 rounded-2xl p-6 shadow-md border border-indigo-100">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading interviews…</div>
          ) : interviews.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">🗓️</div>
              <p className="mt-3 text-gray-700 font-medium">No interviews yet</p>
              <p className="text-sm text-gray-500">You’ll see interviews here once employers invite you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((iv) => {
                const employerName = iv.applicationId?.companyName || iv.jobId?.company || '—';
                const jobTitle = iv.applicationId?.jobTitle || iv.jobId?.title || '—';
                const dateStr = formatDateTime(iv.scheduledAt, iv.timezone);
                const mode = iv.locationType === 'online' ? 'Online' : iv.locationType === 'in_person' ? 'In person' : iv.locationType === 'phone' ? 'Phone' : 'Other';
                const location = iv.locationDetails || (iv.locationType === 'online' ? 'Link will be provided' : '—');
                const responseStatus = iv.candidateResponse?.status || 'pending';
                return (
                  <div
                    key={iv._id}
                    className="border border-indigo-100 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 cursor-pointer transition bg-white/90"
                    onClick={() => setSelected(iv)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{employerName}</p>
                        <p className="text-sm text-indigo-700">{jobTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
                        <p className="text-xs text-gray-500">{mode}{location ? ` • ${location}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">{iv.status}</span>
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs border shadow-sm ${responseStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : responseStatus === 'declined' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{responseStatus}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        disabled={responseStatus === 'accepted'}
                        onClick={(e) => { e.stopPropagation(); respond(iv._id, 'accepted'); }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${responseStatus === 'accepted' ? 'bg-emerald-100 text-emerald-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                      >
                        Accept
                      </button>
                      <button
                        disabled={responseStatus === 'declined'}
                        onClick={(e) => { e.stopPropagation(); respond(iv._id, 'declined'); }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${responseStatus === 'declined' ? 'bg-rose-100 text-rose-500 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Details modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative bg-white/90 backdrop-blur rounded-xl p-6 max-w-lg w-full border border-indigo-100 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Interview Details</h2>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employer</span>
                  <span className="text-gray-900">{selected.applicationId?.companyName || selected.jobId?.company || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Job Title</span>
                  <span className="text-gray-900">{selected.applicationId?.jobTitle || selected.jobId?.title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">When</span>
                  <span className="text-gray-900">{formatDateTime(selected.scheduledAt, selected.timezone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timezone</span>
                  <span className="text-gray-900">{selected.timezone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-gray-900">{selected.duration ? `${selected.duration} min` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className="text-gray-900">{selected.locationType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location/Link</span>
                  <div className="text-gray-900">{selected.locationDetails || '—'}</div>
                </div>
                {selected.note && (
                  <div>
                    <span className="text-gray-500">Note</span>
                    <div className="text-gray-900">{selected.note}</div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  disabled={selected.candidateResponse?.status === 'accepted'}
                  onClick={() => { respond(selected._id, 'accepted'); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${selected.candidateResponse?.status === 'accepted' ? 'bg-emerald-100 text-emerald-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                >
                  Accept
                </button>
                <button
                  disabled={selected.candidateResponse?.status === 'declined'}
                  onClick={() => { respond(selected._id, 'declined'); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${selected.candidateResponse?.status === 'declined' ? 'bg-rose-100 text-rose-500 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                >
                  Decline
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInterviews;


