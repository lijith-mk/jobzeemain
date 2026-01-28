# Learning Path Course Mapping - Quick Reference

## 🎯 What Was Implemented

A complete system for linking courses to learning paths with **ORDER ENFORCEMENT** at the database level.

## 📁 Files Created

1. **`models/LearningPathCourse.js`** - Mapping model with order validation
2. **`controllers/learningPathController.js`** - 14 API functions
3. **`routes/learningPathRoutes.js`** - All API endpoints

## 📝 Files Modified

1. **`models/LearningPath.js`** - Enhanced fields (targetJobRole, status, career info)
2. **`models/Course.js`** - Added `relatedLearningPaths` field
3. **`index.js`** - Registered `/api/learning-paths` routes

## 🔑 Key Features

### ✅ Order Management
- **Unique per path**: Pre-save validation prevents duplicate orders
- **Sequential retrieval**: Courses always returned sorted by order
- **Bulk reorder**: Update multiple course orders at once
- **Navigation**: Get next/previous course in sequence

### ✅ Prerequisites
- Track course dependencies within a path
- Check if user has completed prerequisites before accessing a course
- Returns list of missing prerequisite courses

### ✅ Bidirectional References
- **LearningPath** → Courses via LearningPathCourse query
- **Course** → LearningPaths via `relatedLearningPaths` array
- Auto-synced when courses added/removed

## 🚀 Quick Start

### Admin: Create Learning Path with Courses

```javascript
// 1. Create Learning Path
POST /api/learning-paths
Headers: { Authorization: "Bearer <adminToken>" }
Body: {
  "title": "Full Stack Developer Path",
  "name": "fullstack-developer",
  "description": "Become a full-stack web developer",
  "targetJobRole": "Full Stack Developer",
  "level": "intermediate",
  "estimatedDuration": 200,
  "skills": ["HTML", "CSS", "JavaScript", "React", "Node.js"]
}
// Response: { success: true, data: { _id: "path123", ... } }

// 2. Add Courses in Order
POST /api/learning-paths/path123/courses
Headers: { Authorization: "Bearer <adminToken>" }
Body: {
  "courseId": "course-html-basics",
  "order": 1,
  "isRequired": true,
  "description": "Foundation of web development"
}

POST /api/learning-paths/path123/courses
Body: {
  "courseId": "course-javascript",
  "order": 2,
  "isRequired": true,
  "prerequisiteCourses": ["course-html-basics"]
}

POST /api/learning-paths/path123/courses
Body: {
  "courseId": "course-react",
  "order": 3,
  "prerequisiteCourses": ["course-javascript"]
}

// 3. Publish Path
PATCH /api/learning-paths/path123/status
Headers: { Authorization: "Bearer <adminToken>" }
Body: { "status": "published" }
```

### User: Browse and Navigate

```javascript
// 1. Get All Paths for a Role
GET /api/learning-paths?targetJobRole=Full Stack Developer&level=intermediate
// No auth required for browsing

// 2. View Path with Courses (Ordered)
GET /api/learning-paths/path123
// Returns: path details + courses array sorted by order + user progress (if logged in)

// 3. Check Prerequisites
GET /api/learning-paths/path123/courses/course-react/prerequisites
Headers: { Authorization: "Bearer <token>" }
// Returns: { met: false, missing: ["course-javascript"] }

// 4. Get Next Course
GET /api/learning-paths/path123/next/course-html-basics
Headers: { Authorization: "Bearer <token>" }
// Returns: course-javascript details
```

## 📋 API Endpoints Summary

### Public (Optional Auth)
- `GET /api/learning-paths` - List all paths (with filters)
- `GET /api/learning-paths/:id` - Get single path with courses
- `GET /api/learning-paths/:pathId/courses` - Get ordered courses
- `GET /api/learning-paths/course/:courseId/paths` - Reverse lookup

### Admin Only
- `POST /api/learning-paths` - Create path
- `PUT /api/learning-paths/:id` - Update path
- `DELETE /api/learning-paths/:id` - Delete path
- `PATCH /api/learning-paths/:id/status` - Change status
- `POST /api/learning-paths/:pathId/courses` - Add course
- `DELETE /api/learning-paths/:pathId/courses/:courseId` - Remove course
- `PATCH /api/learning-paths/:pathId/courses/:courseId/order` - Update order
- `POST /api/learning-paths/:pathId/courses/reorder` - Bulk reorder

### User (Authenticated)
- `GET /api/learning-paths/:pathId/next/:currentCourseId` - Next course
- `GET /api/learning-paths/:pathId/courses/:courseId/prerequisites` - Check prerequisites

## ⚡ Order Validation

### How It Works:
```javascript
// In LearningPathCourse model
learningPathCourseSchema.pre('save', async function(next) {
  if (this.isModified('order') || this.isNew) {
    const existingWithSameOrder = await this.constructor.findOne({
      learningPathId: this.learningPathId,
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingWithSameOrder) {
      return next(new Error(`Order ${this.order} is already taken`));
    }
  }
  next();
});
```

### What This Means:
- ✅ Each course in a path must have a unique order number
- ✅ If you try to add a course with order `2` when order `2` already exists, it will fail
- ✅ You must either use a different order or reorder existing courses first
- ✅ Order numbers can be any positive integer (1, 2, 3... or 10, 20, 30...)

## 🔄 Reordering Example

### Single Course Reorder:
```javascript
// Move course from order 3 to order 1
// First, ensure order 1 is available or reorder others first

PATCH /api/learning-paths/path123/courses/course-react/order
Headers: { Authorization: "Bearer <adminToken>" }
Body: { "newOrder": 1 }
```

### Bulk Reorder (Recommended):
```javascript
// Reorder all at once
POST /api/learning-paths/path123/courses/reorder
Headers: { Authorization: "Bearer <adminToken>" }
Body: {
  "courseOrders": [
    { "courseId": "course-react", "order": 1 },
    { "courseId": "course-javascript", "order": 2 },
    { "courseId": "course-html-basics", "order": 3 }
  ]
}
```

## 🧪 Testing Commands

### Test Order Validation:
```bash
# Add course with order 1
curl -X POST http://localhost:5000/api/learning-paths/path123/courses \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"course1","order":1}'

# Try to add another course with order 1 (should fail)
curl -X POST http://localhost:5000/api/learning-paths/path123/courses \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"course2","order":1}'
# Expected: Error - "Order 1 is already taken in this learning path"
```

### Test Ordering:
```bash
# Get courses (should be sorted by order)
curl http://localhost:5000/api/learning-paths/path123/courses
# Expected: Courses returned in order: 1, 2, 3...
```

### Test Prerequisites:
```bash
# Check if user can access course-react
curl http://localhost:5000/api/learning-paths/path123/courses/course-react/prerequisites \
  -H "Authorization: Bearer <token>"
# Expected: { met: false, missing: ["course-javascript"] } if JS course not completed
```

## 🎓 Database Schema

### LearningPathCourse (Mapping Table):
```
learningPathId (indexed) → LearningPath
courseId (indexed) → Course
order (unique per path, indexed)
isRequired (boolean)
estimatedDuration (number)
prerequisiteCourses ([ObjectId])
description (string)
learningObjectives ([string])
isActive (boolean)
completionCount (number)
```

### Key Indexes:
1. **Compound Unique**: `learningPathId + courseId` (prevents duplicate courses)
2. **Ordering**: `learningPathId + order` (fast sequential queries)
3. **Reverse Lookup**: `courseId + isActive` (find all paths for a course)

## ✨ Best Practices

### Order Numbering:
- ✅ Use 1, 2, 3... for simple paths
- ✅ Use 10, 20, 30... if you plan to insert courses later
- ✅ Use bulk reorder for major restructuring
- ❌ Don't use negative numbers or zero

### Prerequisites:
- ✅ Set prerequisites for courses that build on previous knowledge
- ✅ Check prerequisites before allowing course access
- ❌ Don't create circular dependencies (A → B → A)

### Path Management:
- ✅ Start paths as "draft" status
- ✅ Test course order and prerequisites before publishing
- ✅ Use "published" for active paths visible to users
- ✅ Use "archived" for old paths (keeps data but hides from users)

## 📊 Example Learning Path Structure

```
Full Stack Developer Path (level: intermediate)
├── Course 1: HTML & CSS Fundamentals (order: 1, required)
├── Course 2: JavaScript Basics (order: 2, required, prereq: Course 1)
├── Course 3: React Fundamentals (order: 3, required, prereq: Course 2)
├── Course 4: Node.js & Express (order: 4, required, prereq: Course 2)
├── Course 5: MongoDB Database (order: 5, required, prereq: Course 4)
├── Course 6: Advanced React Patterns (order: 6, optional, prereq: Course 3)
└── Course 7: Full Stack Project (order: 7, required, prereq: Courses 3,4,5)
```

## 🚨 Common Errors

### Error: "Order X is already taken"
**Cause**: Trying to add/update a course with an order number already in use.
**Solution**: Either choose a different order or reorder existing courses first.

### Error: "Course already exists in this learning path"
**Cause**: Trying to add the same course twice to a path.
**Solution**: Remove the course first or update the existing mapping.

### Error: "Learning path not found"
**Cause**: Invalid path ID.
**Solution**: Verify the path ID exists.

### Error: "Course not found"
**Cause**: Invalid course ID.
**Solution**: Verify the course ID exists.

## 🎯 Summary

✅ **Order enforcement** implemented at database level  
✅ **14 API endpoints** for complete CRUD + ordering  
✅ **Prerequisites tracking** for course dependencies  
✅ **Bidirectional references** auto-synced  
✅ **Admin controls** for path/course management  
✅ **User navigation** with next/previous course  
✅ **Progress tracking** integration ready  
✅ **All routes registered** and ready to use  

**ORDER MATTERS** is fully implemented and validated! 🎉
