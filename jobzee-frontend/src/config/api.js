// API Configuration
// Uses environment variable in production, falls back to localhost in development

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  AUTH: `${API_BASE_URL}/api/auth`,
  // Jobs
  JOBS: `${API_BASE_URL}/api/jobs`,
  // Applications
  APPLICATIONS: `${API_BASE_URL}/api/applications`,
  // Employers
  EMPLOYERS: `${API_BASE_URL}/api/employers`,
  // Admin
  ADMIN: `${API_BASE_URL}/api/admin`,
  // Upload
  UPLOAD: `${API_BASE_URL}/api/upload`,
  // Dashboard
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  // Contact
  CONTACT: `${API_BASE_URL}/api/contact`,
  // Interviews
  INTERVIEWS: `${API_BASE_URL}/api/interviews`,
  // Saved Jobs
  SAVED_JOBS: `${API_BASE_URL}/api/saved-jobs`,
  // Pricing
  PRICING: `${API_BASE_URL}/api/pricing`,
  // Payments
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  // Invoices
  INVOICES: `${API_BASE_URL}/api/invoices`,
  // User Notifications
  USER_NOTIFICATIONS: `${API_BASE_URL}/api/user/notifications`,
  // Events
  EVENTS: `${API_BASE_URL}/api/events`,
  // Tickets
  TICKETS: `${API_BASE_URL}/api/tickets`,
  // Employer Notifications
  EMPLOYER_NOTIFICATIONS: `${API_BASE_URL}/api/employers/notifications`,
  // Products
  PRODUCTS: `${API_BASE_URL}/api/products`,
  // Orders
  ORDERS: `${API_BASE_URL}/api/orders`,
  // Shop Payments
  SHOP_PAYMENTS: `${API_BASE_URL}/api/shop-payments`,
  // Addresses
  ADDRESSES: `${API_BASE_URL}/api/addresses`,
  // Cart
  CART: `${API_BASE_URL}/api/cart`,
  // Internships
  INTERNSHIPS: `${API_BASE_URL}/api/internships`,
  // Internship Applications
  INTERNSHIP_APPLICATIONS: `${API_BASE_URL}/api/internship-applications`,
  // AI Predictions
  PREDICTIONS: `${API_BASE_URL}/api/predictions`,
  // AI Screening
  SCREENING: `${API_BASE_URL}/api/screening`,
};

export default API_BASE_URL;
