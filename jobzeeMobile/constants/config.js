// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://jobzeemain-zjrh.onrender.com/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    GOOGLE_AUTH: '/auth/google',
  },
  
  // Employer endpoints
  EMPLOYER: {
    REGISTER: '/employers/register',
    LOGIN: '/employers/login',
    PROFILE: '/employers/profile',
    FORGOT_PASSWORD: '/employers/forgot-password',
    RESET_PASSWORD: '/employers/reset-password',
  },
  
  // Job endpoints
  JOBS: {
    ALL: '/jobs',
    BY_ID: (id) => `/jobs/${id}`,
    BY_EMPLOYER: (id) => `/employers/${id}/jobs`,
    CREATE: '/jobs',
    UPDATE: (id) => `/jobs/${id}`,
    DELETE: (id) => `/jobs/${id}`,
    SEARCH: '/jobs/search',
    APPLY: '/applications/apply',
  },
  
  // Application endpoints
  APPLICATIONS: {
    MY_APPLICATIONS: '/applications/my-applications',
    BY_ID: (id) => `/applications/${id}`,
    WITHDRAW: (id) => `/applications/${id}/withdraw`,
    JOB_APPLICATIONS: (jobId) => `/applications/job/${jobId}`,
    UPDATE_STATUS: (id) => `/applications/${id}/status`,
  },
  
  // Saved Jobs endpoints
  SAVED_JOBS: {
    LIST: '/saved-jobs/my-jobs',
    SAVE: (jobId) => `/saved-jobs/${jobId}/save`,
    UNSAVE: (jobId) => `/saved-jobs/${jobId}/save`,
    CHECK: (jobId) => `/saved-jobs/${jobId}/saved-status`,
  },
  
  // Internship endpoints
  INTERNSHIPS: {
    ALL: '/internships',
    BY_ID: (id) => `/internships/${id}`,
    CREATE: '/internships',
    BY_EMPLOYER: (id) => `/internships/employer/${id}`,
    APPLY: '/internship-applications/apply',
  },
  
  // Internship Application endpoints
  INTERNSHIP_APPLICATIONS: {
    MY_APPLICATIONS: '/internship-applications/user/my-applications',
    BY_ID: (id) => `/internship-applications/${id}`,
    WITHDRAW: (id) => `/internship-applications/${id}/withdraw`,
    BY_INTERNSHIP: (internshipId) => `/internships/${internshipId}/applications`,
    UPDATE_STATUS: (id) => `/internship-applications/${id}/status`,
  },
  
  // Learning endpoints
  LEARNING: {
    COURSES: '/learning/courses',
    COURSE_BY_ID: (id) => `/learning/courses/${id}`,
    MY_COURSES: '/learning/my-courses',
    ENROLL: '/learning/courses/enroll',
    PROGRESS: '/learning/courses/progress',
    RATE: '/learning/courses/rate',
    LEARNING_PATHS: '/learning/learning-paths',
    LEARNING_PATH_PROGRESS: (pathId) => `/learning/learning-paths/${pathId}/progress`,
    BOOKMARK: (courseId) => `/learning/courses/${courseId}/bookmark`,
    BOOKMARKS: '/learning/bookmarks',
  },
  
  // Mentor endpoints
  MENTOR: {
    ALL: '/mentors/all',
    REGISTER: '/mentors/register',
    LOGIN: '/mentors/login',
    SESSIONS: '/mentor-sessions',
    BOOKINGS: '/bookings',
    AVAILABILITY: '/mentors/availability',
  },
  
  // Upload endpoints
  UPLOAD: {
    USER_PHOTO: '/upload/user/profile-photo',
    USER_RESUME: '/upload/user/resume',
    EMPLOYER_LOGO: '/upload/employer/logo',
  },
  
  // Certificate endpoints
  CERTIFICATES: {
    MY_CERTIFICATES: '/certificates/my-certificates',
    VERIFY: '/certificates/verify',
    GENERATE: '/certificates/generate',
  },
  
  // Test endpoints
  TESTS: {
    ALL: '/tests',
    BY_ID: (id) => `/tests/${id}`,
    SUBMIT: (id) => `/tests/${id}/submit`,
    RESULTS: '/tests/results',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  EMPLOYER_TOKEN: 'employerToken',
  USER_DATA: 'userData',
  EMPLOYER_DATA: 'employerData',
  USER_TYPE: 'userType', // 'user' | 'employer' | 'admin'
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'JobZee',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@jobzee.com',
};
