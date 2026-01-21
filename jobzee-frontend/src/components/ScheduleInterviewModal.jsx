import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const ScheduleInterviewModal = ({ isOpen, onClose, onSuccess, applicationId, defaultTimezone }) => {
  const [form, setForm] = useState({
    round: '',
    date: '',
    time: '',
    timezone: defaultTimezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
    duration: 30,
    locationType: 'online',
    locationDetails: '',
    interviewers: [{ name: '', email: '' }],
    note: '',
    appId: applicationId || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const loadJobs = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        const res = await fetch(`${API_BASE_URL}/api/employers/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch {}
    };
    loadJobs();
  }, [isOpen]);

  useEffect(() => {
    const loadCandidates = async () => {
      if (!selectedJobId) return;
      try {
        const token = localStorage.getItem('employerToken');
        const res = await fetch(`${API_BASE_URL}/api/applications/job/${selectedJobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates((data.applications || []).map(a => ({ id: a._id, name: a.applicantName, email: a.applicantEmail })));
        }
      } catch {}
    };
    loadCandidates();
  }, [selectedJobId]);

  if (!isOpen) return null;

  const setField = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const setInterviewer = (idx, key, value) => {
    setForm(prev => {
      const arr = [...prev.interviewers];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, interviewers: arr };
    });
  };

  const addInterviewer = () => setForm(prev => ({ ...prev, interviewers: [...prev.interviewers, { name: '', email: '' }] }));
  const removeInterviewer = (idx) => setForm(prev => ({ ...prev, interviewers: prev.interviewers.filter((_, i) => i !== idx) }));

  const isValidEmail = (email) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(email || '').toLowerCase());

  const validate = () => {
    const newErrors = {};

    if (!applicationId && !form.appId) {
      newErrors.appId = 'Select a candidate';
    }

    if (!form.round?.trim()) newErrors.round = 'Round is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.time) newErrors.time = 'Time is required';

    if (form.date && form.time) {
      const dt = new Date(`${form.date}T${form.time}`);
      if (isNaN(dt.getTime())) newErrors.time = 'Provide a valid date & time';
      else if (dt.getTime() < Date.now()) newErrors.time = 'Schedule must be in the future';
    }

    if (!form.timezone?.trim()) newErrors.timezone = 'Timezone is required';

    const durationNum = Number(form.duration);
    if (!durationNum || durationNum <= 0) newErrors.duration = 'Duration must be a positive number';
    else if (durationNum > 720) newErrors.duration = 'Duration seems too long';

    if (!form.locationType) newErrors.locationType = 'Location type is required';
    if (!form.locationDetails?.trim()) newErrors.locationDetails = 'Provide meeting link or address';

    // Interviewers: require at least one with name and valid email
    const filledInterviewers = form.interviewers.filter(iv => iv.name?.trim() || iv.email?.trim());
    if (filledInterviewers.length === 0) {
      newErrors.interviewers = 'Add at least one interviewer';
    } else {
      filledInterviewers.forEach((iv, idx) => {
        if (!iv.name?.trim()) newErrors[`interviewer_name_${idx}`] = 'Name required';
        if (!iv.email?.trim()) newErrors[`interviewer_email_${idx}`] = 'Email required';
        else if (!isValidEmail(iv.email)) newErrors[`interviewer_email_${idx}`] = 'Invalid email';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    const appIdToUse = applicationId || form.appId;
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    const scheduledLocal = new Date(`${form.date}T${form.time}`);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('employerToken');
      const res = await fetch(`${API_BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appIdToUse,
          round: form.round || 'Interview',
          scheduledAt: scheduledLocal.toISOString(),
          timezone: form.timezone || 'UTC',
          duration: Number(form.duration) || 30,
          locationType: form.locationType,
          locationDetails: form.locationDetails,
          note: form.note,
          interviewers: form.interviewers.filter(iv => iv.email || iv.name)
        })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xl">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {!applicationId && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Job</label>
                  <select value={selectedJobId} onChange={(e)=>{ setSelectedJobId(e.target.value); setErrors(prev=>({ ...prev, appId: undefined })); }} className="w-full rounded-xl border border-indigo-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Select a job</option>
                      {jobs.map(j => (
                        <option key={j._id} value={j._id}>{j.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Candidate</label>
                  <select value={form.appId} name="appId" onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-60 ${errors.appId ? 'border-red-400' : 'border-indigo-200'}`} disabled={!selectedJobId}>
                      <option value="">Select a candidate</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                      ))}
                    </select>
                  {errors.appId && <p className="text-xs text-red-600 mt-1">{errors.appId}</p>}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Round</label>
                <input name="round" value={form.round} onChange={setField} placeholder="e.g., Phone screen" className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.round ? 'border-red-400' : 'border-indigo-200'}`} />
                {errors.round && <p className="text-xs text-red-600 mt-1">{errors.round}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Date</label>
                  <input type="date" name="date" value={form.date} onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.date ? 'border-red-400' : 'border-indigo-200'}`} />
                  {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Time</label>
                  <input type="time" name="time" value={form.time} onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.time ? 'border-red-400' : 'border-indigo-200'}`} />
                  {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Timezone</label>
                  <input name="timezone" value={form.timezone} onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.timezone ? 'border-red-400' : 'border-indigo-200'}`} />
                  {errors.timezone && <p className="text-xs text-red-600 mt-1">{errors.timezone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Duration (minutes)</label>
                  <input type="number" min="1" name="duration" value={form.duration} onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.duration ? 'border-red-400' : 'border-indigo-200'}`} />
                  {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Location Type</label>
                  <select name="locationType" value={form.locationType} onChange={setField} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.locationType ? 'border-red-400' : 'border-indigo-200'}`}>
                    <option value="online">Online</option>
                    <option value="in_person">In person</option>
                    <option value="phone">Phone</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.locationType && <p className="text-xs text-red-600 mt-1">{errors.locationType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Meeting link or address</label>
                  <input name="locationDetails" value={form.locationDetails} onChange={setField} placeholder="Meet link or address" className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors.locationDetails ? 'border-red-400' : 'border-indigo-200'}`} />
                  {errors.locationDetails && <p className="text-xs text-red-600 mt-1">{errors.locationDetails}</p>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-800">Interviewers</label>
                  <button type="button" onClick={addInterviewer} className="text-sm text-indigo-700 hover:text-indigo-800">Add</button>
                </div>
                {form.interviewers.map((iv, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <input placeholder="Name" value={iv.name} onChange={(e)=>{ setInterviewer(idx,'name',e.target.value); setErrors(prev=>({ ...prev, [`interviewer_name_${idx}`]: undefined })); }} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors[`interviewer_name_${idx}`] ? 'border-red-400' : 'border-indigo-200'}`} />
                      {errors[`interviewer_name_${idx}`] && <p className="text-xs text-red-600 mt-1">{errors[`interviewer_name_${idx}`]}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <input type="email" placeholder="Email" value={iv.email} onChange={(e)=>{ setInterviewer(idx,'email',e.target.value); setErrors(prev=>({ ...prev, [`interviewer_email_${idx}`]: undefined })); }} className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${errors[`interviewer_email_${idx}`] ? 'border-red-400' : 'border-indigo-200'}`} />
                        {errors[`interviewer_email_${idx}`] && <p className="text-xs text-red-600 mt-1">{errors[`interviewer_email_${idx}`]}</p>}
                      </div>
                      {form.interviewers.length > 1 && (
                        <button type="button" onClick={()=>removeInterviewer(idx)} className="px-3 py-2 border border-indigo-200 rounded-xl text-gray-700 hover:bg-indigo-50">Remove</button>
                      )}
                    </div>
                  </div>
                ))}
                {errors.interviewers && <p className="text-xs text-red-600 mt-1">{errors.interviewers}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Note</label>
                <textarea name="note" value={form.note} onChange={setField} rows="3" className="w-full rounded-xl border border-indigo-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-indigo-200 text-gray-700 hover:bg-indigo-50 disabled:opacity-60" disabled={submitting}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-60" disabled={submitting}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;


