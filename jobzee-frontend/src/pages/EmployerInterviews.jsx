import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';

import API_BASE_URL from '../config/api';
const EmployerInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        const res = await fetch(`${API_BASE_URL}/api/interviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch interviews');
        const data = await res.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (d) => new Date(d).toLocaleString();

  const refresh = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/interviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch interviews');
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load interviews');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-slate-100 via-indigo-100/70 to-slate-200/60 p-6 shadow-lg mb-6">
          <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Interviews</h1>
              <p className="text-gray-600 mt-1">Schedule and manage interviews across all your jobs</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/employer/my-jobs" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 shadow-sm">
                <span>←</span>
                <span>Back to My Jobs</span>
              </Link>
              <button onClick={() => setShow(true)} className="btn-modern bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2.5 rounded-xl shadow hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98]">
                + Schedule Interview
              </button>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-md overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-100">
            <div className="text-sm text-gray-700">Create interviews without opening a specific application.</div>
            <button onClick={() => setShow(true)} className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow">
              Schedule Interview
            </button>
          </div>
          {loading ? (
            <div className="p-10 text-center text-gray-600">Loading interviews…</div>
          ) : interviews.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">🗓️</div>
              <p className="mt-3 text-gray-700 font-medium">No interviews scheduled yet</p>
              <p className="text-sm text-gray-500">Start by scheduling your first interview.</p>
              <div className="mt-4">
                <button onClick={() => setShow(true)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow">Schedule Interview</button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-indigo-50">
              {interviews.map((iv) => (
                <div
                  key={iv._id}
                  className="p-5 flex items-start justify-between transition-colors hover:bg-indigo-50/40"
                >
                  <div>
                    <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                      <span>{iv.applicationId?.applicantName}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-indigo-700">{iv.jobId?.title}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      <span className="font-medium">{iv.round || 'Interview'}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(iv.scheduledAt)}</span>
                      {iv.timezone && <span className="ml-1 text-gray-500">({iv.timezone})</span>}
                    </div>
                    {iv.locationDetails && (
                      <div className="text-sm text-gray-600 mt-0.5">Location: {iv.locationType} — {iv.locationDetails}</div>
                    )}
                    {iv.applicationId?.companyName && (
                      <div className="text-sm text-gray-500 mt-0.5">{iv.applicationId.companyName}</div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${
                    iv.status === 'scheduled'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : iv.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {iv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {show && (
        <ScheduleInterviewModal
          isOpen={show}
          onClose={() => setShow(false)}
          onSuccess={() => { toast.success('Interview scheduled'); setShow(false); refresh(); }}
          applicationId={''}
        />
      )}
    </div>
  );
};

export default EmployerInterviews;


