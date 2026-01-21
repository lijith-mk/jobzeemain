import React, { useEffect, useState } from 'react';

import API_BASE_URL from '../config/api';
const ShopPayments = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('employerToken');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/shop-payments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) setItems(data.payments || []);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchPayments();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Shop Payments</h1>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm text-gray-600">Date</th>
                <th className="px-4 py-2 text-left text-sm text-gray-600">Amount</th>
                <th className="px-4 py-2 text-left text-sm text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-sm text-gray-600">Order</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p._id} className="border-t">
                  <td className="px-4 py-2 text-sm text-gray-700">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{new Intl.NumberFormat('en-US', { style:'currency', currency: p.currency || 'USD' }).format(p.amount)}</td>
                  <td className="px-4 py-2 text-sm"><span className={`px-2 py-1 rounded text-xs ${p.status==='success'?'bg-green-100 text-green-800':p.status==='failed'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>{p.status}</span></td>
                  <td className="px-4 py-2 text-sm text-blue-600"><a href={`/orders/${p.orderId}`} className="underline">View Order</a></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={4}>No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopPayments;
