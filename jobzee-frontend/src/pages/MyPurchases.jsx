import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const MyPurchases = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('employerToken');
  const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const employer = JSON.parse(localStorage.getItem('employer') || 'null');
    return (user?.name) || (employer?.contactPersonName || employer?.companyName) || 'Customer';
  };

  const formatMoney = (amount, currency = 'USD') => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0); }
    catch { return `${currency} ${(amount || 0).toFixed(2)}`; }
  };

  const fetchOrders = async (p = 1) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) { toast.error('Please sign in to view purchases'); navigate('/login'); return; }
      const res = await fetch(`${API_BASE_URL}/api/orders?page=${p}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setPagination(data.pagination || null);
      } else {
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (e) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(page); /* eslint-disable-next-line */ }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Purchases</h1>
          <div className="space-x-3">
            <Link to="/shop" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Go to Shop</Link>
            <Link to="/payments/shop" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Payment History</Link>
          </div>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">You haven’t purchased anything yet.</p>
            <Link to="/shop" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id || order.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Order</div>
                    <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="md:text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-semibold">{formatMoney(order.total, order.currency)}</div>
                    <div className="text-xs text-gray-500">Status: <span className="uppercase">{order.status}</span> · Payment: {order.paymentInfo?.status || 'pending'}</div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700">Items</div>
                      <div className="space-y-2">
                        {order.items?.map(item => (
                          <div key={item._id} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              { (item.productSnapshot?.image || item.product?.images?.[0]?.url) ? (
                                <img src={item.productSnapshot?.image || item.product?.images?.[0]?.url} alt={item.productSnapshot?.name || item.product?.name} className="w-full h-full object-cover" />
                              ) : (<span className="text-gray-400">🛍️</span>)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.productSnapshot?.name || item.product?.name}</div>
                              <div className="text-xs text-gray-500">Qty: {item.quantity} · Unit: {formatMoney(item.unitPrice, order.currency)} · Subtotal: {formatMoney(item.totalPrice, order.currency)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700">Addresses</div>
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">Billing</div>
                        <div>{order.billingAddress?.name} · {order.billingAddress?.email}</div>
                        <div className="text-gray-500">{order.billingAddress?.address?.street}, {order.billingAddress?.address?.city}, {order.billingAddress?.address?.state}, {order.billingAddress?.address?.country} {order.billingAddress?.address?.zipCode}</div>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">Shipping</div>
                        <div>{order.shippingAddress?.name}</div>
                        <div className="text-gray-500">{order.shippingAddress?.address?.street}, {order.shippingAddress?.address?.city}, {order.shippingAddress?.address?.state}, {order.shippingAddress?.address?.country} {order.shippingAddress?.address?.zipCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Placed by {getUserName()}</div>
                  <Link to={`/orders/${order._id || order.id}`} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">View Details</Link>
                </div>
              </div>
            ))}

            {pagination && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button disabled={!pagination.hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Prev</button>
                <div className="text-sm text-gray-600">Page {pagination.current} of {pagination.total}</div>
                <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
