# Admin Course Analytics System

## Overview
Complete analytics dashboard for admins to monitor course performance, enrollments, and revenue.

## Features Implemented

### 1. **Course Analytics Overview**
- Total enrollments
- Active learners (last 7 days)
- Completion percentage
- Average time spent per user
- Status distribution (enrolled, in-progress, completed, dropped)

### 2. **Drop-off Analysis**
- Identifies the lesson where most users stop
- Shows completion rate for each lesson
- Visual indicators for lessons with high dropout

### 3. **Quiz Performance**
- Average quiz score across all attempts
- Total quiz attempts
- Pass rate percentage
- Number of passed attempts

### 4. **Payment Analytics** (for paid courses)
- Total revenue generated
- Number of paid vs free enrollments
- Average price per enrollment
- Complete payment transaction history

### 5. **User Enrollments**
- Complete list of enrolled users with details:
  - Name, email, phone
  - Enrollment date and status
  - Progress percentage
  - Time spent on course
  - Payment information
- Filter by status (enrolled, in-progress, completed)
- Filter by payment type (paid, free)
- Pagination support

### 6. **Payment Transactions**
- Invoice numbers
- User details
- Amount breakdown (original, discount, tax, total)
- Payment IDs and order IDs
- Payment dates and status

## API Endpoints

### Get Course Analytics
```
GET /api/learning/admin/courses/:courseId/analytics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "course": {
    "id": "course_id",
    "title": "Course Name",
    "thumbnail": "url",
    "isPaid": true,
    "price": 999
  },
  "overview": {
    "totalEnrollments": 150,
    "activeLearnersCount": 45,
    "completionPercentage": 35,
    "completedCount": 52,
    "averageTimeSpent": 3600,
    "totalTimeSpent": 540000
  },
  "statusDistribution": {
    "enrolled": 30,
    "in-progress": 68,
    "completed": 52,
    "dropped": 0
  },
  "dropoffAnalysis": {
    "dropoffLesson": {
      "title": "Advanced Concepts",
      "order": 5,
      "droppedCount": 25
    },
    "lessonStats": [...]
  },
  "quizPerformance": {
    "averageScore": 78,
    "totalAttempts": 450,
    "passedAttempts": 380,
    "passRate": 84
  },
  "paymentStats": {
    "totalRevenue": 149850,
    "currency": "INR",
    "paidEnrollments": 150,
    "freeEnrollments": 0,
    "averagePrice": 999
  },
  "recentEnrollments": [...]
}
```

### Get Course Enrollments
```
GET /api/learning/admin/courses/:courseId/enrollments
Authorization: Bearer {token}
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - status: string (enrolled|in-progress|completed|dropped)
  - isPaid: boolean
```

### Get Course Payments
```
GET /api/learning/admin/courses/:courseId/payments
Authorization: Bearer {token}
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
```

## Frontend Components

### AdminCourseAnalytics Component
Located at: `src/pages/AdminCourseAnalytics.jsx`

**Features:**
- Tabbed interface (Overview, Enrollments, Payments)
- Visual metrics with icons and colors
- Interactive filters
- Pagination for large datasets
- Responsive design
- Loading and error states

**Usage:**
```javascript
import AdminCourseAnalytics from './pages/AdminCourseAnalytics';

// In your router:
<Route path="/admin/courses/:courseId/analytics" element={<AdminCourseAnalytics />} />
```

### Access from AdminCourseView
Added "View Analytics" button to course management page:
```jsx
<button 
  onClick={() => navigate(`/admin/courses/${courseId}/analytics`)} 
  className="analytics-btn"
>
  📊 View Analytics
</button>
```

## Styling

### Key CSS Features
- Modern gradient cards
- Color-coded status badges
- Responsive grid layouts
- Smooth transitions and hover effects
- Mobile-friendly design
- Print-ready invoice layouts

### Status Colors
- **Enrolled**: Blue (#2196F3)
- **In Progress**: Orange (#FF9800)
- **Completed**: Green (#4CAF50)
- **Dropped**: Red (#f44336)
- **Paid**: Green badge
- **Free**: Gray badge

## Analytics Logic

### Active Learners Calculation
```javascript
// Users who accessed the course in last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const activeLearnersCount = await CourseProgress.countDocuments({
  courseId,
  lastAccessedAt: { $gte: sevenDaysAgo }
});
```

### Drop-off Detection
```javascript
// For each lesson, count users who:
// 1. Completed the previous lesson
// 2. Did NOT complete the current lesson
// The lesson with highest such count is the drop-off point
```

### Completion Rate
```javascript
completionPercentage = (completedCount / totalEnrollments) * 100
```

## Privacy & Security

### Privacy-First Design
- **Aggregated Data**: Shows totals and averages, not individual behavior tracking
- **User Lists**: Only shows enrollment data, not detailed activity logs
- **Purpose**: Business analytics, not surveillance
- **Access Control**: Requires admin authentication

### What Admins CAN See
✅ Total enrollments and completion rates
✅ Which lessons have high drop-off (to improve content)
✅ Overall quiz performance averages
✅ Payment and revenue data
✅ User enrollment status and contact info

### What Admins CANNOT See
❌ Real-time user tracking
❌ Individual lesson viewing patterns
❌ Time spent per lesson by individual users
❌ Personal learning behavior profiles

## Use Cases

### 1. Content Improvement
- Identify lessons with high drop-off rates
- Review and improve problematic content
- Adjust difficulty levels

### 2. Business Analytics
- Track revenue per course
- Monitor enrollment trends
- Optimize pricing strategies

### 3. Student Success
- Monitor completion rates
- Identify courses needing support resources
- Track engagement levels

### 4. Payment Management
- View all course transactions
- Track paid vs free enrollments
- Revenue reporting

## Testing

### Test Scenarios

1. **Free Course**:
   - Payment tab should not appear
   - All other analytics should work normally

2. **Paid Course**:
   - Payment stats should show revenue
   - Enrollment list shows payment badges
   - Payment transaction list displays

3. **No Enrollments**:
   - Should show zeros gracefully
   - No division by zero errors

4. **Large Datasets**:
   - Pagination should work correctly
   - Filters should apply properly

## Example Usage Flow

1. Admin logs in
2. Goes to Admin Dashboard
3. Clicks on a course
4. Clicks "View Analytics" button
5. Sees comprehensive course performance data
6. Switches between Overview, Enrollments, and Payments tabs
7. Filters enrollments by status or payment type
8. Reviews drop-off points to improve content
9. Monitors revenue and completion rates

## Performance Considerations

### Database Indexes
Ensure these indexes exist for optimal performance:
```javascript
// CourseProgress
courseId + enrolledAt
courseId + lastAccessedAt
courseId + status

// CourseInvoice
courseId + invoiceDate
courseId + paymentStatus

// MicroQuizAttempt
courseId
```

### Aggregation Optimization
- Uses MongoDB aggregation pipelines
- Limits initial data fetch to recent 10 enrollments
- Pagination prevents loading all data at once
- Caches course data client-side

## Future Enhancements

### Potential Features
- [ ] Export analytics to PDF/Excel
- [ ] Date range filters
- [ ] Comparison between courses
- [ ] Email alerts for low completion rates
- [ ] Automated insights and recommendations
- [ ] Graphical charts (line, bar, pie)
- [ ] Student feedback integration
- [ ] A/B testing support

## Troubleshooting

### No Data Showing
- Check if course has enrollments
- Verify API endpoints are accessible
- Check browser console for errors
- Ensure admin authentication token is valid

### Performance Issues
- Add database indexes
- Reduce page limit
- Enable API caching
- Consider data archival for old courses

### Filter Not Working
- Check query parameter formatting
- Verify backend filter logic
- Test with different filter combinations

## Summary

This analytics system provides comprehensive course monitoring while respecting user privacy. It focuses on aggregated insights that help admins make informed decisions about content quality, pricing, and student support without invasive tracking.

**Key Principle**: Analytics for improvement, not surveillance.
