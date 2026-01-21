# 🔄 New Separated Auth & Profile Models

This document explains the new database structure that separates authentication data from user/employer profile details.

## 📋 Overview

The old structure mixed authentication credentials with profile data in single collections:
- `users` - Mixed auth + profile data
- `employers` - Mixed auth + profile data

The **new structure** separates concerns into:
- `auths` - Authentication data only (email, password, OAuth, security)
- `userprofiles` - User profile details
- `employerprofiles` - Employer profile details

## 🗄️ New Database Structure

### Auth Collection (`auths`)
**Purpose**: Store authentication credentials and security data
```javascript
{
  _id: ObjectId,
  email: "user@example.com",
  password: "hashed_password",
  role: "user|employer|admin",
  googleId: "google_oauth_id",
  authProvider: "local|google",
  isActive: true,
  isEmailVerified: false,
  resetPasswordToken: "token",
  resetPasswordExpires: Date,
  lastLoginAt: Date,
  loginAttempts: 0,
  lockUntil: Date,
  profileId: ObjectId, // Reference to profile
  profileModel: "UserProfile|EmployerProfile",
  createdAt: Date,
  updatedAt: Date
}
```

### UserProfile Collection (`userprofiles`)
**Purpose**: Store user profile and job-seeking details
```javascript
{
  _id: ObjectId,
  authId: ObjectId, // Reference to auth record
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  dateOfBirth: Date,
  profilePhoto: "cloudinary_url",
  title: "Software Engineer",
  bio: "Passionate developer...",
  skills: ["JavaScript", "React", "Node.js"],
  education: { degree, field, institution },
  resume: "cloudinary_url",
  location: { city, state, country },
  preferences: { jobTypes, salaryRange, workArrangement },
  // ... many more fields
  createdAt: Date,
  updatedAt: Date
}
```

### EmployerProfile Collection (`employerprofiles`)
**Purpose**: Store company and employer profile details
```javascript
{
  _id: ObjectId,
  authId: ObjectId, // Reference to auth record
  companyName: "Tech Corp",
  contactPersonName: "Jane Smith",
  companyDescription: "Leading tech company...",
  industry: "Technology",
  companySize: "51-200",
  headquarters: { address, city, state, country },
  website: "https://techcorp.com",
  companyLogo: "cloudinary_url",
  subscriptionPlan: "premium",
  analytics: { profileViews, totalJobPosts },
  // ... many more fields
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Benefits of New Structure

### 1. **Better Security**
- Authentication data is isolated
- Profile data can be accessed without exposing credentials
- Different security policies for auth vs profile data

### 2. **Improved Performance**
- Smaller auth queries for login/authentication
- Profile data loaded only when needed
- Better indexing strategies

### 3. **Cleaner Architecture**
- Clear separation of concerns
- Easier to maintain and extend
- Better API design

### 4. **Enhanced Features**
- Account locking/security features
- Email verification workflows
- Role-based access control
- Profile completion tracking

## 🛠️ How to Use

### Using the Utility Class (Recommended)
```javascript
const AuthProfileUtils = require('../utils/authProfileUtils');

// Get complete user data
const user = await AuthProfileUtils.getUserByEmail('user@example.com');
console.log(user.auth); // Auth data
console.log(user.profile); // Profile data

// Create new user
const newUser = await AuthProfileUtils.createUser({
  email: 'new@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890'
});

// Verify password
const validUser = await AuthProfileUtils.verifyPassword('user@example.com', 'password');
```

### Direct Model Usage
```javascript
const Auth = require('../models/Auth');
const UserProfile = require('../models/UserDetails');

// Find auth record
const auth = await Auth.findOne({ email: 'user@example.com' });

// Find profile
const profile = await UserProfile.findOne({ authId: auth._id });
```

## 📦 Migration Process

### Step 1: Run Migration Script
```bash
node scripts/migrate-to-separated-models.js
```

### Step 2: Update Your Routes
Replace direct model usage with utility functions:

**Before:**
```javascript
const user = await User.findOne({ email });
```

**After:**
```javascript
const user = await AuthProfileUtils.getUserByEmail(email);
```

### Step 3: Update Authentication Logic
**Before:**
```javascript
const user = await User.findOne({ email });
const isValid = await bcrypt.compare(password, user.password);
```

**After:**
```javascript
const user = await AuthProfileUtils.verifyPassword(email, password);
```

## 🔄 Backward Compatibility

The utility functions return data in a format that's mostly compatible with the old structure:

```javascript
const user = await AuthProfileUtils.getUserByEmail('user@example.com');
// user.email, user.role, user.name still work
// user.auth contains auth-specific data
// user.profile contains profile-specific data
```

## 📊 New Features Available

### 1. **Account Security**
```javascript
// Check if account is locked
const auth = await Auth.findOne({ email });
if (auth.isLocked) {
  // Handle locked account
}
```

### 2. **Profile Completion**
```javascript
const completion = await AuthProfileUtils.getProfileCompletion(userId);
console.log(`Profile is ${completion}% complete`);
```

### 3. **Advanced Search**
```javascript
const users = await AuthProfileUtils.searchUsers({
  role: 'user',
  isActive: true
}, {
  limit: 10,
  skip: 0,
  sort: { createdAt: -1 }
});
```

## 🚨 Important Notes

### Migration Checklist
- [ ] Run migration script
- [ ] Test authentication flows
- [ ] Update API routes
- [ ] Test profile operations
- [ ] Verify data integrity
- [ ] Update frontend if needed

### Post-Migration
- The old `User` and `Employer` models can be kept for reference
- Once confident, old collections can be dropped
- Consider backing up old data before deletion

## 🆘 Troubleshooting

### Common Issues
1. **"Cannot find profile"** - Ensure migration completed successfully
2. **Authentication fails** - Check if Auth collection has correct data
3. **Missing fields** - Update code to use `user.profile.fieldName`

### Getting Help
- Check migration logs for any errors
- Verify database connections
- Test with a small dataset first

## 📝 Example Usage in Routes

```javascript
// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await AuthProfileUtils.verifyPassword(email, password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Generate JWT with auth._id
  const token = jwt.sign({ userId: user.auth._id }, process.env.JWT_SECRET);
  
  res.json({
    success: true,
    token,
    user: {
      id: user.auth._id,
      email: user.auth.email,
      role: user.auth.role,
      profile: user.profile
    }
  });
});

// Profile update route
app.put('/api/profile', async (req, res) => {
  const userId = req.user.id; // From JWT middleware
  const updateData = req.body;
  
  const updated = await AuthProfileUtils.updateUserProfile(userId, updateData);
  res.json({ success: true, profile: updated.profile });
});
```

This new structure provides a solid foundation for scaling your authentication and user management system! 🚀
