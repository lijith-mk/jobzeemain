# JobZee Frontend Admin Access Guide

## 🌟 **Frontend is RUNNING!** 

Your React frontend is already running on port 3000.

## 🔐 **How to Login as Admin via Frontend**

### **Step 1: Access the Admin Login Page**
Open your web browser and navigate to:
```
http://localhost:3000/admin/login
```

### **Step 2: Enter Admin Credentials**
Use these credentials to login:
- **User ID**: `admin123`
- **Password**: `admin@123`

*Note: The credentials are also displayed on the login page itself for convenience.*

### **Step 3: Access Admin Dashboard**
After successful login, you'll be redirected to:
```
http://localhost:3000/admin/dashboard
```

## 📊 **Available Admin Features**

### **Dashboard Overview**
- **Statistics Cards**: View total users (14), employers (4), jobs, active jobs, etc.
- **Recent Activity**: See latest user registrations and job postings
- **Real-time Data**: All data is fetched from your backend API

### **User Management** (`Users` Tab)
- View all registered users
- Search users by name or email
- Filter by status (Active/Suspended)
- **Actions Available**:
  - Suspend users (with reason)
  - Activate suspended users
  - View user details and join dates

### **Employer Management** (`Employers` Tab)
- View all registered employers
- Search employers by company name or email
- Filter by approval status
- **Actions Available**:
  - Approve pending employers
  - Reject employers (with reason)
  - View employer company details

### **Job Management** (`Jobs` Tab)
- View all job postings
- Search jobs by title or company
- Filter by status (Active/Pending/Rejected)
- **Actions Available**:
  - Approve/reject job postings
  - Add admin notes to jobs
  - Change job status

### **Analytics** (`Analytics` Tab)
- View system analytics and reports
- User growth trends
- Job posting statistics
- Platform performance metrics

## 🛠 **Admin Panel Features**

### **Beautiful UI/UX**
- Modern, responsive design using Tailwind CSS
- Gradient backgrounds and smooth transitions
- Mobile-friendly interface
- Professional admin dashboard layout

### **Real-time Features**
- Toast notifications for all actions
- Loading states and spinners
- Form validation and error handling
- Automatic token management

### **Security Features**
- JWT token-based authentication
- Automatic logout on token expiry
- Protected admin routes
- Session management

## 🌐 **All Available URLs**

### **Admin URLs**
- **Login**: `http://localhost:3000/admin/login`
- **Dashboard**: `http://localhost:3000/admin/dashboard`

### **User URLs**
- **Home**: `http://localhost:3000/`
- **User Login**: `http://localhost:3000/login`
- **User Register**: `http://localhost:3000/register`
- **User Dashboard**: `http://localhost:3000/dashboard`
- **Job Search**: `http://localhost:3000/jobs`

### **Employer URLs**
- **Employer Login**: `http://localhost:3000/employer/login`
- **Employer Register**: `http://localhost:3000/employer/register`
- **Employer Dashboard**: `http://localhost:3000/employer/dashboard`

## 💡 **Quick Start Instructions**

1. **Open Browser**: Go to `http://localhost:3000/admin/login`
2. **Login**: Use `admin123` / `admin@123`
3. **Explore**: Navigate through the different tabs
4. **Manage**: Use the admin controls to manage users, employers, and jobs

## 🔧 **If Frontend is Not Running**

If you need to start the frontend manually:

```bash
# Navigate to frontend folder
cd jobzee-frontend

# Install dependencies (if needed)
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## 📱 **Current System Status**

✅ **Backend**: Running on port 5000
✅ **Frontend**: Running on port 3000  
✅ **Database**: Connected (MongoDB)
✅ **Admin**: Initialized and working
✅ **API**: All endpoints functional

## 🎯 **What You Can Do Right Now**

1. **View Dashboard**: See system statistics and recent activity
2. **Manage Users**: View the 14 registered users, suspend/activate them
3. **Manage Employers**: View the 4 registered employers, approve/reject them  
4. **Monitor Jobs**: Currently 0 jobs, but you can manage them when employers post jobs
5. **Analytics**: View platform usage and growth metrics

## 🚀 **Pro Tips**

- The admin panel remembers your login with localStorage
- All actions show toast notifications for feedback
- Use the search and filter features for better navigation
- The interface is fully responsive - works on mobile too
- Logout is available in the top right corner

---

**Ready to access?** Just click: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
