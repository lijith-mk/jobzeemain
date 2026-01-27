# Lesson Management Quick Reference

## 🎯 User Flow
```
Admin Dashboard → Courses Tab → View Course → Manage Lessons
```

## 📋 Quick Actions

### View Course
1. Click "Courses" tab in admin sidebar
2. Click "View" on any course
3. See course details + all lessons

### Add Lesson
1. Click "+ Add Lesson" button
2. Fill form (Title*, Duration*, Difficulty*)
3. Click "Create Lesson"

### Edit Lesson
1. Click "Edit" on lesson card
2. Modify fields
3. Click "Update Lesson"

### Reorder Lessons
- Click ↑ to move up
- Click ↓ to move down

### Toggle Status
- Click "Activate" or "Deactivate"

### Delete Lesson
- Click "Delete" → Confirm

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/courses/:courseId/lessons` | Get all lessons |
| POST | `/api/admin/courses/:courseId/lessons` | Create lesson |
| PUT | `/api/admin/lessons/:id` | Update lesson |
| PATCH | `/api/admin/lessons/:id/status` | Toggle status |
| DELETE | `/api/admin/lessons/:id` | Delete lesson |
| PATCH | `/api/admin/courses/:courseId/lessons/reorder` | Reorder lessons |

---

## 📝 Lesson Fields

| Field | Required | Type | Example |
|-------|----------|------|---------|
| Title | ✅ | String | "Introduction to React" |
| Duration | ✅ | Number | 45 (minutes) |
| Difficulty | ✅ | Enum | beginner/intermediate/advanced |
| Lesson Order | ✅ | Number | 1, 2, 3... |
| Description | ❌ | String | "Learn React basics" |
| Video URL | ❌ | URL | "https://youtube.com/..." |
| Text Content | ❌ | String | Article/tutorial text |
| Active | ❌ | Boolean | true (default) |

---

## 📁 Files Modified/Created

### Backend
- `adminRoutes.js` - Added 6 lesson endpoints

### Frontend
- `AdminCourseView.jsx` - Course view + lesson management UI
- `AdminCourseView.css` - Styling
- `App.js` - Added route for `/admin/courses/:courseId`

---

## 🎨 UI Components

### Course Details Card
Shows: Title, Description, Category, Level, Skills, Job Roles, Enrollments, Rating, Status

### Lessons List
Shows each lesson with:
- Order number (#1, #2, etc.)
- Title and description
- Duration, difficulty, type badges
- Action buttons (reorder, edit, toggle, delete)

### Lesson Modal
Form with all lesson fields for adding/editing

---

## ✅ Features

- ✅ Add lessons to courses
- ✅ Edit lesson details
- ✅ Delete lessons with confirmation
- ✅ Reorder lessons (up/down arrows)
- ✅ Toggle active/inactive status
- ✅ Form validation
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Admin authentication

---

## 🚀 Quick Start

1. Login as admin
2. Navigate to Dashboard
3. Click "Courses" tab
4. Click "View" on any course
5. Click "+ Add Lesson"
6. Fill form and submit
7. Manage lessons using action buttons

---

## 🔍 Troubleshooting

**Lessons not appearing?**
→ Check if marked as Active

**Can't reorder?**
→ Check lesson order numbers are unique

**Form errors?**
→ Fill all required fields (marked with *)

**Video not loading?**
→ Verify URL is accessible and includes https://

---

## 💡 Tips

- Set realistic duration estimates
- Use descriptive titles
- Order lessons logically (beginner → advanced)
- Mark incomplete lessons as inactive
- Include either video URL or text content
- Add descriptions for better searchability

---

**Documentation**: See `LESSON_MANAGEMENT_COMPLETE.md` for full details
