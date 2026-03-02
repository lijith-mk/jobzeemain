// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://jobzeemain-zjrh.onrender.com',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    GOOGLE_AUTH: '/api/auth/google',
  },
  
  // Employer endpoints
  EMPLOYER: {
    REGISTER: '/api/employers/register',
    LOGIN: '/api/employers/login',
    PROFILE: '/api/employers/profile',
    FORGOT_PASSWORD: '/api/employers/forgot-password',
    RESET_PASSWORD: '/api/employers/reset-password',
  },
  
  // Job endpoints
  JOBS: {
    ALL: '/api/jobs',
    BY_ID: (id) => `/api/jobs/${id}`,
    BY_EMPLOYER: '/api/employers/jobs',
    CREATE: '/api/employers/jobs',
    UPDATE: (id) => `/api/employers/jobs/${id}`,
    DELETE: (id) => `/api/employers/jobs/${id}`,
    SEARCH: '/api/jobs/search',
    APPLY: '/api/applications/apply',
  },
  
  // Application endpoints
  APPLICATIONS: {
    MY_APPLICATIONS: '/api/applications/my-applications',
    BY_ID: (id) => `/api/applications/${id}`,
    WITHDRAW: (id) => `/api/applications/${id}/withdraw`,
    JOB_APPLICATIONS: (jobId) => `/api/applications/job/${jobId}`,
    UPDATE_STATUS: (id) => `/api/applications/${id}/status`,
  },
  
  // Saved Jobs endpoints
  SAVED_JOBS: {
    LIST: '/api/saved-jobs/my-jobs',
    SAVE: (jobId) => `/api/saved-jobs/${jobId}/save`,
    UNSAVE: (jobId) => `/api/saved-jobs/${jobId}/save`,
    CHECK: (jobId) => `/api/saved-jobs/${jobId}/saved-status`,
  },
  
  // Internship endpoints
  INTERNSHIPS: {
    ALL: '/api/internships',
    BY_ID: (id) => `/api/internships/${id}`,
    CREATE: '/api/internships',
    BY_EMPLOYER: (id) => `/api/internships/employer/${id}`,
    APPLY: '/api/internship-applications/apply',
  },
  
  // Internship Application endpoints
  INTERNSHIP_APPLICATIONS: {
    MY_APPLICATIONS: '/api/internship-applications/user/my-applications',
    BY_ID: (id) => `/api/internship-applications/${id}`,
    WITHDRAW: (id) => `/api/internship-applications/${id}/withdraw`,
    BY_INTERNSHIP: (internshipId) => `/api/internships/${internshipId}/applications`,
    UPDATE_STATUS: (id) => `/api/internship-applications/${id}/status`,
  },
  
  // Learning endpoints
  LEARNING: {
    COURSES: '/api/learning/courses',
    COURSE_BY_ID: (id) => `/api/learning/courses/${id}`,
    MY_COURSES: '/api/learning/my-courses',
    ENROLL: '/api/learning/courses/enroll',
    CREATE_PAYMENT_ORDER: '/api/learning/courses/create-payment-order',
    VERIFY_PAYMENT: '/api/learning/courses/verify-payment',
    INVOICES: '/api/learning/invoices',
    INVOICE_BY_ID: (id) => `/api/learning/invoices/${id}`,
    PROGRESS: '/api/learning/courses/progress',
    RATE: '/api/learning/courses/rate',
    LEARNING_PATHS: '/api/learning/learning-paths',
    LEARNING_PATH_PROGRESS: (pathId) => `/api/learning/learning-paths/${pathId}/progress`,
    BOOKMARK: (courseId) => `/api/learning/courses/${courseId}/bookmark`,
    BOOKMARKS: '/api/learning/bookmarks',
  },
  
  // Mentor endpoints
  MENTOR: {
    ALL: '/api/mentor-applications/public',
    BY_ID: (id) => `/api/mentor-applications/public/${id}`,
    REGISTER: '/api/mentors/register',
    LOGIN: '/api/mentors/login',
    AVAILABILITY: '/api/mentors/availability',
  },

  // Session endpoints (Mentor Session Bookings)
  SESSIONS: {
    // User/Employee endpoints
    BOOK: '/api/sessions/book',
    MY_BOOKINGS: '/api/sessions/my-bookings',
    BY_ID: (id) => `/api/sessions/${id}`,
    CANCEL: (id) => `/api/sessions/${id}/cancel`,
    JOIN: (id) => `/api/sessions/${id}/join`,
    AVAILABILITY: '/api/sessions/availability',
    // Mentor endpoints (if app supports mentor accounts)
    MENTOR_SESSIONS: '/api/sessions/mentor/sessions',
    MENTOR_CALENDAR: '/api/sessions/mentor/calendar',
    MENTOR_SESSION_BY_ID: (id) => `/api/sessions/mentor/sessions/${id}`,
    UPDATE_SESSION: (id) => `/api/sessions/mentor/sessions/${id}`,
    MENTOR_JOIN: (id) => `/api/sessions/mentor/sessions/${id}/join`,
  },
  
  // Events endpoints
  EVENTS: {
    ALL: '/api/events',
    BY_ID: (id) => `/api/events/${id}`,
    REGISTER: (id) => `/api/events/${id}/register`,
    MY_EVENTS: '/api/events/user/my-events',
    USER_STATS: '/api/events/user/stats',
    USER_PAYMENTS: '/api/events/user/payments',
    // Employer event endpoints
    CREATE: '/api/employers/events',
    MY_EMPLOYER_EVENTS: '/api/employers/events',
    UPDATE: (id) => `/api/employers/events/${id}`,
    DELETE: (id) => `/api/employers/events/${id}`,
    EMPLOYER_BY_ID: (id) => `/api/employers/events/${id}`,
    EVENT_REGISTRATIONS: (id) => `/api/employers/events/${id}/registrations`,
  },
  
  // Upload endpoints
  UPLOAD: {
    USER_PHOTO: '/api/upload/user/profile-photo',
    USER_RESUME: '/api/upload/user/resume',
    EMPLOYER_LOGO: '/api/upload/employer/logo',
  },
  
  // Certificate endpoints
  CERTIFICATES: {
    MY_CERTIFICATES: '/api/certificates/my-certificates',
    VERIFY: '/api/certificates/verify',
    GENERATE: '/api/certificates/generate',
  },
  
  // Test endpoints
  TESTS: {
    ALL: '/api/tests',
    BY_ID: (id) => `/api/tests/${id}`,
    SUBMIT: (id) => `/api/tests/${id}/submit`,
    RESULTS: '/api/tests/results',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  EMPLOYER_TOKEN: 'employerToken',
  MENTOR_TOKEN: 'mentorToken',
  USER_DATA: 'userData',
  EMPLOYER_DATA: 'employerData',
  MENTOR_DATA: 'mentorData',
  USER_TYPE: 'userType', // 'user' | 'employer' | 'mentor' | 'admin'
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'JobZee',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@jobzee.com',
};
