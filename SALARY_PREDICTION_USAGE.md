# Salary Prediction UI Components - Usage Guide

## Overview
Three new React components have been created to display AI-powered salary predictions throughout the application.

## Components Created

### 1. **SalaryPrediction** - User Profile Component
**File:** `jobzee-frontend/src/components/SalaryPrediction.jsx`

**Purpose:** Displays salary prediction for logged-in users based on their profile.

**Usage:**
```jsx
import SalaryPrediction from './components/SalaryPrediction';

// In UserProfile.jsx or Profile.jsx
<SalaryPrediction />
```

**Features:**
- Shows predicted annual salary with confidence level
- Displays salary range (min/max)
- Market insights showing how user compares to market
- Collapsible details section
- Auto-loads on component mount

**Where to Add:**
- User Profile page (UserProfile.jsx)
- User Dashboard
- Career page/section

---

### 2. **SalaryRecommendation** - Job Posting Form Component
**File:** `jobzee-frontend/src/components/SalaryRecommendation.jsx`

**Purpose:** Provides AI-recommended salary range when employers create/edit job postings.

**Usage:**
```jsx
import SalaryRecommendation from './components/SalaryRecommendation';

// In EmployerPostJob.jsx
const [jobFormData, setJobFormData] = useState({
  title: '',
  skills: [],
  location: '',
  experienceRequired: '',
  education: '',
  category: ''
});

const handleSalarySelect = (salaryData) => {
  // Update your form with recommended salary
  setJobFormData({
    ...jobFormData,
    salaryMin: salaryData.min,
    salaryMax: salaryData.max
  });
};

<SalaryRecommendation 
  jobData={jobFormData} 
  onSalarySelect={handleSalarySelect}
/>
```

**Features:**
- "Get Recommendation" button to fetch AI prediction
- Shows recommended salary with market comparison
- Salary breakdown by factors
- "Use This Range" button to auto-fill form
- Market average and top 25% comparison

**Where to Add:**
- Job posting form (EmployerPostJob.jsx)
- Job editing form
- Internship posting form (adapt as needed)

---

### 3. **SalaryInsights** - Employer Dashboard Component
**File:** `jobzee-frontend/src/components/SalaryInsights.jsx`

**Purpose:** Shows salary analysis for existing job postings in employer dashboard.

**Usage:**
```jsx
import SalaryInsights from './components/SalaryInsights';

// In EmployerProfile.jsx or job listing card
<SalaryInsights 
  jobId={job._id}
  jobTitle={job.title}
  currentSalary={{
    min: job.salaryMin,
    max: job.salaryMax
  }}
/>
```

**Features:**
- Competitiveness badge (Competitive/Above Market/Below Market)
- Comparison of current vs recommended salary
- Market benchmarks (average, percentile)
- Actionable recommendations
- Auto-loads on component mount

**Where to Add:**
- Employer Dashboard - job cards
- Job details modal/page
- Posted jobs list in EmployerProfile.jsx

---

## API Service

**File:** `jobzee-frontend/src/services/salaryPredictionService.js`

Contains three main functions:
1. `getMyProfileSalaryPrediction()` - For users
2. `getSalaryForNewJob(jobData)` - For new job postings
3. `getSalaryForExistingJob(jobId)` - For existing jobs
4. `formatSalary(amount)` - Helper to format currency

---

## Integration Steps

### Step 1: Add to User Profile
Edit `jobzee-frontend/src/components/UserProfile.jsx`:

```jsx
import SalaryPrediction from './SalaryPrediction';

// Add inside the profile page, perhaps after the bio section or in a sidebar
<SalaryPrediction />
```

### Step 2: Add to Job Posting Form
Edit `jobzee-frontend/src/components/EmployerPostJob.jsx`:

```jsx
import SalaryRecommendation from './SalaryRecommendation';

// Add state handler
const handleSalarySelect = (salaryData) => {
  setJobData({
    ...jobData,
    salaryMin: salaryData.min,
    salaryMax: salaryData.max
  });
  toast.success('Salary range applied!');
};

// Add component in the form, preferably near salary input fields
<div className="mb-6">
  <SalaryRecommendation 
    jobData={{
      title: jobData.title,
      skills: jobData.skills,
      location: jobData.location,
      experienceRequired: jobData.experienceRequired,
      education: jobData.education,
      category: jobData.category
    }}
    onSalarySelect={handleSalarySelect}
  />
</div>
```

### Step 3: Add to Employer Dashboard
Edit `jobzee-frontend/src/components/EmployerProfile.jsx`:

Find where jobs are displayed (likely in a map/loop) and add:

```jsx
import SalaryInsights from './SalaryInsights';

// Inside job card or expandable section
{selectedJob && (
  <SalaryInsights 
    jobId={selectedJob._id}
    jobTitle={selectedJob.title}
    currentSalary={{
      min: selectedJob.salaryMin,
      max: selectedJob.salaryMax
    }}
  />
)}
```

---

## Testing Checklist

### User Profile (SalaryPrediction)
- [ ] Component loads without errors
- [ ] Shows loading spinner initially
- [ ] Displays predicted salary after loading
- [ ] Shows confidence badge (High/Medium/Low)
- [ ] Market insights display correctly
- [ ] "Show Details" toggle works
- [ ] Handles errors gracefully with retry button

### Job Posting (SalaryRecommendation)
- [ ] "Get Recommendation" button appears
- [ ] Shows loading state when fetching
- [ ] Displays recommended salary after fetch
- [ ] Market comparison data shows correctly
- [ ] "Use This Range" button populates form fields
- [ ] "Refresh" button works
- [ ] Handles missing job data with error message

### Employer Dashboard (SalaryInsights)
- [ ] Auto-loads on component mount
- [ ] Shows competitiveness badge
- [ ] Current vs recommended comparison displays
- [ ] Market benchmarks show correctly
- [ ] Recommendations list appears (if applicable)
- [ ] "Refresh Analysis" button works
- [ ] Handles errors gracefully

---

## Styling Notes

All components use Tailwind CSS and match the existing design system:
- Gradient backgrounds (blue/indigo for user, purple/pink for employer)
- Rounded corners with shadows
- Responsive layouts
- Icon integration with react-icons/fa
- Consistent color scheme (blue for info, green for positive, orange/red for warnings)

---

## API Endpoints Required

Ensure these backend endpoints are deployed and working:
1. `GET /api/predictions/salary/my-profile` (requires user token)
2. `POST /api/predictions/salary/for-job` (requires employer token)
3. `GET /api/predictions/salary/for-job/:jobId` (requires employer token)

---

## Next Steps

1. **Integrate components** into existing pages as described above
2. **Test with real data** once backend is deployed
3. **Adjust styling** if needed to match your exact design
4. **Add loading states** in parent components if necessary
5. **Consider mobile responsiveness** for smaller screens
6. **Add analytics tracking** for feature usage (optional)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify authentication tokens are being sent correctly
3. Ensure backend endpoints are deployed and accessible
4. Check network tab for API response errors
5. Verify component props are passed correctly

Happy coding! 🚀
