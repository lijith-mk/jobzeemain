// Session Management Utility
class SessionManager {
  constructor() {
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.setupEventListeners();
    this.checkSession();
  }

  setupEventListeners() {
    // Handle page visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.updateLastActivity();
      }
    });

    // IMPORTANT: Do NOT clear auth on page unload; payment redirects cause unload
    // window.addEventListener('beforeunload', this.handlePageClose);

    // Handle page focus (user returns to tab)
    window.addEventListener('focus', () => {
      this.updateLastActivity();
    });

    // Handle user activity (mouse move, key press, etc.)
    let activityTimeout;
    const handleUserActivity = () => {
      this.updateLastActivity();
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.updateLastActivity();
      }, 30000); // Update every 30 seconds of inactivity
    };

    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
  }

  updateLastActivity() {
    const now = Date.now();
    localStorage.setItem('lastActivity', now.toString());
  }

  handlePageClose() {
    // Previously cleared session on unload which logged users out during redirects.
    // Intentionally left as a no-op to preserve login across payment redirects.
  }

  checkSession() {
    const lastActivity = localStorage.getItem('lastActivity');
    const token = localStorage.getItem('token') || localStorage.getItem('employerToken');
    
    if (!token) {
      return; // No session to check
    }

    if (!lastActivity) {
      this.updateLastActivity();
      return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);

    // Grace period for redirects (e.g., payment success pages) to avoid accidental logout
    const isCheckoutSuccess = window.location.pathname.startsWith('/checkout/success');
    const extendedTimeout = isCheckoutSuccess ? this.sessionTimeout + (5 * 60 * 1000) : this.sessionTimeout;

    // If more than timeout has passed, logout
    if (timeSinceLastActivity > extendedTimeout) {
      this.clearSession();
      window.location.href = '/';
      return;
    }

    // Update last activity
    this.updateLastActivity();
  }

  clearSession() {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('employerToken');
    localStorage.removeItem('employer');
    localStorage.removeItem('lastActivity');
  }

  // Method to manually logout
  logout() {
    this.clearSession();
    window.location.href = '/';
  }

  // Method to check if user is logged in
  isLoggedIn() {
    const token = localStorage.getItem('token') || localStorage.getItem('employerToken');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!token) return false;
    // If token exists but no activity yet (fresh tab or after redirect), initialize and allow
    if (!lastActivity) {
      this.updateLastActivity();
      return true;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    return timeSinceLastActivity <= this.sessionTimeout;
  }

  // Method to get current user type
  getUserType() {
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
      return 'user';
    } else if (localStorage.getItem('employerToken') && localStorage.getItem('employer')) {
      return 'employer';
    }
    return null;
  }

  // Method to get current user data
  getCurrentUser() {
    const userType = this.getUserType();
    if (userType === 'user') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } else if (userType === 'employer') {
      const employerData = localStorage.getItem('employer');
      return employerData ? JSON.parse(employerData) : null;
    }
    return null;
  }
}

// Create and export a singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
