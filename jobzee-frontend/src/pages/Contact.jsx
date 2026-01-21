import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { validateEmail, validateName } from '../utils/validationUtils';
import mapboxgl from 'mapbox-gl';
import API_BASE_URL from '../config/api';
import 'mapbox-gl/dist/mapbox-gl.css';

const Contact = () => {
  const [animate, setAnimate] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', subject: '', message: '' });
  const [touched, setTouched] = useState({ name: false, email: false, subject: false, message: false });

  useEffect(() => {
    setAnimate(true);
  }, []);

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_TOKEN;
    if (!token || !mapContainerRef.current) return;

    mapboxgl.accessToken = token;
    const officeLng = Number(process.env.REACT_APP_OFFICE_LNG || 77.5946);
    const officeLat = Number(process.env.REACT_APP_OFFICE_LAT || 12.9716);
    const officeLabel = process.env.REACT_APP_OFFICE_ADDRESS || 'Our Office';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [officeLng, officeLat],
      zoom: 12
    });

    markerRef.current = new mapboxgl.Marker()
      .setLngLat([officeLng, officeLat])
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(officeLabel))
      .addTo(mapRef.current);

    return () => {
      try { if (mapRef.current) mapRef.current.remove(); } catch (_) {}
    };
  }, []);

  const validateField = (field, value, onFocus = false) => {
    let msg = '';
    const v = String(value || '').trim();

    if (field === 'name') {
      if (!v) msg = 'Name is required';
      else {
        const r = validateName(v);
        if (!r.isValid) msg = r.errors[0];
      }
    } else if (field === 'email') {
      if (!v) msg = 'Email is required';
      else {
        const r = validateEmail(v);
        if (!r.isValid) msg = r.errors[0];
      }
    } else if (field === 'subject') {
      if (!v) msg = 'Subject is required';
      else if (v.length < 3) msg = 'Subject must be at least 3 characters';
    } else if (field === 'message') {
      if (!v) msg = 'Message is required';
      else if (v.length < 10) msg = 'Message must be at least 10 characters';
    }

    setErrors(prev => ({ ...prev, [field]: msg }));
    return msg === '';
  };

  const handleFocus = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // On focus, if empty, show required error immediately for better UX
    if (!String(form[field] || '').trim()) {
      const requiredMap = {
        name: 'Name is required',
        email: 'Email is required',
        subject: 'Subject is required',
        message: 'Message is required'
      };
      setErrors(prev => ({ ...prev, [field]: requiredMap[field] }));
    }
  };

  const handleBlur = (field) => {
    validateField(field, form[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields before submit
    const fields = ['name', 'email', 'subject', 'message'];
    let allValid = true;
    fields.forEach((f) => {
      const ok = validateField(f, form[f]);
      if (!ok) allValid = false;
    });
    setTouched({ name: true, email: true, subject: true, message: true });
    if (!allValid) {
      toast.error('Please fix the highlighted errors');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to submit' }));
        throw new Error(err.message || 'Failed to submit');
      }

      toast.success('Thank you for your message! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setErrors({ name: '', email: '', subject: '', message: '' });
      setTouched({ name: false, email: false, subject: false, message: false });
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email Support',
      details: 'support@jobzee.com',
      link: 'mailto:support@jobzee.com'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone Number',
      details: '+1 (800) JOBZEE',
      link: 'tel:+1-800-JOBZEE'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Office Address',
      details: '123 Job Street, Tech City, TC 12345',
      link: 'https://maps.google.com'
    }
  ];

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Get Started' button in the top navigation and follow the registration process. You'll need to provide your email, create a password, and complete your profile."
    },
    {
      question: "How do I apply for a job?",
      answer: "Browse available jobs, click on a position that interests you, and use the 'Apply Now' button. Make sure your profile is complete before applying."
    },
    {
      question: "How do I post a job as an employer?",
      answer: "Register as an employer, verify your company, and use the 'Post a Job' feature to create and publish job listings."
    },
    {
      question: "What if I forgot my password?",
      answer: "Use the 'Forgot Password' link on the login page. We'll send you an email with instructions to reset your password."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 ${
            animate ? 'animate-fade-in-up' : 'opacity-0'
          }`}>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions? We're here to help! Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className={`${animate ? 'animate-fade-in-left' : 'opacity-0'}`}>
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); if (touched.name) validateField('name', e.target.value); }}
                        onFocus={() => handleFocus('name')}
                        onBlur={() => handleBlur('name')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.name && touched.name ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && touched.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={form.email}
                        onChange={(e) => { setForm({ ...form, email: e.target.value }); if (touched.email) validateField('email', e.target.value); }}
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.email && touched.email ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Enter your email"
                      />
                      {errors.email && touched.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => { setForm({ ...form, subject: e.target.value }); if (touched.subject) validateField('subject', e.target.value); }}
                      onFocus={() => handleFocus('subject')}
                      onBlur={() => handleBlur('subject')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.subject && touched.subject ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="What's this about?"
                    />
                    {errors.subject && touched.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows="6"
                      value={form.message}
                      onChange={(e) => { setForm({ ...form, message: e.target.value }); if (touched.message) validateField('message', e.target.value); }}
                      onFocus={() => handleFocus('message')}
                      onBlur={() => handleBlur('message')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${errors.message && touched.message ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Tell us more about your inquiry..."
                    />
                    {errors.message && touched.message && (
                      <p className="text-sm text-red-600 mt-1">{errors.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 hover:scale-105 transform'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`${animate ? 'animate-fade-in-right' : 'opacity-0'}`}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    We're here to help with any questions you might have about our platform, 
                    job opportunities, or how to get started.
                  </p>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{info.title}</h3>
                        <a 
                          href={info.link}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          {info.details}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Hours */}
                <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-lg p-6 text-white">
                  <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 ${
            animate ? 'animate-fade-in-up' : 'opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Find quick answers to common questions about JobZee
            </p>
          </div>

          <div className={`space-y-6 ${
            animate ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
          }`}>
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-8 ${
            animate ? 'animate-fade-in-up' : 'opacity-0'
          }`}>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Visit Our Office</h2>
            <p className="text-lg text-gray-600">
              Come say hello at our office HQ
            </p>
          </div>
          
          <div className={`bg-white rounded-lg shadow-lg p-8 ${
            animate ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'
          }`}>
            <div ref={mapContainerRef} className="w-full h-96 rounded-lg overflow-hidden border border-gray-200" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact; 