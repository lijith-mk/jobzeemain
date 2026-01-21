# Password Reset Feature Documentation

This document explains how to use the forgot password feature for both users and employers in the Jobzee application.

## Overview

The password reset feature allows users and employers to securely reset their passwords using email verification. The system uses:
- Secure token generation with hashing
- Email delivery via nodemailer (Gmail SMTP)
- 1-hour token expiration for security
- Protection against email enumeration attacks

## API Endpoints

### User Password Reset

#### 1. Request Password Reset
```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, we have sent a password reset link to it.",
  "success": true
}
```

#### 2. Verify Reset Token (Optional)
```
GET /api/auth/verify-reset-token/:token
```

**Response:**
```json
{
  "message": "Reset token is valid",
  "valid": true,
  "user": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "timeRemaining": 45
}
```

#### 3. Reset Password
```
POST /api/auth/reset-password/:token
```

**Request Body:**
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password has been reset successfully. You can now log in with your new password.",
  "success": true
}
```

### Employer Password Reset

#### 1. Request Password Reset
```
POST /api/employers/forgot-password
```

**Request Body:**
```json
{
  "companyEmail": "company@example.com"
}
```

#### 2. Reset Password
```
POST /api/employers/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewPassword123!"
}
```

## Email Configuration

### Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Optional: Frontend URL for reset links
FRONTEND_URL=http://localhost:3000
```

### Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **App Passwords**
3. Generate a new app password for "Mail"
4. Use this app password in the `EMAIL_PASS` environment variable

## Security Features

### Token Security
- Uses crypto.randomBytes(32) for secure token generation
- Tokens are hashed with SHA256 before storage
- Only the hashed version is stored in the database
- Tokens expire after 1 hour

### Email Enumeration Protection
- Always returns success message, even for non-existent emails
- Doesn't reveal whether an email exists in the system

### Google OAuth Users
- Special handling for users who signed up with Google
- Redirects Google OAuth users to use Google Sign-In instead

## Password Requirements

Passwords must meet these criteria:
- At least 8 characters long
- Contains at least one lowercase letter
- Contains at least one uppercase letter
- Contains at least one number
- Contains at least one special character (@$!%*?&)

## Database Schema Updates

### User Model
```javascript
{
  // ... existing fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}
```

### Employer Model
```javascript
{
  // ... existing fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}
```

## Frontend Integration

### 1. Forgot Password Form
```javascript
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Password reset link sent to your email!');
    } else {
      showError(data.message);
    }
  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
};
```

### 2. Reset Password Form
```javascript
const handleResetPassword = async (token, password, confirmPassword) => {
  try {
    const response = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, confirmPassword }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess('Password reset successfully!');
      // Redirect to login page
      router.push('/login');
    } else {
      showError(data.message || data.errors?.password);
    }
  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
};
```

### 3. URL Structure
- User reset: `http://localhost:3000/reset-password/:token`
- Employer reset: `http://localhost:3000/employer/reset-password/:token`

## Error Handling

### Common Error Responses

#### Validation Errors
```json
{
  "message": "Validation failed",
  "errors": {
    "password": "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
  },
  "errorType": "validation_error"
}
```

#### Invalid/Expired Token
```json
{
  "message": "Invalid or expired password reset token. Please request a new password reset.",
  "errorType": "invalid_token"
}
```

#### Email Send Failure
```json
{
  "message": "Failed to send password reset email. Please try again later.",
  "errorType": "email_send_error"
}
```

## Testing

### Manual Testing Steps

1. **Request Password Reset:**
   - Send POST request to forgot-password endpoint
   - Check email inbox for reset link
   - Verify token is stored in database (hashed)

2. **Verify Token (Optional):**
   - Extract token from email link
   - Send GET request to verify-reset-token endpoint
   - Check token validity and expiration time

3. **Reset Password:**
   - Use token from email to reset password
   - Verify old password no longer works
   - Verify new password works for login
   - Check token is cleared from database

### Email Testing
Use the test endpoint for development:
```
POST /api/employers/test-email
{
  "email": "test@example.com"
}
```

## Production Deployment Notes

1. **Remove Development Features:**
   - Remove resetToken from response in production
   - Remove test-email endpoints
   - Disable detailed error messages

2. **Email Service:**
   - Ensure Gmail App Password is configured
   - Set up proper email domain/sender reputation
   - Consider using professional email service (SendGrid, etc.)

3. **Rate Limiting:**
   - Implement rate limiting on password reset endpoints
   - Limit password reset requests per IP/email

4. **Monitoring:**
   - Log password reset attempts
   - Monitor email delivery success rates
   - Set up alerts for failed email sends

## Troubleshooting

### Common Issues

1. **Email Not Received:**
   - Check spam folder
   - Verify EMAIL_USER and EMAIL_PASS in .env
   - Test email service connection
   - Check Gmail App Password validity

2. **Invalid Token Error:**
   - Token may have expired (1 hour limit)
   - Token may have been used already
   - Check URL for token corruption

3. **Password Validation Fails:**
   - Ensure password meets all requirements
   - Check for leading/trailing spaces
   - Verify special characters are allowed

## Future Enhancements

1. **Multi-factor Authentication**
2. **SMS-based Password Reset**
3. **Rate Limiting and Abuse Prevention**
4. **Admin Dashboard for Reset Statistics**
5. **Custom Email Templates**
6. **Integration with Professional Email Services**
