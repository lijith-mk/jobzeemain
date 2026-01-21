import React, { useEffect, useState } from 'react';

import API_BASE_URL from '../config/api';
const EmployerNotifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('employerToken');
    if (!token) return;
    load(token, 1);
  }, []);

  const load = async (token, p) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/employers/notifications?page=${p}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications || []);
        setPage(data.pagination?.current || 1);
        setPages(data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error('Load notifications error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => new Date(iso).toLocaleString();

  if (loading) return <div className="max-w-3xl mx-auto p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">All Notifications</h1>
      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        {items.length === 0 ? (
          <div className="p-4 text-gray-500">No notifications</div>
        ) : items.map(n => (
          <div key={n._id} className={`p-4 ${!n.read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{n.title}</div>
                <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                <div className="text-xs text-gray-500 mt-1">{formatTime(n.createdAt)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <button disabled={page<=1} onClick={()=>load(localStorage.getItem('employerToken'), page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <div className="text-sm text-gray-600">Page {page} of {pages}</div>
        <button disabled={page>=pages} onClick={()=>load(localStorage.getItem('employerToken'), page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default EmployerNotifications;


