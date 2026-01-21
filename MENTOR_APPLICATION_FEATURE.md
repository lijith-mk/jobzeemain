# Mentor Application Feature Documentation

## Overview
After admin approval, mentors must complete a detailed application form on their first login. This ensures all mentors provide comprehensive professional information before accessing the platform.

## Feature Flow

### 1. Mentor Registration
- Mentor registers at `/mentor/register`
- Provides: name, email, phone, password, country, city, photo
- Status set to `pending` in database
- Awaits admin approval

### 2. Admin Approval
- Admin reviews mentor in admin dashboard
- Approves or rejects mentor account
- Only approved mentors can login

### 3. First Login - Application Form
- Approved mentor logs in at `/mentor/login`
- System checks if mentor has completed application
- If no application exists → Redirects to `/mentor/application`
- If application completed → Redirects to `/mentor/dashboard`

### 4. Application Completion
- Mentor fills out comprehensive 3-step application form
- Data saved to `MentorApplication` collection
- Application submitted for review
- Mentor gains full platform access

---

## Database Collections

### 1. Mentor Collection
Located: `jobzee-backend/models/Mentor.js`

**Schema:**
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (required, hashed),
  photo: String (URL),
  country: String,
  city: String,
  role: String (default: 'mentor'),
  status: Enum ['pending', 'approved', 'rejected'] (default: 'pending'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. MentorApplication Collection (NEW)
Located: `jobzee-backend/models/MentorApplication.js`

**Schema:**
```javascript
{
  mentorId: ObjectId (ref: 'Mentor', required, unique),
  industry: String (required),
  currentRole: String (required),
  company: String (required),
  yearsOfExperience: Number (required, min: 0),
  skills: [String] (required),
  linkedinUrl: String (required, validated),
  whyMentor: String (required, 50-1000 chars),
  proofDocument: String (URL, optional),
  status: Enum ['pending', 'approved', 'rejected'] (default: 'pending'),
  isCompleted: Boolean (default: false),
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: 'Admin'),
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Backend Implementation

### Files Created

#### 1. Model
- **Path:** `jobzee-backend/models/MentorApplication.js`
- **Purpose:** Define mentor application schema
- **Key Features:**
  - Unique constraint on mentorId
  - LinkedIn URL validation
  - Character limits on whyMentor field
  - Status tracking
  - Method: `submit()` to mark as completed

#### 2. Controller
- **Path:** `jobzee-backend/controllers/mentorApplicationController.js`
- **Exports:**
  - `submitApplication` - Submit new application
  - `getApplicationByMentorId` - Get application for specific mentor
  - `checkApplicationStatus` - Check if mentor has completed application
  - `updateApplication` - Update draft application
  - `getAllApplications` - Admin: Get all applications
  - `reviewApplication` - Admin: Approve/reject application
  - `deleteApplication` - Admin: Delete application

#### 3. Routes
- **Path:** `jobzee-backend/routes/mentorApplicationRoutes.js`
- **Endpoints:**

**Mentor Routes:**
- `POST /api/mentor-applications/submit` - Submit application
- `GET /api/mentor-applications/mentor/:mentorId` - Get application
- `GET /api/mentor-applications/check/:mentorId` - Check status
- `PUT /api/mentor-applications/mentor/:mentorId` - Update application

**Admin Routes (protected):**
- `GET /api/mentor-applications/all` - Get all applications
- `PUT /api/mentor-applications/review/:applicationId` - Review application
- `DELETE /api/mentor-applications/:applicationId` - Delete application

#### 4. Server Integration
- **Path:** `jobzee-backend/index.js`
- **Changes:** Added route mounting
```javascript
const mentorApplicationRoutes = require('./routes/mentorApplicationRoutes');
app.use('/api/mentor-applications', mentorApplicationRoutes);
```

---

## Frontend Implementation

### Files Created

#### 1. Application Form Component
- **Path:** `jobzee-frontend/src/pages/MentorApplicationForm.jsx`
- **Features:**
  - 3-step wizard form
  - Step 1: Professional Background (Industry, Role, Company, Experience)
  - Step 2: Skills & Profile (Skills tags, LinkedIn URL)
  - Step 3: Motivation & Proof (Why mentor, Upload proof)
  - Real-time validation
  - Progress indicator
  - File upload (PDF/images, max 5MB)
  - Responsive design

#### 2. Updated Login Logic
- **Path:** `jobzee-frontend/src/components/MentorLogin.jsx`
- **Changes:**
  - After successful login, check application status
  - Call API: `/api/mentor-applications/check/:mentorId`
  - Redirect based on result:
    - No application → `/mentor/application`
    - Application exists → `/mentor/dashboard`

#### 3. App Router
- **Path:** `jobzee-frontend/src/App.js`
- **Changes:** Added route
```javascript
<Route path="/mentor/application" element={<MentorApplicationForm />} />
```

---

## Application Form Details

### Step 1: Professional Background
**Fields:**
- **Industry** (Select dropdown)
  - Options: Technology, Finance, Healthcare, Education, Marketing, Sales, Engineering, Design, HR, Legal, Consulting, Other
- **Current Role** (Text input)
  - Example: "Senior Software Engineer"
- **Company** (Text input)
  - Example: "Google"
- **Years of Experience** (Number input)
  - Minimum: 0

### Step 2: Skills & Profile
**Fields:**
- **Skills** (Tag input)
  - Press Enter to add each skill
  - Displayed as removable tags
  - Must add at least 1 skill
- **LinkedIn URL** (Text input)
  - Must be valid LinkedIn URL format
  - Example: "https://www.linkedin.com/in/yourprofile"

### Step 3: Motivation & Proof
**Fields:**
- **Why do you want to mentor?** (Textarea)
  - Minimum: 50 characters
  - Maximum: 1000 characters
  - Character counter displayed
- **Upload Proof** (File upload - OPTIONAL)
  - Accepts: PDF, PNG, JPG, JPEG
  - Maximum size: 5MB
  - Preview for images
  - Icon display for PDFs

---

## Validation Rules

### Frontend Validation
- All required fields must be filled
- Years of experience must be positive number
- At least one skill must be added
- LinkedIn URL must match pattern: `^https?://(www\.)?linkedin\.com/.+`
- Why mentor text: 50-1000 characters
- File upload: PDF or image only, max 5MB

### Backend Validation
- MongoDB schema validation
- LinkedIn URL validated with regex
- Skills array must have at least one element
- Years of experience minimum 0
- Why mentor text length validated

---

## User Experience

### Design Features
- **3-Step Progress Indicator:** Visual steps with checkmarks
- **Gradient Theme:** Purple to pink gradient matching mentor branding
- **Step Navigation:** Back/Next buttons with validation
- **Responsive Layout:** Mobile-first design
- **Loading States:** Spinner during submission
- **Error Handling:** Field-level error messages
- **Success Feedback:** Toast notification on submission

### Step Transitions
- Cannot proceed to next step without completing current step validation
- Can go back to previous steps to edit
- Final step shows submit button instead of next
- Auto-redirect to dashboard after successful submission

---

## API Integration

### Check Application Status
```javascript
GET /api/mentor-applications/check/:mentorId
Response: {
  exists: boolean,
  isCompleted: boolean,
  status: 'pending' | 'approved' | 'rejected' | null
}
```

### Submit Application
```javascript
POST /api/mentor-applications/submit
Content-Type: multipart/form-data

Body: {
  mentorId: ObjectId,
  industry: string,
  currentRole: string,
  company: string,
  yearsOfExperience: number,
  skills: string (comma-separated),
  linkedinUrl: string,
  whyMentor: string,
  file?: File (optional)
}

Response: {
  message: string,
  application: {
    _id: ObjectId,
    mentorId: ObjectId,
    status: string,
    isCompleted: boolean,
    submittedAt: Date
  }
}
```

---

## Security Considerations

1. **Authentication Required:** Mentor must be logged in
2. **Token Validation:** MentorToken checked in localStorage
3. **One Application Per Mentor:** Unique constraint on mentorId
4. **File Upload Validation:** Type and size restrictions
5. **Admin-Only Routes:** Protected with adminAuth middleware
6. **Input Sanitization:** All inputs validated and sanitized
7. **HTTPS Required:** File uploads should use secure connection

---

## Testing Checklist

### Registration Flow
- [ ] Mentor can register successfully
- [ ] Admin can approve mentor
- [ ] Admin can reject mentor
- [ ] Approved mentor can login
- [ ] Rejected mentor cannot login

### Application Flow
- [ ] First-time login redirects to application form
- [ ] Form validates all required fields
- [ ] Cannot proceed without completing each step
- [ ] Skills tags can be added and removed
- [ ] LinkedIn URL validation works
- [ ] Character counter updates in real-time
- [ ] File upload validates type and size
- [ ] Image preview displays correctly
- [ ] PDF upload shows icon
- [ ] Back button navigates correctly
- [ ] Next button validates before proceeding
- [ ] Submit button only shows on final step
- [ ] Application submits successfully
- [ ] Redirects to dashboard after submission
- [ ] Second login goes directly to dashboard

### Error Handling
- [ ] Network errors show toast notification
- [ ] Field errors display inline
- [ ] Duplicate submission prevented
- [ ] File size limit enforced
- [ ] File type validation works
- [ ] Invalid LinkedIn URL rejected

---

## Admin Dashboard Integration (TODO)

Future enhancements needed:
1. View all mentor applications in admin dashboard
2. Filter by status (pending/approved/rejected)
3. View application details
4. Approve/reject applications
5. Add rejection reason
6. Send notification to mentor on status change

---

## Future Enhancements

1. **Save Draft:** Allow mentors to save incomplete applications
2. **Edit Application:** Allow editing after submission (before review)
3. **Email Notifications:** Notify mentor when application is reviewed
4. **Rich Text Editor:** Better formatting for "Why mentor" field
5. **Skill Suggestions:** Auto-suggest popular skills
6. **Industry Auto-complete:** Search industries instead of dropdown
7. **Multiple Documents:** Allow uploading multiple proof documents
8. **Video Introduction:** Optional video upload for mentor introduction
9. **Application Analytics:** Track completion rates and time spent

---

## File Structure

```
jobzee-backend/
├── models/
│   └── MentorApplication.js (NEW)
├── controllers/
│   └── mentorApplicationController.js (NEW)
├── routes/
│   └── mentorApplicationRoutes.js (NEW)
└── index.js (MODIFIED)

jobzee-frontend/
├── src/
│   ├── components/
│   │   └── MentorLogin.jsx (MODIFIED)
│   ├── pages/
│   │   └── MentorApplicationForm.jsx (NEW)
│   └── App.js (MODIFIED)
```

---

## Environment Variables

No new environment variables required. Uses existing:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- Cloudinary credentials (for file upload)

---

## Dependencies

### Backend
- `mongoose` - MongoDB ODM
- `express` - Web framework
- `multer` - File upload middleware (via existing upload middleware)
- `cloudinary` - File storage (via existing utility)

### Frontend
- `react` - UI library
- `react-router-dom` - Routing
- `react-toastify` - Notifications

All dependencies already exist in the project.

---

## Status

✅ **COMPLETED**
- Backend models, controllers, and routes
- Frontend application form component
- Login redirect logic
- Form validation
- File upload functionality
- API integration
- Routing setup

⏳ **PENDING**
- Admin dashboard integration for reviewing applications
- Mentor dashboard (redirect target)
- Email notifications
- Forgot password for mentors

---

## Related Documentation

- [MENTOR_LOGIN_FEATURE.md](./MENTOR_LOGIN_FEATURE.md) - Mentor login page
- Backend API routes documentation
- Admin dashboard documentation (when implemented)

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Author:** Development Team