# 🔒 Security Packages Installation Guide

## Required Packages

Your project needs the following additional security packages to implement all the security features I've added:

### 1. Install Required Packages

Run the following command in your project directory:

```bash
npm install express-rate-limit helmet express-validator
```

### 2. Package Descriptions

- **express-rate-limit**: Rate limiting middleware to prevent abuse
- **helmet**: Security headers middleware
- **express-validator**: Input validation and sanitization

### 3. Already Installed

These security-related packages are already installed:
- ✅ `bcryptjs` - Password hashing
- ✅ `jsonwebtoken` - JWT authentication
- ✅ `cors` - CORS protection
- ✅ `multer` - File upload handling

### 4. Next Steps After Installation

1. **Install the packages**:
   ```bash
   npm install express-rate-limit helmet express-validator
   ```

2. **Update your main app.js file** to include helmet for security headers:
   ```javascript
   const helmet = require('helmet');
   
   // Add before other middleware
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   }));
   ```

3. **Set up your environment variables** using the updated `.env.example` file

4. **Test the rate limiting** by making multiple rapid requests to auth endpoints

### 5. Verification

After installation, verify everything works:

```bash
# Start the server
npm run dev

# Test that rate limiting is working by making rapid login attempts
# You should see rate limit errors after 5 attempts in 15 minutes
```

### 6. Production Checklist

Before deploying:
- [ ] Install security packages
- [ ] Set strong JWT_SECRET (64+ characters)
- [ ] Set ADMIN_INIT_KEY for production admin setup
- [ ] Configure SMTP settings for emails
- [ ] Set NODE_ENV=production
- [ ] Test all rate limits are working
- [ ] Verify JWT secret enforcement

## Notes

- The rate limiting middleware I created expects `express-rate-limit` to be installed
- All security fixes are already implemented in the code, you just need to install dependencies
- The project will work without these packages, but security features won't be active
