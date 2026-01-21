import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddressSelector from '../components/AddressSelector';
import { useCart } from '../contexts/CartContext';
import AddToCartButton from '../components/AddToCartButton';

import API_BASE_URL from '../config/api';
const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { formatPrice } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
        } else {
          toast.error(data.message || 'Failed to load product');
        }
      } catch (e) {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);


  // Razorpay script
  useEffect(() => {
    const id = 'razorpay-checkout-js';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.id = id;
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(s);
    }
  }, []);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('employerToken');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [billingAddress, setBillingAddress] = useState(null);
  const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const employer = JSON.parse(localStorage.getItem('employer') || 'null');
    return (user?.name) || (employer?.contactPersonName || employer?.companyName) || 'Customer';
  };

  const buyNow = async () => {
    try {
      const token = getToken();
      if (!token) { toast.error('Please login'); return; }
      if (!product) return;
      const profile = JSON.parse(localStorage.getItem('user') || localStorage.getItem('employer') || '{}');

      // Ensure addresses are provided; open selector if not
      if (!shippingAddress || !billingAddress) {
        setShowAddressForm(true);
        toast.info('Please select shipping and billing addresses');
        return;
      }

      // Prepare new-shape addresses
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
        email: billingAddress.email || profile.email || 'user@example.com',
        phone: billingAddress.phone,
        street: billingAddress.street,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode,
        country: billingAddress.country,
        landmark: billingAddress.landmark
      };
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout-single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product._id, 
          quantity: 1, 
          shippingAddress: shippingAddressData, 
          billingAddress: billingAddressData, 
          paymentMethod: 'razorpay' 
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.order?.razorpayOrderId) {
        toast.error(data.details || data.message || 'Failed to start payment');
        return;
      }
      const options = {
        key: data.order.razorpayKeyId,
        amount: Math.round((product.discountedPrice || product.price) * 100),
        currency: 'INR',
        name: 'JobZee Shop',
        description: product.name,
        order_id: data.order.razorpayOrderId,
        prefill: { name: getUserName(), email: profile.email || '' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/orders/verify-payment`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.order.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              window.location.href = `/checkout/success?name=${encodeURIComponent(getUserName())}`;
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
            }
          } catch (_) { toast.error('Payment verification failed'); }
        },
        theme: { color: '#10b981' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) { toast.error('Payment failed to start'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
              <img src={product.images?.[0]?.url} alt={product.name} className="w-full rounded-2xl object-cover" />
              {product.isFeatured && (
                <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Featured</span>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{product.category}</span>
                  {product.productType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 capitalize">{product.productType}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 mb-5">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {formatPrice(product.discountedPrice || product.price, product.currency)}
              </div>
              {product.discountedPrice && (
                <>
                  <span className="text-gray-400 line-through">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                    Save {formatPrice((product.price || 0) - (product.discountedPrice || product.price), product.currency)}
                  </span>
                </>
              )}
            </div>

            {/* Product Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              {product.rating?.average > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating.average))}</span>
                  <span className="text-yellow-500">{'☆'.repeat(5 - Math.round(product.rating.average))}</span>
                  <span className="font-medium">({product.rating.count} reviews)</span>
                </div>
              )}
              {product.sales > 0 && (
                <span>{product.sales} sold</span>
              )}
              {!product.isUnlimited && product.stock > 0 && (
                <span className={product.stock <= 5 ? 'text-orange-600 font-medium' : ''}>
                  {product.stock} in stock
                </span>
              )}
            </div>

            <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-8">{product.description}</p>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AddToCartButton 
                  product={product}
                  variant="primary"
                  size="lg"
                  showQuantitySelector={true}
                  className="w-full"
                />
                <button
                  onClick={() => buyNow()}
                  disabled={adding}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7H7m6 4H7m6 4H7m8-9l3 3-3 3"/>
                  </svg>
                  Buy Now
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Select Address
                </button>
                
                <Link
                  to="/cart"
                  className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 6m5 0v0a2 2 0 002 2h8a2 2 0 002-2v0M7 13h10m-5 6a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                  View Cart
                </Link>
              </div>
            </div>

            {/* Product Features */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Product Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {product.productType === 'digital' && (
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span>Instant digital delivery</span>
                  </div>
                )}
                {product.isUnlimited && (
                  <div className="flex items-center gap-2">
                    <span>♾️</span>
                    <span>Unlimited stock available</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>Customer support available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={relatedProduct.images?.[0]?.url || '/api/placeholder/300/200'}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover"
                    />
                    {relatedProduct.isFeatured && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">{relatedProduct.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{relatedProduct.shortDescription}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(relatedProduct.discountedPrice || relatedProduct.price, relatedProduct.currency)}
                        </span>
                        {relatedProduct.discountedPrice && (
                          <span className="text-gray-400 line-through ml-2 text-sm">
                            {formatPrice(relatedProduct.price, relatedProduct.currency)}
                          </span>
                        )}
                      </div>
                      <span className="text-yellow-500">
                        {'★'.repeat(Math.round(relatedProduct.rating?.average || 0))}
                        {'☆'.repeat(5 - Math.round(relatedProduct.rating?.average || 0))}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/shop/products/${relatedProduct._id}`}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded text-center transition-colors font-medium text-sm"
                      >
                        View Details
                      </Link>
                      <div className="flex-1">
                        <AddToCartButton 
                          product={relatedProduct} 
                          variant="primary" 
                          size="sm"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AddressSelector
              onAddressSelect={(address) => {
                if (!shippingAddress) {
                  setShippingAddress(address);
                  toast.success('Shipping address selected');
                } else if (!billingAddress) {
                  setBillingAddress(address);
                  toast.success('Billing address selected');
                  setShowAddressForm(false);
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


export default ProductDetails;
