# Jobzee Admin Login Guide

## ✅ Admin Login Confirmed Working

The admin login system has been tested and is fully functional.

## 🔐 Default Admin Credentials

- **User ID**: `admin123`
- **Password**: `admin@123`
- **Email**: `admin@jobzee.com`
- **Role**: `super_admin`

## 🚀 How to Login

### 1. API Endpoint
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json
```

### 2. Request Body
```json
{
  "userId": "admin123",
  "password": "admin@123"
}
```

### 3. Expected Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "admin_id",
    "userId": "admin123",
    "name": "System Administrator",
    "email": "admin@jobzee.com",
    "role": "super_admin",
    "permissions": {
      "userManagement": true,
      "employerManagement": true,
      "jobManagement": true,
      "analytics": true,
      "systemSettings": true
    }
  }
}
```

## 🎯 Using Admin Token

Include the token in subsequent requests:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## 📊 Available Admin Endpoints

- `GET /api/admin/dashboard` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/employers` - Employer management  
- `GET /api/admin/jobs` - Job management
- `GET /api/admin/analytics` - Analytics data

## 🔧 Quick Test

Run the test script to verify everything works:
```bash
powershell -ExecutionPolicy Bypass -File .\test-admin-login.ps1
```

## 📈 Current System Status

- **Total Users**: 14
- **Total Employers**: 4  
- **Total Jobs**: 0
- **Server**: Running on port 5000
- **Database**: Connected
- **Admin**: Initialized and working

## 🛠️ Troubleshooting

If admin login fails:

1. **Check server status**: Make sure the Node.js server is running
2. **Initialize admin**: Run `node jobzee-backend/scripts/initAdmin.js`  
3. **Check database**: Verify MongoDB connection
4. **Verify credentials**: Use exact credentials above

## ⏰ Token Expiration

Admin tokens expire after **24 hours**. You'll need to login again after that.

## 🔒 Security Notes

- Change default password in production
- Admin account has full system access
- All admin actions are logged with timestamps
- Token contains admin ID and role information

---

**Last Tested**: January 8, 2025
**Status**: ✅ Fully Functional
