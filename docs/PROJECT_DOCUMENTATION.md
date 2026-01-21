# 📋 JobZee - Complete Project Documentation
*A Comprehensive Job Portal Platform*

## 🎯 Project Overview

**JobZee** is a full-stack job portal application built with modern web technologies. It serves as a platform connecting job seekers with employers, featuring user management, job posting, application tracking, and administrative capabilities.

### 🏗️ Architecture

```
JobZee/
├── jobzee-backend/          # Node.js/Express API Server
├── jobzee-frontend/         # React.js Web Application  
├── security-hardening.js   # Security automation script
└── Documentation Files     # Project guides and reports
```

## 🚀 Technical Stack

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB (Cloud Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Cloudinary (cloud storage)
- **Email Service**: Nodemailer (SMTP)
- **Security**: Helmet, Rate Limiting, Input Validation

### Frontend Technologies
- **Library**: React 19.1.1
- **Routing**: React Router DOM 7.7.1
- **Styling**: Tailwind CSS 3.4.17
- **HTTP Client**: Fetch API
- **Notifications**: React Toastify
- **Phone Input**: React Phone Input 2
- **JWT Handling**: jwt-decode

### Database & Cloud Services
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: Cloudinary
- **Email**: Gmail SMTP / SendGrid (Production)
- **Authentication**: Google OAuth 2.0

## 📁 Detailed Project Structure

### 🔧 Backend (`jobzee-backend/`)

#### 📂 Core Application Files
```
index.js                 # Main server entry point
package.json            # Dependencies and scripts
.env                    # Environment variables (Development)
.env.example           # Environment template
.env.production.template # Production environment template
```

#### 🛡️ Security & Middleware (`middleware/`)
```
adminAuth.js           # Admin authentication middleware
auth.js               # General user authentication
employerAuth.js       # Employer-specific authentication
rateLimiter.js        # API rate limiting configuration
security.js           # Comprehensive security middleware (NEW)
upload.js             # File upload handling
uploadCloudinary.js   # Cloudinary integration
```

#### 📊 Data Models (`models/`)
```
User.js               # Job seeker user model
UserDetails.js        # Extended user profile information
Employer.js           # Company/employer model  
Admin.js              # Administrative user model
Job.js                # Job posting model
DashboardAsset.js     # Dashboard content management
```

#### 🎮 Controllers (`controllers/`)
```
authController.js      # User authentication logic
employerController.js  # Employer-related operations
```

#### 🛣️ Routes (`routes/`)
```
authRoutes.js         # Authentication endpoints
employerRoutes.js     # Employer management endpoints
adminRoutes.js        # Admin panel endpoints
uploadRoutes.js       # File upload endpoints
dashboardAssets.js    # Dashboard content endpoints
```

#### 📧 Services (`services/`)
```
emailService.js       # Email templating and sending
dashboardAssetsService.js # Dashboard content management
```

#### 🔧 Configuration (`config/`)
```
cloudinary.js         # Cloudinary setup
db.js                 # Database connection
```

#### 📜 Scripts (`scripts/`)
```
initAdmin.js          # Admin user initialization
initializeDashboardAssets.js # Dashboard setup
testUpload.js         # Upload functionality testing
Various admin management scripts
```

#### 📖 Documentation (`docs/`)
```
PASSWORD_RESET.md     # Password reset implementation guide
API_DOCUMENTATION.md  # Complete API reference
SECURITY.md           # Security implementation details
SYSTEM_STATUS_REPORT.md # System health monitoring
```

### 🎨 Frontend (`jobzee-frontend/`)

#### 📂 Core Files
```
package.json          # Dependencies and build scripts
public/               # Static assets
src/                  # React application source
```

#### 📱 React Components (`src/components/`)
```
Layout.jsx            # Main application layout
Navbar.jsx            # Navigation component
Footer.jsx            # Footer component

Authentication:
Login.jsx             # User login form
Register.jsx          # User registration
EmployerLogin.jsx     # Employer login
EmployerRegister.jsx  # Employer registration
ForgotPassword.jsx    # Password reset request
ResetPassword.jsx     # Password reset form
EmployerForgotPassword.jsx # Employer password reset
EmployerResetPassword.jsx  # Employer password reset form

User Management:
UserProfile.jsx       # Job seeker profile
EmployerProfile.jsx   # Employer profile management
PhotoUpload.jsx       # Profile picture upload
Onboarding.jsx        # User onboarding flow

Admin:
AdminLogin.jsx        # Admin authentication
AdminDashboard.jsx    # Admin control panel

Job Management:
JobSearch.jsx         # Job search functionality

Utilities:
GoogleSignIn.jsx      # Google OAuth integration
```

#### 📄 Pages (`src/pages/`)
```
Home.jsx              # Landing page (classic)
HomeModern.jsx        # Modern landing page
About.jsx             # About page
Contact.jsx           # Contact information
Dashboard.jsx         # User dashboard
EmployerDashboard.jsx # Employer dashboard
Profile.jsx           # Profile management
PageNotFound.jsx      # 404 error page
```

#### 🔧 Utilities (`src/utils/`)
```
sessionManager.js     # Session management utilities
validationUtils.js    # Form validation helpers
```

#### 🔌 Services (`src/services/`)
```
dashboardAssets.js    # Dashboard content API integration
```

## 🎯 Core Features

### 👥 User Management System

#### **Job Seekers**
- **Registration & Authentication**: Email/password and Google OAuth
- **Profile Management**: Personal information, skills, experience
- **Resume Upload**: PDF/Document upload via Cloudinary
- **Job Search & Applications**: Browse and apply for jobs
- **Dashboard**: Track applications, profile completion

#### **Employers**
- **Company Registration**: Business profile with verification
- **Job Posting Management**: Create, edit, delete job listings
- **Application Management**: Review and manage job applications
- **Subscription System**: Free and premium plans
- **Company Branding**: Logo and company information management

#### **Administrators**
- **System Management**: User and employer oversight
- **Content Management**: Dashboard assets and system content
- **Security Monitoring**: User activity and system health
- **Data Analytics**: Platform usage statistics

### 🔐 Security Architecture

#### **Authentication & Authorization**
- **JWT Tokens**: Secure, stateless authentication
- **Role-Based Access Control**: User, Employer, Admin roles
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Token expiration and refresh

#### **Data Protection**
- **Input Validation**: Express-validator for all inputs
- **NoSQL Injection Protection**: MongoDB sanitization
- **XSS Prevention**: Content Security Policy headers
- **Rate Limiting**: Multi-tier protection against abuse

#### **Security Headers** (via Helmet.js)
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Clickjacking protection
- **X-XSS-Protection**: Cross-site scripting prevention
- **Content-Security-Policy**: Resource loading restrictions
- **Strict-Transport-Security**: HTTPS enforcement

### 📧 Email System

#### **Transactional Emails**
- **Welcome Messages**: User onboarding
- **Password Reset**: Secure token-based reset
- **Job Notifications**: Application updates
- **System Alerts**: Security and admin notifications

#### **Email Templates**
- **Responsive Design**: Mobile-friendly HTML templates
- **Brand Consistency**: Customizable branding
- **Security Features**: Token validation, expiration handling

### ☁️ Cloud Integration

#### **Cloudinary Integration**
- **Image Processing**: Automatic optimization and resizing
- **Secure Upload**: Direct browser-to-cloud uploads
- **CDN Delivery**: Global content delivery
- **Format Conversion**: Automatic format optimization

#### **MongoDB Atlas**
- **Cloud Database**: Managed MongoDB hosting
- **Automatic Scaling**: Performance optimization
- **Backup & Recovery**: Automated data protection
- **Security**: Network isolation and encryption

## 🔧 Environment Configuration

### Development Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobzeeDB

# Security
JWT_SECRET=your_secure_128_character_jwt_secret

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Production Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database (Production cluster)
MONGODB_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/jobzee

# Security (Strong production secrets)
JWT_SECRET=cryptographically_secure_128_character_production_secret

# File Upload (Production Cloudinary)
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret

# Email Service (Production SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Google OAuth (Production credentials)
GOOGLE_CLIENT_ID=production_google_oauth_client_id
GOOGLE_CLIENT_SECRET=production_google_oauth_client_secret
```

## 🚀 Development Workflow

### Backend Development
```bash
# Install dependencies
cd jobzee-backend
npm install

# Start development server
npm run dev

# Initialize admin user
npm run init-admin

# Initialize dashboard assets
npm run init-dashboard-assets

# Test file uploads
npm run test-upload
```

### Frontend Development
```bash
# Install dependencies
cd jobzee-frontend
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Full Stack Development
```bash
# Terminal 1: Start backend
cd jobzee-backend && npm run dev

# Terminal 2: Start frontend
cd jobzee-frontend && npm start
```

## 📡 API Architecture

### Authentication Endpoints
```
POST /api/auth/register          # User registration
POST /api/auth/login             # User login
POST /api/auth/google            # Google OAuth
POST /api/auth/logout            # User logout
POST /api/auth/forgot-password   # Password reset request
POST /api/auth/reset-password    # Password reset confirmation
GET  /api/auth/profile           # Get user profile
PUT  /api/auth/profile           # Update user profile
```

### Employer Endpoints
```
POST /api/employers/register           # Employer registration
POST /api/employers/login              # Employer login
POST /api/employers/google             # Google OAuth for employers
POST /api/employers/forgot-password    # Password reset request
POST /api/employers/reset-password     # Password reset confirmation
GET  /api/employers/profile            # Get employer profile
PUT  /api/employers/profile            # Update employer profile
GET  /api/employers/dashboard/stats    # Dashboard statistics
PUT  /api/employers/change-password    # Change password
PUT  /api/employers/deactivate         # Deactivate account
POST /api/employers/test-email         # Email service testing (dev only)
```

### Admin Endpoints
```
POST /api/admin/login                  # Admin login
GET  /api/admin/dashboard/stats        # System statistics
GET  /api/admin/users                  # List all users
GET  /api/admin/employers              # List all employers
PUT  /api/admin/users/:id              # Update user
PUT  /api/admin/employers/:id          # Update employer
DELETE /api/admin/users/:id            # Delete user
DELETE /api/admin/employers/:id        # Delete employer
```

### File Upload Endpoints
```
POST /api/upload/avatar                # Upload profile picture
POST /api/upload/resume                # Upload resume/CV
POST /api/upload/company-logo          # Upload company logo
```

### Dashboard Assets Endpoints
```
GET  /api/dashboard/assets             # Get dashboard content
POST /api/dashboard/assets             # Create dashboard content
PUT  /api/dashboard/assets/:id         # Update dashboard content
DELETE /api/dashboard/assets/:id       # Delete dashboard content
```

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (default: 'user'),
  isVerified: Boolean (default: false),
  profilePicture: String (Cloudinary URL),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean (default: true),
  googleId: String (optional),
  resetPasswordToken: String (optional),
  resetPasswordExpires: Date (optional)
}
```

### UserDetails Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  experience: String,
  skills: [String],
  education: String,
  resume: String (Cloudinary URL),
  portfolio: String,
  bio: String,
  preferences: {
    jobType: String,
    location: String,
    salaryRange: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Employer Collection
```javascript
{
  _id: ObjectId,
  companyName: String (required),
  companyEmail: String (unique, indexed),
  password: String (hashed),
  role: String (default: 'employer'),
  companyWebsite: String,
  companySize: String,
  industry: String,
  description: String,
  logo: String (Cloudinary URL),
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactPerson: {
    firstName: String,
    lastName: String,
    title: String,
    phone: String
  },
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  subscriptionPlan: String (default: 'free'),
  subscriptionExpiry: Date,
  jobPostingsUsed: Number (default: 0),
  jobPostingLimit: Number (default: 5),
  googleId: String (optional),
  resetPasswordToken: String (optional),
  resetPasswordExpires: Date (optional),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Admin Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (default: 'admin'),
  permissions: {
    manageUsers: Boolean (default: true),
    manageEmployers: Boolean (default: true),
    manageJobs: Boolean (default: true),
    manageContent: Boolean (default: true),
    systemSettings: Boolean (default: false)
  },
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Job Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (required),
  requirements: [String],
  employerId: ObjectId (ref: 'Employer'),
  company: String,
  location: String,
  jobType: String, // full-time, part-time, contract, remote
  salaryRange: String,
  experienceLevel: String,
  skills: [String],
  benefits: [String],
  applicationDeadline: Date,
  isActive: Boolean (default: true),
  applicationsCount: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### DashboardAsset Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  type: String, // announcement, metric, chart, news
  content: Object, // Flexible content structure
  targetRole: String, // user, employer, admin, all
  isActive: Boolean (default: true),
  displayOrder: Number,
  validFrom: Date,
  validUntil: Date,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Implementation

### Rate Limiting Configuration
```javascript
// General API: 100 requests per 15 minutes
generalLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 100
}

// Authentication: 5 requests per 15 minutes
authLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 5
}

// Password Reset: 3 requests per hour
passwordResetLimiter: {
  windowMs: 60 * 60 * 1000,
  max: 3
}

// Admin Operations: 3 requests per 15 minutes
adminLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 3
}
```

### JWT Token Configuration
```javascript
// Token Generation
jwt.sign(payload, JWT_SECRET, {
  expiresIn: '24h',        // User tokens: 24 hours
  issuer: 'JobZee',        // Token issuer
  audience: 'JobZee-Users' // Token audience
})

// Token Verification
jwt.verify(token, JWT_SECRET, {
  issuer: 'JobZee',
  audience: 'JobZee-Users'
})
```

### Password Security
```javascript
// Password Hashing
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password Validation
const isValid = await bcrypt.compare(password, hashedPassword);
```

## 📊 Monitoring & Analytics

### System Health Endpoints
```
GET /api/health                   # Application health check
```

### Health Check Response
```javascript
{
  status: "OK",
  timestamp: "2024-12-10T12:00:00Z",
  database: {
    status: "connected",
    connected: true,
    ping: "OK"
  },
  server: {
    uptime: 3600,
    memory: {
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 20000000
    },
    version: "v18.17.0"
  }
}
```

### Logging Strategy
```javascript
// Request Logging
console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

// Security Event Logging
console.log(`🔐 Security-sensitive operation: ${method} ${url} from ${ip}`);

// Error Logging
console.error('Error details:', {
  message: err.message,
  stack: err.stack,
  url: req.url,
  method: req.method,
  timestamp: new Date().toISOString()
});
```

## 🛠️ Development Tools & Scripts

### Backend Scripts
```bash
npm start                    # Production server
npm run dev                  # Development with nodemon
npm run init-admin          # Create admin user
npm run init-dashboard-assets # Setup dashboard content
npm run test-upload         # Test file uploads
```

### Security Tools
```bash
node security-hardening.js  # Automated security fixes
node run-security-tests.js  # Security testing suite
npm audit                   # Dependency vulnerability scan
```

### Database Management
```bash
# MongoDB connection test
node -e "require('./config/db.js')"

# Admin user creation
node scripts/initAdmin.js

# Database backup (production)
mongodump --uri="MONGODB_URI" --out=backup/
```

## 🌐 Deployment Architecture

### Development Environment
```
Frontend: http://localhost:3000 (React Dev Server)
Backend:  http://localhost:5000 (Express Server)
Database: MongoDB Atlas (Development Cluster)
Storage:  Cloudinary (Development Environment)
```

### Production Environment
```
Frontend: https://yourdomain.com (Static Build)
Backend:  https://api.yourdomain.com (Express Server)
Database: MongoDB Atlas (Production Cluster)
Storage:  Cloudinary (Production Environment)
Proxy:    Nginx/Cloudflare (Reverse Proxy)
SSL:      Let's Encrypt/Cloudflare (HTTPS)
```

### Recommended Production Setup
```
Server: VPS/Cloud Instance (2GB RAM, 2 CPU cores minimum)
OS: Ubuntu 20.04 LTS or newer
Runtime: Node.js 18.17.0 or newer
Process Manager: PM2 for process management
Reverse Proxy: Nginx for static files and SSL termination
Monitoring: Uptime monitoring and error tracking
Backup: Automated database backups
```

## 📈 Performance Considerations

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection optimization
- **Rate Limiting**: API abuse prevention
- **Caching**: Future implementation of Redis caching
- **File Upload**: Direct-to-Cloudinary uploads

### Frontend Optimization
- **Code Splitting**: React lazy loading
- **Asset Optimization**: Webpack bundle optimization
- **Image Optimization**: Cloudinary automatic optimization
- **CDN**: Content delivery network for static assets

### Security Performance
- **JWT**: Stateless authentication for scalability
- **Password Hashing**: Optimized bcrypt rounds
- **Input Validation**: Efficient validation middleware
- **Rate Limiting**: Memory-based limiting for performance

## 🔮 Future Enhancements

### Planned Features
- **Real-time Chat**: Job seeker and employer communication
- **Video Interviews**: Integrated video calling
- **AI Job Matching**: Machine learning job recommendations
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Detailed platform analytics
- **Payment Integration**: Premium subscription handling
- **Multi-language**: Internationalization support

### Technical Improvements
- **Microservices**: Service decomposition for scalability
- **Redis Caching**: Performance optimization
- **WebSocket**: Real-time notifications
- **GraphQL**: Flexible API queries
- **Docker**: Containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment

## 📞 Contact & Support

### Development Team Contact
- **Project Lead**: [Your Name]
- **Email**: [your.email@domain.com]
- **Repository**: [GitHub/GitLab Repository URL]

### Documentation Links
- **API Documentation**: `/jobzee-backend/API_DOCUMENTATION.md`
- **Security Guide**: `/SECURITY_GUIDE.md`
- **Setup Guides**: Multiple setup documentation files
- **Security Audit**: `/SECURITY_AUDIT_REPORT.md`

### Support Resources
- **Admin Guide**: `/ADMIN_LOGIN_GUIDE.md`
- **Employer System**: `/EMPLOYER_SYSTEM.md`
- **Google OAuth Setup**: `/GOOGLE_OAUTH_SETUP.md`
- **Cloudinary Setup**: `/CLOUDINARY_SETUP.md`
- **Password Reset Guide**: `/FORGOT_PASSWORD_GUIDE.md`

---

## 📝 Summary

**JobZee** is a comprehensive, production-ready job portal platform with enterprise-grade security, modern architecture, and scalable design. The application demonstrates proficiency in full-stack development, security implementation, cloud integration, and professional software development practices.

### Key Achievements:
- ✅ **Full-Stack Architecture**: Complete MERN stack implementation
- ✅ **Security-First Design**: Enterprise-grade security measures
- ✅ **Cloud Integration**: Scalable cloud services integration
- ✅ **Professional Standards**: Industry-standard development practices
- ✅ **Production Ready**: Comprehensive deployment documentation
- ✅ **Comprehensive Testing**: Security and functionality testing
- ✅ **Documentation**: Thorough project documentation

**This project represents a professional-level application suitable for real-world deployment and demonstrates advanced full-stack development capabilities.**
