import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const AdminEventsModeration = () => {
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('adminToken');

  const fetchEvents = async (status = 'pending') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/events?status=${encodeURIComponent(status)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success) setEvents(data.events || []);
      else toast.error('Failed to load events');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(statusFilter); }, [statusFilter]);

  const approve = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/events/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Event approved');
        fetchEvents(statusFilter);
      } else toast.error('Approve failed');
    } catch { toast.error('Network error'); }
  };

  const reject = async (id) => {
    const reason = prompt('Reason for rejection?') || 'Not specified';
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/events/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success('Event rejected');
        fetchEvents(statusFilter);
      } else toast.error('Reject failed');
    } catch { toast.error('Network error'); }
  };

  const [showRegsFor, setShowRegsFor] = useState(null);
  const [regs, setRegs] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  // Edit Modal State
  const [showEditFor, setShowEditFor] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'free',
    price: 0,
    mode: 'online',
    meetingLink: '',
    venueAddress: '',
    startDateTime: '',
    endDateTime: '',
    organizerCompanyName: '',
    organizerEmail: '',
    organizerPhone: '',
    seatsLimit: ''
  });
  const [editErrors, setEditErrors] = useState({});

  const openEdit = (evt) => {
    setShowEditFor(evt._id);
    setEditErrors({});
    setEditForm({
      title: evt.title || '',
      description: evt.description || '',
      type: evt.type || 'free',
      price: Number(evt.price || 0),
      mode: evt.mode || 'online',
      meetingLink: evt.meetingLink || '',
      venueAddress: evt.venueAddress || '',
      startDateTime: evt.startDateTime ? new Date(evt.startDateTime).toISOString().slice(0,16) : '',
      endDateTime: evt.endDateTime ? new Date(evt.endDateTime).toISOString().slice(0,16) : '',
      organizerCompanyName: evt.organizerCompanyName || '',
      organizerEmail: evt.organizerEmail || '',
      organizerPhone: evt.organizerPhone || '',
      seatsLimit: evt.seatsLimit ?? ''
    });
  };

  const validateEdit = (values) => {
    const errs = {};
    if (!values.title || String(values.title).trim().length < 3) errs.title = 'Title is required (min 3 chars)';
    if (!values.description || String(values.description).trim().length < 10) errs.description = 'Description is required (min 10 chars)';
    if (!['free','paid'].includes(values.type)) errs.type = 'Invalid type';
    if (!['online','offline'].includes(values.mode)) errs.mode = 'Invalid mode';
    if (!values.startDateTime) errs.startDateTime = 'Start date/time required';
    if (!values.endDateTime) errs.endDateTime = 'End date/time required';
    if (values.startDateTime && values.endDateTime) {
      const s = new Date(values.startDateTime);
      const e = new Date(values.endDateTime);
      if (e <= s) errs.endDateTime = 'End must be after start';
    }
    if (values.type === 'paid') {
      const priceNum = Number(values.price);
      if (!(priceNum > 0)) errs.price = 'Price must be greater than 0 for paid events';
    }
    if (values.mode === 'online') {
      if (!values.meetingLink || String(values.meetingLink).trim().length < 5) errs.meetingLink = 'Meeting link required for online events';
    }
    if (values.mode === 'offline') {
      if (!values.venueAddress || String(values.venueAddress).trim().length < 5) errs.venueAddress = 'Venue address required for offline events';
    }
    if (values.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.organizerEmail)) errs.organizerEmail = 'Invalid email';
    if (values.seatsLimit !== '' && (isNaN(Number(values.seatsLimit)) || Number(values.seatsLimit) < 0)) errs.seatsLimit = 'Seats must be 0 or more';
    return errs;
  };

  const submitEdit = async () => {
    const errs = validateEdit(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const payload = {
        title: String(editForm.title).trim(),
        description: String(editForm.description).trim(),
        type: editForm.type,
        price: editForm.type === 'paid' ? Number(editForm.price) : 0,
        mode: editForm.mode,
        meetingLink: editForm.mode === 'online' ? String(editForm.meetingLink).trim() : undefined,
        venueAddress: editForm.mode === 'offline' ? String(editForm.venueAddress).trim() : undefined,
        startDateTime: new Date(editForm.startDateTime).toISOString(),
        endDateTime: new Date(editForm.endDateTime).toISOString(),
        organizerCompanyName: String(editForm.organizerCompanyName || '').trim(),
        organizerEmail: String(editForm.organizerEmail || '').trim(),
        organizerPhone: String(editForm.organizerPhone || '').trim(),
        seatsLimit: editForm.seatsLimit === '' ? null : Number(editForm.seatsLimit)
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/events/${showEditFor}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(t || 'Update failed');
        return;
      }
      toast.success('Event updated');
      setShowEditFor(null);
      fetchEvents(statusFilter);
    } catch (e) {
      toast.error('Network error');
    }
  };

  const openRegs = async (evtId) => {
    setShowRegsFor(evtId);
    setRegsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/events/${evtId}/registrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.success) setRegs(data.registrations || []);
    } finally { setRegsLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Events Moderation</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : events.length === 0 ? (
        <div className="bg-white p-6 rounded border">No events found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(evt => (
            <div key={evt._id} className="bg-white border rounded p-4">
              {evt.bannerUrl && (
                <div className="w-full h-80 bg-gray-50 border rounded-xl flex items-center justify-center overflow-hidden mb-3">
                  <img src={evt.bannerUrl} alt={evt.title} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{evt.title}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="capitalize mr-3">{evt.type}</span>
                    <span className="capitalize mr-3">{evt.mode}</span>
                    <span className="mr-3">{new Date(evt.startDateTime).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${evt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : evt.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{evt.status}</span>
                  <div className="text-xs text-gray-600 mt-2">Regs: <span className="font-semibold">{evt.registrationsCount || 0}</span></div>
                  {evt.type === 'paid' && (
                    <div className="text-xs text-gray-600">Revenue: <span className="font-semibold">₹{Number(evt.revenue || 0).toLocaleString()}</span></div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">{evt.description}</p>
              <div className="flex items-center space-x-3 mt-4">
                {evt.status === 'pending' && (
                  <>
                    <button onClick={() => approve(evt._id)} className="bg-green-600 text-white px-3 py-2 rounded">Approve</button>
                    <button onClick={() => reject(evt._id)} className="bg-red-600 text-white px-3 py-2 rounded">Reject</button>
                  </>
                )}
                <button onClick={() => openRegs(evt._id)} className="bg-teal-600 text-white px-3 py-2 rounded">Registrations</button>
                <button onClick={() => openEdit(evt)} className="bg-indigo-600 text-white px-3 py-2 rounded">Edit</button>
                <button onClick={async () => {
                  // eslint-disable-next-line no-restricted-globals
                  if (!confirm('Delete this event?')) return;
                  const res = await fetch(`${API_BASE_URL}/api/admin/events/${evt._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) { toast.success('Event deleted'); fetchEvents(statusFilter); } else { toast.error('Delete failed'); }
                }} className="bg-gray-700 text-white px-3 py-2 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
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
                    <span className="mr-3 capitalize">{r.ticketType}</span>
                    <span className="mr-3">₹{Number(r.amountPaid || 0).toLocaleString()}</span>
                    <span className="mr-3 capitalize">{r.paymentStatus}</span>
                    {r.ticketCode && (
                      <span className="mr-3 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.ticketCode}</span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-gray-100">{r.status}</span>
                  </div>
                    <div className="space-x-2">
                      <button onClick={async () => {
                        const res = await fetch(`${API_BASE_URL}/api/admin/events/${showRegsFor}/registrations/${r._id}/status`, {
                          method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'attended' })
                        });
                        if (res.ok) { toast.success('Marked attended'); openRegs(showRegsFor); }
                      }} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Attended</button>
                      <button onClick={async () => {
                        const res = await fetch(`${API_BASE_URL}/api/admin/events/${showRegsFor}/registrations/${r._id}/status`, {
                          method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'no_show' })
                        });
                        if (res.ok) { toast.success('Marked no-show'); openRegs(showRegsFor); }
                      }} className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">No-show</button>
                      {r.ticketType === 'paid' && r.paymentStatus !== 'refunded' && (
                        <button onClick={async () => {
                          // eslint-disable-next-line no-restricted-globals
                          if (!confirm('Refund this registration?')) return;
                          const res = await fetch(`${API_BASE_URL}/api/admin/events/${showRegsFor}/registrations/${r._id}/refund`, {
                            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) { toast.success('Refunded'); openRegs(showRegsFor); }
                        }} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Refund</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Event</h3>
              <button onClick={() => { setShowEditFor(null); }} className="text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input value={editForm.title} onChange={(e)=>setEditForm(v=>({...v,title:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.title?'border-red-500':''}`} />
                {editErrors.title && <div className="text-xs text-red-600 mt-1">{editErrors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select value={editForm.type} onChange={(e)=>setEditForm(v=>({...v,type:e.target.value}))} className="mt-1 w-full border rounded px-3 py-2">
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              {editForm.type === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input type="number" min="0" value={editForm.price} onChange={(e)=>setEditForm(v=>({...v,price:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.price?'border-red-500':''}`} />
                  {editErrors.price && <div className="text-xs text-red-600 mt-1">{editErrors.price}</div>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mode</label>
                <select value={editForm.mode} onChange={(e)=>setEditForm(v=>({...v,mode:e.target.value}))} className="mt-1 w-full border rounded px-3 py-2">
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              {editForm.mode === 'online' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                  <input value={editForm.meetingLink} onChange={(e)=>setEditForm(v=>({...v,meetingLink:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.meetingLink?'border-red-500':''}`} />
                  {editErrors.meetingLink && <div className="text-xs text-red-600 mt-1">{editErrors.meetingLink}</div>}
                </div>
              )}
              {editForm.mode === 'offline' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Venue Address</label>
                  <input value={editForm.venueAddress} onChange={(e)=>setEditForm(v=>({...v,venueAddress:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.venueAddress?'border-red-500':''}`} />
                  {editErrors.venueAddress && <div className="text-xs text-red-600 mt-1">{editErrors.venueAddress}</div>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Start</label>
                <input type="datetime-local" value={editForm.startDateTime} onChange={(e)=>setEditForm(v=>({...v,startDateTime:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.startDateTime?'border-red-500':''}`} />
                {editErrors.startDateTime && <div className="text-xs text-red-600 mt-1">{editErrors.startDateTime}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End</label>
                <input type="datetime-local" value={editForm.endDateTime} onChange={(e)=>setEditForm(v=>({...v,endDateTime:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.endDateTime?'border-red-500':''}`} />
                {editErrors.endDateTime && <div className="text-xs text-red-600 mt-1">{editErrors.endDateTime}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows="3" value={editForm.description} onChange={(e)=>setEditForm(v=>({...v,description:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.description?'border-red-500':''}`} />
                {editErrors.description && <div className="text-xs text-red-600 mt-1">{editErrors.description}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organizer Company</label>
                <input value={editForm.organizerCompanyName} onChange={(e)=>setEditForm(v=>({...v,organizerCompanyName:e.target.value}))} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organizer Email</label>
                <input value={editForm.organizerEmail} onChange={(e)=>setEditForm(v=>({...v,organizerEmail:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.organizerEmail?'border-red-500':''}`} />
                {editErrors.organizerEmail && <div className="text-xs text-red-600 mt-1">{editErrors.organizerEmail}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organizer Phone</label>
                <input value={editForm.organizerPhone} onChange={(e)=>setEditForm(v=>({...v,organizerPhone:e.target.value}))} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seats Limit</label>
                <input type="number" min="0" value={editForm.seatsLimit} onChange={(e)=>setEditForm(v=>({...v,seatsLimit:e.target.value}))} className={`mt-1 w-full border rounded px-3 py-2 ${editErrors.seatsLimit?'border-red-500':''}`} />
                {editErrors.seatsLimit && <div className="text-xs text-red-600 mt-1">{editErrors.seatsLimit}</div>}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button onClick={() => setShowEditFor(null)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={submitEdit} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsModeration;


