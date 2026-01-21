import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, PlusIcon, MinusIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    summary,
    isLoading,
    isInitialized,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    formatPrice
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    // Check authentication
    const userToken = localStorage.getItem('token'); // Regular user token
    const employerToken = localStorage.getItem('employerToken'); // Employer token
    
    if (!userToken && !employerToken) {
      toast.error('Please login to view your cart');
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleQuantityUpdate = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    await updateCartItem(productId, newQuantity);
  };

  const handleRemoveItem = async (productId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      await removeFromCart(productId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart();
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    const success = await applyCoupon(couponCode.trim());
    if (success) {
      setCouponCode('');
    }
    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = async (code) => {
    await removeCoupon(code);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
              <p className="text-gray-600 mt-2">Manage your selected items</p>
            </div>

            {/* Empty Cart */}
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-3 8m10-8v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8m8 0a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
              <Link
                to="/shop"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
                <p className="text-gray-600 mt-2">
                  {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} in your cart
                </p>
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product?.images?.[0]?.url || item.productSnapshot?.image || '/api/placeholder/150/150'}
                        alt={item.productSnapshot?.name || 'Product'}
                        className="w-full sm:w-32 h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {item.productSnapshot?.name || 'Product'}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.product?._id || item.product)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove item"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        Category: {item.productSnapshot?.category || 'Unknown'}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(item.discountedPrice || item.price, summary.currency)}
                        </span>
                        {item.discountedPrice && item.discountedPrice < item.price && (
                          <span className="text-gray-400 line-through">
                            {formatPrice(item.price, summary.currency)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityUpdate(item.product?._id || item.product, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityUpdate(item.product?._id || item.product, item.quantity + 1)}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">Subtotal</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {formatPrice((item.discountedPrice || item.price) * item.quantity, summary.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Availability Status */}
                      {item.productSnapshot && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            item.productSnapshot.isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm ${
                            item.productSnapshot.isAvailable ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.productSnapshot.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>

                {/* Coupon Section */}
                <div className="mb-6">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </form>

                  {/* Applied Coupons */}
                  {summary.appliedCoupons && summary.appliedCoupons.length > 0 && (
                    <div className="space-y-2">
                      {summary.appliedCoupons.map((coupon, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{coupon.code}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveCoupon(coupon.code)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
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

                  <hr className="my-3" />

                  <div className="flex justify-between text-lg font-semibold text-gray-800">
                    <span>Total</span>
                    <span>{formatPrice(summary.total, summary.currency)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <Link
                  to="/shop"
                  className="block w-full text-center mt-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Security Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Secure Checkout</h3>
                  <p className="text-sm text-gray-600">Your payment information is encrypted and secure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
