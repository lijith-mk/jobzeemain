# 🚀 JobZee Mobile App - Quick Start Guide

## ✅ What's Already Set Up

Your mobile app is **ready to go**! Here's what has been configured:

### ✨ Features Implemented
- ✅ User & Employer Authentication (Login/Register)
- ✅ Dynamic Tab Navigation (changes based on user type)
- ✅ Job Listings (Browse, Search, Filter)
- ✅ Course Browser (with enrollment tracking)
- ✅ Application Tracking (View your job applications)
- ✅ Job Posting (For employers)
- ✅ Job Management (For employers)
- ✅ Profile Screen
- ✅ API Integration with your hosted backend

### 🔗 Backend Connected
```
API URL: https://jobzee-gec9.onrender.com/api
```

## 🏁 How to Run

### Step 1: Install Picker Package
```bash
cd jobzeeMobile
npm install @react-native-picker/picker
```

### Step 2: Start the App
```bash
npm start
```

### Step 3: Open on Your Device
- Install **Expo Go** app on your phone (iOS/Android)
- Scan the QR code shown in terminal
- Or press `a` for Android emulator / `i` for iOS simulator

## 📱 Test the App

### For Job Seekers:
1. Register as a **Job Seeker**
2. Browse jobs in the **Jobs** tab
3. Explore courses in the **Learn** tab
4. View applications in **My Jobs** tab
5. Manage profile in **Profile** tab

### For Employers:
1. Register as an **Employer**
2. Post jobs in the **Post Job** tab
3. Manage jobs in **My Jobs** tab
4. View profile in **Profile** tab

## 🎯 Key User Flows

### Registration & Login
- Toggle between "Job Seeker" and "Employer"
- Enter credentials
- Auto-login after registration
- Secure token storage

### Browse Jobs (Users)
- Real-time job listings from backend
- Search by title, company, location
- Filter by location type (Remote/Hybrid/On-site)
- View salary ranges, skills, requirements

### Post a Job (Employers)
- Complete job posting form
- Select employment type, experience level
- Add requirements and responsibilities
- Set salary range
- Publish instantly

### Manage Jobs (Employers)
- View all your job postings
- See application counts
- Edit or Delete jobs
- Track posting dates

## 🔧 Configuration

### Change Backend URL
Edit `jobzeeMobile/constants/config.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: 'YOUR_API_URL_HERE',
  // ...
};
```

### Customize App Name
Edit `jobzeeMobile/app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

## 📂 Project Structure

```
jobzeeMobile/
├── app/
│   ├── (tabs)/              # Tab screens
│   │   ├── index.tsx        # Home (Dashboard)
│   │   ├── jobs.jsx         # Browse Jobs (Users)
│   │   ├── courses.jsx      # Learning Hub (Users)
│   │   ├── applications.jsx # My Applications (Users)
│   │   ├── post-job.jsx     # Post Job (Employers)
│   │   ├── my-jobs.jsx      # Manage Jobs (Employers)
│   │   └── profile.jsx      # User Profile
│   ├── auth/                # Auth screens
│   │   ├── login.jsx
│   │   └── register.jsx
│   └── _layout.jsx          # Root layout (auth protection)
├── context/
│   └── AuthContext.jsx      # Auth state management
├── constants/
│   └── config.js            # API endpoints
├── utils/
│   └── api.js               # Axios client
└── README.md
```

## 🎨 App Navigation

### For Users (Job Seekers):
Home → Jobs → Learn → My Jobs → Profile

### For Employers:
Home → Post Job → My Jobs → Profile

## 🔐 How Authentication Works

1. **Login/Register**: User credentials → Backend API
2. **Token Storage**: JWT token saved in AsyncStorage
3. **Auto-Authentication**: Token atched to all API requests
4. **Protected Routes**: Login required for main app
5. **Auto-Logout**: On 401 errors or logout action

## 📊 API Integration

All screens connect to your hosted backend:
- ✅ User/Employer registration & login
- ✅ Fetch jobs (`GET /jobs`)
- ✅ Fetch courses (`GET /learning/courses`)
- ✅ Fetch applications (`GET /applications/my-applications`)
- ✅ Create job (`POST /jobs`)
- ✅ Delete job (`DELETE /jobs/:id`)

## 🎯 What Works Right Now

### ✅ Fully Functional
- Login/Register for both Users & Employers
- Browse all jobs from backend
- View all courses
- View your applications
- Post new jobs (employers)
- View and delete your jobs (employers)
- Profile display
- Logout

### 🚧 To Be Added (Optional Enhancements)
- Job application submission
- Course enrollment
- Certificate viewing
- Profile editing
- Image uploads
- Push notifications
- Dark mode

## 🐛 Troubleshooting

### Metro bundler cache issues
```bash
cd jobzeeMobile
npx expo start --clear
```

### Package installation issues
```bash
cd jobzeeMobile
rm -rf node_modules
npm install
```

### Can't connect to backend
- Check if backend is running
- Verify API URL in `constants/config.js`
- Check network connection

### Expo Go app not connecting
- Make sure phone and computer are on the same WiFi
- Try using tunnel mode: `npx expo start --tunnel`

## 📱 Build for Production

### Android APK
```bash
cd jobzeeMobile
npx expo build:android
```

### iOS App (Mac only)
```bash
cd jobzeeMobile
npx expo build:ios
```

## 🎉 You're All Set!

Your JobZee mobile app is ready to use. It connects to your existing backend and provides a native mobile experience for both job seekers and employers.

**Next Steps:**
1. Install the picker package
2. Run `npm start`
3. Open in Expo Go
4. Test login/registration
5. Browse jobs and courses!

---

## 💡 Quick Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Clear cache and restart
npx expo start --clear

# Install all dependencies
npm install
```

**Happy Coding! 🚀**
