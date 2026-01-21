import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import API_BASE_URL from '../config/api';
const EmployerViewEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) { navigate('/employer/login'); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employers/events/${eventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success) setEvent(data.event);
      } finally { setLoading(false); }
    })();
  }, [eventId, navigate]);

  if (loading) return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  if (!event) return <div className="max-w-4xl mx-auto p-6">Event not found</div>;

  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-teal-600 text-white">
          <div className="text-sm font-semibold">{(event.categories?.[0] || 'Event')}</div>
          <div className="text-sm font-semibold">{event.type === 'paid' ? `₹${Number(event.price).toLocaleString()}` : 'FREE'}</div>
        </div>
        {event.bannerUrl && (
          <div className="w-full bg-gray-50 flex items-center justify-center overflow-hidden" style={{ maxHeight: 420 }}>
            <img src={event.bannerUrl} alt={event.title} className="object-contain max-h-[420px]" />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">{event.title}</h1>
          <div className="text-gray-700 mt-2 whitespace-pre-line">{event.description}</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <div>
              <div className="font-semibold">Date & Time</div>
              <div>{start.toLocaleString()} — {end.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-semibold">Mode</div>
              <div className="capitalize">{event.mode}</div>
              {event.mode === 'online' && (
                <div className="mt-1 truncate"><a href={event.meetingLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">{event.meetingLink}</a></div>
              )}
              {event.mode === 'offline' && (
                <div className="mt-1">{event.venueAddress}</div>
              )}
            </div>
            {event.tags?.length ? (
              <div>
                <div className="font-semibold">Tags</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {event.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <div className="font-semibold">Visibility</div>
              <div className="capitalize">{event.visibility}</div>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={() => navigate('/employer/events')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerViewEvent;




























