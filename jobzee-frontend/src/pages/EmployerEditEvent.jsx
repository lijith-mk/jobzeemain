import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import API_BASE_URL from '../config/api';
const EmployerEditEvent = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '', description: '', type: 'free', price: '', seatsLimit: '', mode: 'online',
    meetingLink: '', venueAddress: '', startDateTime: '', endDateTime: '', bannerUrl: '',
    categories: '', tags: '', visibility: 'public', restrictedToRoles: 'jobseeker',
    organizerCompanyName: '', organizerEmail: '', organizerPhone: '', images: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) { navigate('/employer/login'); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employers/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success && data.event) {
          const e = data.event;
          setForm({
            title: e.title || '',
            description: e.description || '',
            type: e.type || 'free',
            price: e.price || '',
            seatsLimit: e.seatsLimit || '',
            mode: e.mode || 'online',
            meetingLink: e.meetingLink || '',
            venueAddress: e.venueAddress || '',
            startDateTime: e.startDateTime ? new Date(e.startDateTime).toISOString().slice(0,16) : '',
            endDateTime: e.endDateTime ? new Date(e.endDateTime).toISOString().slice(0,16) : '',
            bannerUrl: e.bannerUrl || '',
            categories: (e.categories || []).join(', '),
            tags: (e.tags || []).join(', '),
            visibility: e.visibility || 'public',
            restrictedToRoles: (e.restrictedToRoles && e.restrictedToRoles[0]) || 'jobseeker',
            organizerCompanyName: e.organizerCompanyName || '',
            organizerEmail: e.organizerEmail || '',
            organizerPhone: e.organizerPhone || '',
            images: (e.images || []).join(', ')
          });
        }
      } finally { setLoading(false); }
    })();
  }, [eventId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem('employerToken');
    const body = new FormData();
    body.append('photo', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload/employer/event-banner`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body
      });
      const data = await res.json();
      if (data?.bannerUrl) setForm(prev => ({ ...prev, bannerUrl: data.bannerUrl }));
    } finally { setUploading(false); }
  };

  const canSubmit = useMemo(() => {
    if (!form.title || !form.description || !form.startDateTime || !form.endDateTime) return false;
    if (form.type === 'paid' && (!form.price || Number(form.price) <= 0)) return false;
    if (form.mode === 'online' && !form.meetingLink) return false;
    if (form.mode === 'offline' && !form.venueAddress) return false;
    return true;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const token = localStorage.getItem('employerToken');
    const payload = {
      ...form,
      price: form.type === 'paid' ? Number(form.price) : 0,
      seatsLimit: form.seatsLimit ? Number(form.seatsLimit) : null,
      categories: form.categories ? form.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      restrictedToRoles: form.visibility === 'restricted' ? [form.restrictedToRoles] : []
    };
    const res = await fetch(`${API_BASE_URL}/api/employers/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) navigate('/employer/events');
  };

  if (loading) return <div className="max-w-3xl mx-auto p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Event</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Event Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={5} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {form.type === 'paid' && (
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Seats Limit (optional)</label>
            <input type="number" name="seatsLimit" value={form.seatsLimit} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select name="mode" value={form.mode} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          {form.mode === 'online' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link</label>
              <input name="meetingLink" value={form.meetingLink} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Venue Address</label>
              <input name="venueAddress" value={form.venueAddress} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date & Time</label>
            <input type="datetime-local" name="startDateTime" value={form.startDateTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date & Time</label>
            <input type="datetime-local" name="endDateTime" value={form.endDateTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Event Banner</label>
          <div 
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => document.getElementById('banner-upload-edit').click()}
          >
            {form.bannerUrl ? (
              <div className="relative w-full h-full">
                <img 
                  src={form.bannerUrl} 
                  alt="Event banner" 
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white text-sm mt-1">Click to change</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm">Click to upload event banner</p>
                <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
          <input 
            id="banner-upload-edit"
            type="file" 
            accept="image/*" 
            onChange={handleBannerUpload}
            className="hidden"
          />
          {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categories</label>
            <input name="categories" value={form.categories} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        
        {/* Organizer Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name (Organizer)</label>
            <input name="organizerCompanyName" value={form.organizerCompanyName} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Your company name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input type="email" name="organizerEmail" value={form.organizerEmail} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="hr@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Phone</label>
            <input name="organizerPhone" value={form.organizerPhone} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="+91 98765 43210" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <select name="visibility" value={form.visibility} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          {form.visibility === 'restricted' && (
            <div>
              <label className="block text-sm font-medium mb-1">Restricted To</label>
              <select name="restrictedToRoles" value={form.restrictedToRoles} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="jobseeker">Job Seekers</option>
              </select>
            </div>
          )}
        </div>
        <div className="pt-2">
          <button type="submit" disabled={!canSubmit || saving} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployerEditEvent;








