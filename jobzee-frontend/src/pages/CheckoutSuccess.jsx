import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import API_BASE_URL from '../config/api';
const CheckoutSuccess = () => {
  const params = new URLSearchParams(useLocation().search);
  const name = params.get('name') || 'Customer';
  const [showConfetti, setShowConfetti] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    // Fetch recent order details
    fetchRecentOrder();
    
    // Auto-hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchRecentOrder = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('employerToken');
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/orders?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders?.length > 0) {
          setOrderDetails(data.orders[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div className={`w-2 h-2 rounded-full ${
                ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400', 'bg-pink-400'][Math.floor(Math.random() * 5)]
              }`}></div>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center transform transition-all duration-500 hover:scale-105">
          {/* Success Icon with Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
              <span className="text-lg">🎉</span>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Payment Successful!
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Thank you, <span className="text-emerald-600">{name}</span>!
          </h2>
          
          <p className="text-gray-600 mb-8 text-lg">
            Your order has been confirmed and you will receive an email with order details shortly.
          </p>

          {/* Order Summary Card */}
          {orderDetails && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-6 mb-8 border border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold text-gray-800">{orderDetails.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-emerald-600">
                    {formatPrice(orderDetails.total, orderDetails.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    {orderDetails.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/orders" 
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                View Purchases
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

            <Link 
              to="/payments/shop" 
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Payments
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

            <Link 
              to="/shop" 
              className="group relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Continue Shopping
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center text-blue-600 mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Email Confirmation Sent</span>
            </div>
            <p className="text-sm text-blue-700">
              Check your email for detailed order information and download links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
