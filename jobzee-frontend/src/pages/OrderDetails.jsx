import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const OrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('employerToken');
  const formatMoney = (amount, currency = 'USD') => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0); }
    catch { return `${currency} ${(amount || 0).toFixed(2)}`; }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) { toast.error('Please sign in to view order'); navigate('/login'); return; }
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setOrder(data.order);
      else toast.error(data.message || 'Failed to fetch order');
    } catch (e) {
      toast.error('Failed to fetch order');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found.</p>
          <Link to="/orders" className="mt-4 inline-block px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back to Purchases</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <div className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl font-semibold">{formatMoney(order.total, order.currency)}</div>
            <div className="text-xs text-gray-500">Status: <span className="uppercase">{order.status}</span> · Payment: {order.paymentInfo?.status || 'pending'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Items */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-lg font-semibold mb-4">Items</div>
              <div className="space-y-4">
                {order.items?.map(item => (
                  <div key={item._id} className="flex items-center">
                    <div className="w-20 h-20 bg-gray-100 rounded mr-4 overflow-hidden flex items-center justify-center">
                      { (item.productSnapshot?.image || item.product?.images?.[0]?.url) ? (
                        <img src={item.productSnapshot?.image || item.product?.images?.[0]?.url} alt={item.productSnapshot?.name || item.product?.name} className="w-full h-full object-cover" />
                      ) : (<span className="text-gray-400 text-2xl">🛍️</span>)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.productSnapshot?.name || item.product?.name}</div>
                      {item.productSnapshot?.category && (
                        <div className="text-sm text-gray-500">{item.productSnapshot.category}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">Qty: {item.quantity} · Unit: {formatMoney(item.unitPrice, order.currency)} · Subtotal: {formatMoney(item.totalPrice, order.currency)}</div>
                      {/* Digital delivery info if present */}
                      {item.deliveryInfo?.downloadLink && (
                        <div className="mt-2 text-sm">
                          <a className="text-blue-600 hover:underline" href={item.deliveryInfo.downloadLink} target="_blank" rel="noreferrer">Download</a>
                          {item.deliveryInfo.expiresAt && <span className="text-gray-500 ml-2">(expires {new Date(item.deliveryInfo.expiresAt).toLocaleString()})</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-semibold">{formatMoney(item.totalPrice, order.currency)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {order.timeline?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-5">
                <div className="text-lg font-semibold mb-4">Timeline</div>
                <div className="space-y-2">
                  {order.timeline.map((t, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-medium uppercase">{t.status}</span> · {t.message} · <span className="text-gray-500">{new Date(t.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Addresses */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-lg font-semibold mb-3">Addresses</div>
              <div className="text-sm text-gray-700 mb-3">
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

            {/* Payment info */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-lg font-semibold mb-3">Payment</div>
              <div className="text-sm text-gray-700">
                <div>Method: {order.paymentInfo?.method?.toUpperCase?.() || order.paymentInfo?.method}</div>
                <div>Status: {order.paymentInfo?.status}</div>
                {order.paymentInfo?.razorpayPaymentId && <div>Payment ID: {order.paymentInfo.razorpayPaymentId}</div>}
                {order.paymentInfo?.razorpayOrderId && <div>Razorpay Order: {order.paymentInfo.razorpayOrderId}</div>}
                {order.paymentInfo?.paidAt && <div>Paid at: {new Date(order.paymentInfo.paidAt).toLocaleString()}</div>}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-lg font-semibold mb-3">Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>- {formatMoney(order.discount, order.currency)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatMoney(order.tax, order.currency)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{formatMoney(order.shippingCost || order.shippingInfo?.cost || 0, order.currency)}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{formatMoney(order.total, order.currency)}</span></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link to="/orders" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Back to Purchases</Link>
                <Link to="/shop" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Continue Shopping</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
