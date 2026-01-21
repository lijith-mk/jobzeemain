# Quick Reference Guide - Mentor System

## 🚀 Quick Start

### Mentor Registration & Login Flow

1. **Register:** `/mentor/register` → Basic info + photo
2. **Admin Approves:** Admin dashboard → Approve mentor
3. **Login:** `/mentor/login` → First time redirects to application form
4. **Complete Application:** `/mentor/application` → 3-step form
5. **Access Platform:** `/mentor/dashboard` → Full access

---

## 📍 Routes

### Frontend Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/mentor/register` | MentorRegister | Mentor registration page |
| `/mentor/login` | MentorLogin | Mentor login page |
| `/mentor/application` | MentorApplicationForm | Application form (first login) |
| `/mentor/dashboard` | MentorDashboard | Mentor dashboard (TODO) |

### Backend API Routes

**Mentor Authentication:**
- `POST /api/mentors/register` - Register mentor
- `POST /api/mentors/login` - Login mentor
- `GET /api/mentors/all` - Get all mentors (Admin)
- `PUT /api/mentors/:mentorId/status` - Update status (Admin)

**Mentor Applications:**
- `POST /api/mentor-applications/submit` - Submit application
- `GET /api/mentor-applications/check/:mentorId` - Check status
- `GET /api/mentor-applications/mentor/:mentorId` - Get application
- `PUT /api/mentor-applications/mentor/:mentorId` - Update application
- `GET /api/mentor-applications/all` - Get all (Admin)
- `PUT /api/mentor-applications/review/:applicationId` - Review (Admin)
- `DELETE /api/mentor-applications/:applicationId` - Delete (Admin)

---

## 🗂️ File Locations

### Backend
```
jobzee-backend/
├── models/
│   ├── Mentor.js (existing)
│   └── MentorApplication.js (NEW)
├── controllers/
│   ├── mentorController.js (existing)
│   └── mentorApplicationController.js (NEW)
└── routes/
    ├── mentorRoutes.js (existing)
    └── mentorApplicationRoutes.js (NEW)
```

### Frontend
```
jobzee-frontend/src/
├── components/
│   └── MentorLogin.jsx (NEW)
├── pages/
│   ├── MentorRegister.jsx (existing)
│   └── MentorApplicationForm.jsx (NEW)
└── App.js (modified)
```

---

## 💾 Database Schemas

### Mentor Collection
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  photo: String (URL),
  country: String,
  city: String,
  status: 'pending' | 'approved' | 'rejected'
}
```

### MentorApplication Collection
```javascript
{
  mentorId: ObjectId (unique),
  industry: String,
  currentRole: String,
  company: String,
  yearsOfExperience: Number,
  skills: [String],
  linkedinUrl: String,
  whyMentor: String,
  proofDocument: String (URL),
  status: 'pending' | 'approved' | 'rejected',
  isCompleted: Boolean
}
```

---

## 🎯 Key Features

### Application Form (3 Steps)

**Step 1 - Professional Background:**
- Industry (dropdown)
- Current Role (text)
- Company (text)
- Years of Experience (number)

**Step 2 - Skills & Profile:**
- Skills (tag input)
- LinkedIn URL (validated)

**Step 3 - Motivation & Proof:**
- Why mentor? (50-1000 chars)
- Upload proof (optional, PDF/image, max 5MB)

---

## 🔐 Authentication

### Mentor Login Check
```javascript
// After successful login
const response = await fetch(`/api/mentor-applications/check/${mentorId}`);
const { exists, isCompleted } = await response.json();

if (!exists || !isCompleted) {
  navigate('/mentor/application');
} else {
  navigate('/mentor/dashboard');
}
```

### LocalStorage
```javascript
// Saved on login
localStorage.setItem('mentorToken', token);
localStorage.setItem('mentor', JSON.stringify(mentorData));

// Check authentication
const token = localStorage.getItem('mentorToken');
const mentor = JSON.parse(localStorage.getItem('mentor'));
```

---

## ✅ Validation Rules

### Frontend
- Industry: Required (select from dropdown)
- Current Role: Required
- Company: Required
- Years of Experience: Required, ≥ 0
- Skills: At least 1 skill
- LinkedIn URL: Required, format: `https?://(www\.)?linkedin\.com/.+`
- Why Mentor: Required, 50-1000 characters
- Proof Document: Optional, PDF/PNG/JPG/JPEG, ≤ 5MB

### Backend
- Same as frontend + Mongoose schema validation
- LinkedIn URL regex validated
- Unique constraint on mentorId

---

## 🎨 UI/UX

### Color Theme
- **Primary:** Purple (#9333EA - #A855F7)
- **Secondary:** Pink (#EC4899 - #F472B6)
- **Background:** Gradient from purple-50 to pink-50

### Components
- Animated backgrounds
- Step progress indicator
- Loading spinners
- Toast notifications
- Form validation errors
- File upload with preview

---

## 🔧 Common Tasks

### Add New Industry Option
**File:** `MentorApplicationForm.jsx`
```javascript
<select name="industry">
  <option value="New Industry">New Industry</option>
</select>
```

### Change Character Limits
**File:** `MentorApplication.js` (Backend)
```javascript
whyMentor: {
  minlength: 50,  // Change here
  maxlength: 1000 // Change here
}
```

### Modify File Upload Limit
**File:** `MentorApplicationForm.jsx`
```javascript
if (file.size > 5 * 1024 * 1024) { // 5MB
  toast.error('File size should not exceed 5MB');
}
```

---

## 🐛 Troubleshooting

### Mentor can't login
- Check mentor status in database (`approved`?)
- Verify credentials
- Check console for errors
- Verify backend is running

### Application form not showing
- Check localStorage for mentorToken
- Verify route in App.js
- Check browser console for errors
- Verify mentor is logged in

### File upload fails
- Check file size (< 5MB)
- Verify file type (PDF/PNG/JPG)
- Check Cloudinary configuration
- Verify upload middleware

### Redirect not working
- Check application status API response
- Verify mentorId in localStorage
- Check browser console
- Verify route paths match

---

## 📊 Testing Checklist

### Registration
- [ ] Register with all fields
- [ ] Photo upload works
- [ ] Email validation
- [ ] Duplicate email rejected

### Login
- [ ] Login with valid credentials
- [ ] Wrong password rejected
- [ ] Pending mentor blocked
- [ ] Approved mentor allowed

### Application Form
- [ ] Step 1 validation
- [ ] Step 2 validation
- [ ] Step 3 validation
- [ ] Skills tag add/remove
- [ ] File upload preview
- [ ] Character counter
- [ ] Back button works
- [ ] Submit succeeds
- [ ] Redirect to dashboard

---

## 🚨 Important Notes

1. **Admin Approval Required:** Mentors must be approved before login
2. **First Login Only:** Application form shows only on first login
3. **One Application:** One application per mentor (unique constraint)
4. **File Optional:** Proof document is optional
5. **Dashboard TODO:** Mentor dashboard needs to be created

---

## 📞 Quick Commands

### Start Backend
```bash
cd jobzee-backend
npm start
```

### Start Frontend
```bash
cd jobzee-frontend
npm start
```

### Check MongoDB Collections
```bash
mongo
use jobzee
db.mentors.find()
db.mentorapplications.find()
```

---

## 🔗 Related Docs

- `MENTOR_LOGIN_FEATURE.md` - Login page details
- `MENTOR_APPLICATION_FEATURE.md` - Application system details
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation overview

---

**Version:** 1.0.0  
**Last Updated:** 2024