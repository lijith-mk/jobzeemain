import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import AddressSelector from '../components/AddressSelector';

import API_BASE_URL from '../config/api';
const Checkout = () => {
  const navigate = useNavigate();
  const { 
    items, 
    summary, 
    formatPrice, 
    clearCart,
    isLoading: cartLoading 
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [billingAddress, setBillingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [orderNotes, setOrderNotes] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check authentication
    const userToken = localStorage.getItem('token'); // Regular user token
    const employerToken = localStorage.getItem('employerToken'); // Employer token
    
    if (!userToken && !employerToken) {
      toast.error('Please login to proceed with checkout');
      navigate('/login');
      return;
    }

    // Get user info
    const userData = JSON.parse(localStorage.getItem('user') || localStorage.getItem('employer') || '{}');
    setUser(userData);

    // If cart is empty, redirect to shop
    if (items.length === 0) {
      toast.info('Your cart is empty');
      navigate('/shop');
      return;
    }
  }, [navigate, items]);

  // Initialize Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('employerToken');

  const getUserName = () => {
    return user?.name || user?.contactPersonName || user?.companyName || 'Customer';
  };

  const handleAddressSelect = (address, type) => {
    if (type === 'shipping') {
      setShippingAddress(address);
      toast.success('Shipping address selected');
    } else if (type === 'billing') {
      setBillingAddress(address);
      toast.success('Billing address selected');
      setShowAddressForm(false);
    }
  };

  const validateCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }

    if (!shippingAddress || !billingAddress) {
      toast.error('Please select both shipping and billing addresses');
      setShowAddressForm(true);
      return false;
    }

    return true;
  };

  const processCheckout = async () => {
    if (!validateCheckout()) return;

    setLoading(true);
    
    try {
      const token = getToken();
      
      // Prepare address data
      const shippingAddressData = {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
        landmark: shippingAddress.landmark
      };

      const billingAddressData = {
        fullName: billingAddress.fullName,
        email: billingAddress.email || user.email || 'user@example.com',
        phone: billingAddress.phone,
        street: billingAddress.street,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode,
        country: billingAddress.country,
        landmark: billingAddress.landmark
      };

      // Create order from cart
      const response = await fetch(`${API_BASE_URL}/api/orders/checkout-cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAddress: shippingAddressData,
          billingAddress: billingAddressData,
          paymentMethod,
          orderNotes,
          cartItems: items.map(item => ({
            productId: item.product?._id || item.product,
            quantity: item.quantity,
            price: item.discountedPrice || item.price
          }))
        })
      });

      const data = await response.json();

      if (!response.ok || !data?.order?.razorpayOrderId) {
        toast.error(data.details || data.message || 'Failed to create order');
        return;
      }

      if (paymentMethod === 'razorpay') {
        // Initialize Razorpay payment
        const options = {
          key: data.order.razorpayKeyId,
          amount: Math.round(summary.total * 100), // Convert to paise
          currency: summary.currency,
          name: 'JobZee Shop',
          description: `Order for ${items.length} items`,
          order_id: data.order.razorpayOrderId,
          prefill: {
            name: getUserName(),
            email: user.email || billingAddressData.email,
            contact: shippingAddress.phone
          },
          theme: {
            color: '#f97316' // Orange color matching the design
          },
          handler: async (razorpayResponse) => {
            try {
              // Verify payment
              const verifyResponse = await fetch(`${API_BASE_URL}/api/orders/verify-payment`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                  orderId: data.order.id
                })
              });

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok && verifyData.success) {
                // Clear cart after successful payment
                await clearCart();
                toast.success('Payment successful! Order placed.');
                navigate(`/checkout/success?orderId=${data.order.id}&name=${encodeURIComponent(getUserName())}`);
              } else {
                toast.error(verifyData.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.info('Payment cancelled');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout');
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Checkout</h1>
            <p className="text-gray-600">Your cart is empty</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Address</h2>
                {shippingAddress ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{shippingAddress.fullName}</p>
                        <p className="text-gray-600">{shippingAddress.street}</p>
                        <p className="text-gray-600">
                          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                        </p>
                        <p className="text-gray-600">{shippingAddress.country}</p>
                        <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
                      </div>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Select Shipping Address
                  </button>
                )}
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing Address</h2>
                {billingAddress ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{billingAddress.fullName}</p>
                        <p className="text-gray-600">{billingAddress.street}</p>
                        <p className="text-gray-600">
                          {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}
                        </p>
                        <p className="text-gray-600">{billingAddress.country}</p>
                        <p className="text-gray-600">Phone: {billingAddress.phone}</p>
                      </div>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    + Select Billing Address
                  </button>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">Credit/Debit Card, UPI, Net Banking (Razorpay)</span>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Notes (Optional)</h2>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0]?.url || item.productSnapshot?.image || '/api/placeholder/60/60'}
                        alt={item.productSnapshot?.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.productSnapshot?.name}
                        </p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {formatPrice((item.discountedPrice || item.price) * item.quantity, summary.currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-3 mb-6 border-t pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({summary.itemCount} items)</span>
                    <span>{formatPrice(summary.subtotal, summary.currency)}</span>
                  </div>

                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(summary.discount, summary.currency)}</span>
                    </div>
                  )}

                  {summary.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(summary.tax, summary.currency)}</span>
                    </div>
                  )}

                  <hr />

                  <div className="flex justify-between text-lg font-semibold text-gray-800">
                    <span>Total</span>
                    <span>{formatPrice(summary.total, summary.currency)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={processCheckout}
                  disabled={loading || !shippingAddress || !billingAddress}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : `Pay ${formatPrice(summary.total, summary.currency)}`}
                </button>

                {/* Security Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    <span className="text-sm">Secured by Razorpay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AddressSelector
              onAddressSelect={(address) => {
                if (!shippingAddress) {
                  handleAddressSelect(address, 'shipping');
                } else if (!billingAddress) {
                  handleAddressSelect(address, 'billing');
                } else {
                  // Let user choose which address to update
                  const choice = window.confirm('Update shipping address? Click Cancel to update billing address.');
                  handleAddressSelect(address, choice ? 'shipping' : 'billing');
                }
              }}
              showBillingForm={!!shippingAddress}
            />
            <div className="p-6 border-t">
              <button
                onClick={() => setShowAddressForm(false)}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;