# Mentor Personal Info Feature Documentation

## Overview
This document describes the implementation of the Personal Info section in the Mentor Dashboard, allowing mentors to view their profile and application details.

## Changes Made

### 1. MentorDashboard Component Update
**File**: `jobzee-frontend/src/pages/MentorDashboard.jsx`

#### Key Modifications:

##### a. Active Section State Management
- Added state management to toggle between "dashboard" and "profile" sections
- The `activeSection` state controls which view is displayed

##### b. Personal Info Button
Updated the Personal Info button in the sidebar to:
- Handle click events with `onClick={() => setActiveSection("profile")}`
- Show active state styling when profile section is selected
- Apply cyan background when active, similar to dashboard button

```javascript
<button
  onClick={() => setActiveSection("profile")}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
    activeSection === "profile"
      ? "bg-cyan-50 text-cyan-600"
      : "text-gray-600 hover:bg-gray-50"
  }`}
>
  {/* Icon and text */}
</button>
```

##### c. Profile View Section
Added a comprehensive profile view that displays:

**Basic Information:**
- Full Name
- Email Address (read-only, highlighted)
- Phone Number
- Country
- City
- Mentor ID (displayed in monospace font)

**Profile Header:**
- Large profile picture or avatar with initials
- Name and email
- Status badge (Approved/Pending/Rejected) with color coding:
  - Green: Approved Mentor
  - Yellow: Pending Approval
  - Red: Not Approved

**Professional Information (if application exists):**
- Industry
- Current Role
- Company
- Years of Experience
- LinkedIn Profile (clickable link)
- Skills & Expertise (displayed as blue pills/tags)
- Why do you want to be a mentor? (full text display)

**Application Status:**
- Verification status (pending/approved/rejected)
- Submission date
- Rejection reason (if applicable)

**Account Information:**
- Account creation date
- Account status (Active/Inactive) with badge
- Last updated date

##### d. Navigation
- "Back to Dashboard" button in profile view to return to main dashboard
- Smooth transition between sections using ternary operator

## UI/UX Features

### Visual Design
1. **Consistent Styling**: Matches the existing Jobzee design system
2. **Color Scheme**: 
   - Blue gradient for profile pictures
   - Cyan for active states
   - Status-based colors (green, yellow, red)
3. **Layout**: Clean, card-based layout with proper spacing

### Responsive Elements
- Grid layout for information fields (2 columns)
- Proper spacing and padding
- Hover effects on clickable elements

### Status Indicators
- Visual badges for mentor approval status
- Color-coded account status
- Clear labeling of all fields

## Data Flow

1. **Data Source**: 
   - Mentor data from `localStorage.getItem("mentor")`
   - Application data fetched on component mount via `fetchApplicationData()`

2. **API Endpoints Used**:
   - `GET /api/mentor-applications/mentor/:mentorId` - Fetch application data
   - Requires Bearer token authentication

3. **State Management**:
   - `mentor`: Stores mentor basic information
   - `application`: Stores mentor application details
   - `activeSection`: Controls view switching

## User Experience Flow

1. Mentor logs into dashboard
2. Sees "Personal Info" option in Account Settings sidebar
3. Clicks "Personal Info" button
4. View switches to profile page showing:
   - All personal details
   - Professional information
   - Application status
   - Account information
5. Can click "Back to Dashboard" to return

## Features Implemented

### ✅ Completed
- [x] Profile picture/avatar display
- [x] Basic information display
- [x] Professional information from application
- [x] Skills display as tags
- [x] Application status tracking
- [x] Account information display
- [x] Responsive layout
- [x] Status badges with color coding
- [x] Navigation between dashboard and profile
- [x] LinkedIn profile link (opens in new tab)
- [x] Proper date formatting
- [x] Conditional rendering based on data availability

### 📝 Future Enhancements (Not Yet Implemented)
- [ ] Edit profile functionality
- [ ] Profile picture upload
- [ ] Password change
- [ ] Email notifications preferences
- [ ] Export profile data
- [ ] Profile completion percentage
- [ ] Activity log/history

## Technical Notes

### Dependencies
- React hooks (useState, useEffect)
- react-router-dom for navigation
- react-toastify for notifications
- Tailwind CSS for styling

### Conditional Rendering
The component uses conditional rendering to:
- Show/hide sections based on data availability
- Display appropriate messages for missing data ("N/A")
- Handle loading states
- Show different status badges based on mentor status

### Data Validation
- Checks for mentor authentication before displaying
- Handles missing or null data gracefully
- Displays "N/A" for unavailable information
- Shows "Pending" for unassigned Mentor IDs

## Testing Checklist

- [ ] Verify Personal Info button is visible in sidebar
- [ ] Confirm active state styling on button click
- [ ] Check profile page displays all sections correctly
- [ ] Verify data loads from localStorage and API
- [ ] Test "Back to Dashboard" navigation
- [ ] Confirm status badges show correct colors
- [ ] Verify dates are formatted correctly
- [ ] Test with missing data (shows "N/A")
- [ ] Verify LinkedIn link opens in new tab
- [ ] Check responsive layout on different screen sizes
- [ ] Test with approved, pending, and rejected mentor statuses

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on desktop and tablet

## Security Considerations
- Email is displayed but marked as non-editable
- Mentor ID is shown in read-only format
- Authentication token required for API calls
- No sensitive data in URLs or client-side storage beyond localStorage

## Performance
- Data fetched once on component mount
- Efficient state management
- No unnecessary re-renders
- Lazy loading of application data

## Maintenance Notes

### Code Location
- Main component: `jobzee-frontend/src/pages/MentorDashboard.jsx`
- Lines 264-687 contain the profile view implementation

### Styling Conventions
- Uses Tailwind CSS utility classes
- Follows existing Jobzee design patterns
- Maintains consistent spacing (p-8, mb-6, gap-6, etc.)

### Data Structure
```javascript
// Mentor object structure
{
  _id: String,
  name: String,
  email: String,
  phone: String,
  country: String,
  city: String,
  photo: String (URL),
  mentorId: String,
  status: "approved" | "pending" | "rejected",
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Application object structure
{
  _id: String,
  mentorId: ObjectId,
  industry: String,
  currentRole: String,
  company: String,
  yearsOfExperience: Number,
  skills: Array<String>,
  linkedinUrl: String,
  whyMentor: String,
  verificationStatus: "pending" | "approved" | "rejected",
  submittedAt: Date,
  rejectionReason: String
}
```

## Summary

The Personal Info feature provides mentors with a comprehensive view of their profile information, application status, and account details. The implementation follows best practices for React development and maintains consistency with the existing Jobzee platform design and user experience.

The feature is fully functional and ready for use, with a clear path for future enhancements such as editing capabilities and additional profile management features.