import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import sessionManager from '../utils/sessionManager';

import API_BASE_URL from '../config/api';
const Pricing = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (sessionManager.isLoggedIn()) {
        setIsLoggedIn(true);
        const userType = sessionManager.getUserType();
        setUserType(userType);
        
        if (userType === 'employer') {
          const employer = sessionManager.getCurrentUser();
          setCurrentPlan(employer?.subscriptionPlan || 'free');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch pricing plans from API
  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pricing/public`);
        const data = await response.json();
        
        if (data.success) {
          setPlans(data.plans);
        } else {
          console.error('Failed to fetch pricing plans:', data.message);
          // Fallback to hardcoded data if API fails
          setPlans(getFallbackPlans());
        }
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        // Fallback to hardcoded data if API fails
        setPlans(getFallbackPlans());
      } finally {
        setApiLoading(false);
      }
    };

    fetchPricingPlans();
  }, []);

  // Fallback plans in case API is not available
  const getFallbackPlans = () => {
    return [
      {
        planId: 'free',
        name: 'Free',
        price: { displayPrice: '₹0', period: 'forever' },
        description: 'Perfect for small businesses getting started',
        features: [
          { name: '1 job posting', included: true },
          { name: 'Basic candidate search', included: true },
          { name: 'Email support', included: true },
          { name: 'Company profile', included: true },
          { name: 'Basic analytics', included: true }
        ],
        limitations: [
          'Limited to 1 active job posting',
          'No priority support',
          'Basic candidate filtering'
        ],
        price: { isPopular: false },
        trialAvailable: false
      },
      {
        planId: 'basic',
        name: 'Basic',
        price: { displayPrice: '₹2,499', period: 'per month' },
        description: 'Great for growing companies',
        features: [
          { name: '5 job postings', included: true },
          { name: 'Advanced candidate search', included: true },
          { name: 'Priority email support', included: true },
          { name: 'Enhanced company profile', included: true },
          { name: 'Advanced analytics', included: true },
          { name: 'Resume database access', included: true },
          { name: 'Application tracking', included: true }
        ],
        limitations: [],
        price: { isPopular: false },
        trialAvailable: true
      },
      {
        planId: 'premium',
        name: 'Premium',
        price: { displayPrice: '₹6,999', period: 'per month' },
        description: 'For established companies with high hiring needs',
        features: [
          { name: 'Unlimited job postings', included: true },
          { name: 'Advanced candidate matching', included: true },
          { name: 'Priority phone support', included: true },
          { name: 'Premium company profile', included: true },
          { name: 'Advanced analytics & reporting', included: true },
          { name: 'Full resume database access', included: true },
          { name: 'Advanced application tracking', included: true },
          { name: 'Custom job templates', included: true },
          { name: 'Team collaboration tools', included: true }
        ],
        limitations: [],
        price: { isPopular: true },
        trialAvailable: true
      },
      {
        planId: 'enterprise',
        name: 'Enterprise',
        price: { displayPrice: 'Custom', period: 'per month' },
        description: 'Tailored solutions for large organizations',
        features: [
          { name: 'Unlimited everything', included: true },
          { name: 'Dedicated account manager', included: true },
          { name: '24/7 priority support', included: true },
          { name: 'Custom integrations', included: true },
          { name: 'Advanced security features', included: true },
          { name: 'White-label options', included: true },
          { name: 'Custom reporting', included: true },
          { name: 'API access', included: true },
          { name: 'Onboarding assistance', included: true }
        ],
        limitations: [],
        price: { isPopular: false },
        trialAvailable: true
      }
    ];
  };

  // Helper functions - defined before they're used
  const getButtonText = (planId) => {
    if (planId === currentPlan) return 'Current Plan';
    if (planId === 'enterprise') return 'Contact Sales';
    return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
  };

  const getButtonStyle = (planId) => {
    if (planId === currentPlan) return 'bg-gray-100 text-gray-600 cursor-not-allowed';
    if (planId === 'enterprise') return 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white';
    if (planId === 'premium') return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white';
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  // Transform API data to component format
  const transformedPlans = plans.map(plan => ({
    id: plan.planId,
    name: plan.name,
    price: plan.price.displayPrice,
    period: plan.price.period === 'forever' ? 'forever' : `per ${plan.price.period}`,
    description: plan.description,
    features: plan.features.map(feature => feature.name),
    limitations: plan.limitations || [],
    popular: plan.price.isPopular,
    buttonText: getButtonText(plan.planId),
    buttonStyle: getButtonStyle(plan.planId),
    available: plan.isAvailable,
    trialAvailable: plan.trialAvailable
  }));

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlanSelect = async (planId) => {
    if (planId === currentPlan) {
      toast.info('This is your current plan');
      return;
    }

    if (planId === 'enterprise') {
      toast.info('Please contact our sales team for enterprise pricing');
      return;
    }

    if (!isLoggedIn || userType !== 'employer') {
      toast.info('Please log in as an employer to upgrade your plan');
      return;
    }

    try {
      setCheckoutLoading(true);

      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error('Failed to load payment SDK. Please try again.');
        return;
      }

      const token = localStorage.getItem('employerToken');
      if (!token) {
        toast.error('Missing employer token. Please log in again.');
        return;
      }

      // Create order
      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast.error(orderData.message || 'Failed to start checkout');
        return;
      }

      const { order, key, plan } = orderData;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'JobZee',
        description: `${plan.name} plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              toast.error(verifyData.message || 'Payment verification failed');
              return;
            }

            // Update local employer session
            const employer = verifyData.employer;
            if (employer) {
              localStorage.setItem('employer', JSON.stringify(employer));
              setCurrentPlan(employer.subscriptionPlan || planId);
            }

            toast.success('Subscription upgraded successfully');
          } catch (err) {
            console.error(err);
            toast.error('Could not verify payment');
          }
        },
        prefill: {},
        notes: { planId },
        theme: { color: '#4f46e5' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error('Payment initialization error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-large mb-4"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Find the right plan for your hiring needs. Scale up or down as your business grows. All prices in Indian Rupees.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>14-day free trial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {transformedPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-purple-500 ring-4 ring-purple-200 scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== 'forever' && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.buttonStyle} ${
                    plan.id === currentPlan || checkoutLoading ? 'cursor-not-allowed opacity-80' : 'hover:shadow-lg transform hover:scale-105'
                  }`}
                  disabled={plan.id === currentPlan || checkoutLoading}
                >
                  {checkoutLoading && plan.id !== currentPlan ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compare All Features
            </h2>
            <p className="text-xl text-gray-600">
              See what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  {transformedPlans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-6 font-semibold text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Job Postings', free: '1', basic: '5', premium: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'Candidate Search', free: 'Basic', basic: 'Advanced', premium: 'Advanced', enterprise: 'Advanced' },
                  { feature: 'Resume Database', free: 'No', basic: 'Yes', premium: 'Yes', enterprise: 'Yes' },
                  { feature: 'Analytics', free: 'Basic', basic: 'Advanced', premium: 'Advanced', enterprise: 'Custom' },
                  { feature: 'Support', free: 'Email', basic: 'Priority Email', premium: 'Priority Phone', enterprise: '24/7 Dedicated' },
                  { feature: 'Team Collaboration', free: 'No', basic: 'No', premium: 'Yes', enterprise: 'Yes' },
                  { feature: 'API Access', free: 'No', basic: 'No', premium: 'No', enterprise: 'Yes' },
                  { feature: 'Custom Integrations', free: 'No', basic: 'No', premium: 'No', enterprise: 'Yes' }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                    {transformedPlans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-6 text-gray-600">
                        {row[plan.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                question: "Can I change my plan anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes, we offer a 14-day free trial for all paid plans. No credit card required to start your trial."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "Your data is safe! You can export all your data before canceling, and we'll keep it for 30 days in case you want to reactivate your account."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes! Save up to 20% when you pay annually. Contact our sales team for custom enterprise pricing."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept UPI, net banking, credit/debit cards, and digital wallets. Enterprise customers can also pay via bank transfers."
              },
              {
                question: "Are the prices inclusive of GST?",
                answer: "Yes, all prices shown are inclusive of 18% GST. The final amount you pay will be exactly as displayed."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to find your next great hire?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of Indian companies already using JobZee to find top talent.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/employer/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/contact"
                  className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  Contact Sales
                </Link>
              </>
            ) : userType === 'employer' ? (
              <Link
                to="/employer/dashboard"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/employer/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Switch to Employer
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
