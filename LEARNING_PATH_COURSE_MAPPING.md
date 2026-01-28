# Learning Path Course Mapping Implementation

## Overview
Implemented a comprehensive system for linking courses to learning paths with order management, prerequisites, and progress tracking.

## Architecture

### 1. **LearningPathCourse Model** (`models/LearningPathCourse.js`)
A dedicated mapping model that creates a many-to-many relationship between Learning Paths and Courses.

#### Key Features:
- **Ordered Sequences**: Each course has an `order` field (enforced unique per path)
- **Required/Optional**: `isRequired` flag to mark mandatory vs optional courses
- **Prerequisites**: Track course dependencies within a path
- **Metadata**: Description, learning objectives specific to the path context
- **Stats**: Completion count tracking

#### Schema:
```javascript
{
  learningPathId: ObjectId (ref: LearningPath) - Required, Indexed
  courseId: ObjectId (ref: Course) - Required, Indexed
  order: Number - Required, Min: 1, Unique per path
  isRequired: Boolean - Default: true
  estimatedDuration: Number - Hours
  prerequisiteCourses: [ObjectId] - Course dependencies
  description: String - Why this course is in this path
  learningObjectives: [String] - Specific objectives
  isActive: Boolean - Default: true
  completionCount: Number - Default: 0
  addedBy: ObjectId (ref: User)
}
```

#### Validation:
- Pre-save hook ensures `order` is unique within each learning path
- Throws error if duplicate order detected

#### Static Methods:
- `getPathCourses()` - Get all courses in a path (ordered)
- `getCoursePaths()` - Get all paths containing a course
- `reorderCourses()` - Reorder courses in bulk
- `getNextCourse()` - Get next course in sequence
- `getPreviousCourse()` - Get previous course in sequence

#### Instance Methods:
- `checkPrerequisites(userId)` - Check if user has completed prerequisites

---

### 2. **LearningPath Model** (`models/LearningPath.js`)
Enhanced with additional fields for better course management.

#### Key Enhancements:
- **Dual targeting**: `targetJobRole` + `targetRole` (synced automatically)
- **Status system**: `draft`, `published`, `archived`
- **Career info**: `careerOutlook`, `salaryRange`
- **Metrics**: `enrollmentCount`, `completionRate`, `averageRating`

---

### 3. **Course Model** (`models/Course.js`)
Added reference to learning paths for bidirectional relationship.

#### New Field:
```javascript
relatedLearningPaths: [ObjectId] (ref: LearningPath)
```

---

## API Endpoints

### Public Routes (Optional Auth)

1. **Get All Learning Paths**
   - `GET /api/learning-paths`
   - Filters: targetJobRole, level, category, isActive, status, search

2. **Get Single Learning Path**
   - `GET /api/learning-paths/:id`
   - Returns path with courses and user progress

3. **Get Path Courses**
   - `GET /api/learning-paths/:pathId/courses`
   - Returns ordered course list

4. **Get Course in Paths**
   - `GET /api/learning-paths/course/:courseId/paths`
   - Shows all paths containing a course

### Admin Routes

5. **Create Learning Path**
   - `POST /api/learning-paths`
   - Creates new learning path

6. **Update Learning Path**
   - `PUT /api/learning-paths/:id`
   - Updates path details

7. **Delete Learning Path**
   - `DELETE /api/learning-paths/:id`
   - Deletes path and mappings

8. **Toggle Path Status**
   - `PATCH /api/learning-paths/:id/status`
   - Change status (draft/published/archived)

9. **Add Course to Path**
   - `POST /api/learning-paths/:pathId/courses`
   - Adds course with order and metadata

10. **Remove Course from Path**
    - `DELETE /api/learning-paths/:pathId/courses/:courseId`

11. **Update Course Order**
    - `PATCH /api/learning-paths/:pathId/courses/:courseId/order`

12. **Bulk Reorder Courses**
    - `POST /api/learning-paths/:pathId/courses/reorder`

### User Routes

13. **Get Next Course**
    - `GET /api/learning-paths/:pathId/next/:currentCourseId`

14. **Check Course Prerequisites**
    - `GET /api/learning-paths/:pathId/courses/:courseId/prerequisites`

---

## Order Management

### How Order Works:
1. Each course in a path has a unique `order` number
2. Order defines the recommended sequence
3. Pre-save validation prevents duplicate orders
4. Courses are always returned sorted by order

### Order Validation:
```javascript
// Pre-save hook in LearningPathCourse model
// Ensures order is unique within each learning path
// Throws error if duplicate order detected
```

### Reordering:
- **Single**: Update one course order at a time
- **Bulk**: Update multiple course orders in one request
- **Auto-sort**: Always retrieves courses in order

---

## Usage Example

### Admin: Create Path with Ordered Courses

```javascript
// 1. Create learning path
POST /api/learning-paths
{
  "title": "Full Stack Web Developer",
  "targetJobRole": "Full Stack Developer",
  "level": "intermediate"
}
// Returns: { _id: "path123" }

// 2. Add courses in order
POST /api/learning-paths/path123/courses
{ "courseId": "html-course", "order": 1, "isRequired": true }

POST /api/learning-paths/path123/courses
{ "courseId": "js-course", "order": 2, "prerequisiteCourses": ["html-course"] }

POST /api/learning-paths/path123/courses
{ "courseId": "react-course", "order": 3, "prerequisiteCourses": ["js-course"] }

// 3. Publish
PATCH /api/learning-paths/path123/status
{ "status": "published" }
```

### User: Navigate Path

```javascript
// 1. Browse paths
GET /api/learning-paths?targetJobRole=Full Stack Developer

// 2. View path with courses (ordered)
GET /api/learning-paths/path123

// 3. Check prerequisites
GET /api/learning-paths/path123/courses/react-course/prerequisites
// Returns: { met: false, missing: ["js-course"] }

// 4. Get next course
GET /api/learning-paths/path123/next/html-course
// Returns: js-course details
```

---

## Files Created/Modified

### New Files:
1. `jobzee-backend/models/LearningPathCourse.js` - Mapping model
2. `jobzee-backend/controllers/learningPathController.js` - Controller with 14 functions
3. `jobzee-backend/routes/learningPathRoutes.js` - API routes

### Modified Files:
1. `jobzee-backend/models/LearningPath.js` - Enhanced fields
2. `jobzee-backend/models/Course.js` - Added relatedLearningPaths
3. `jobzee-backend/index.js` - Registered routes

---

## Key Features

✅ **Order Enforcement**: Pre-save validation ensures unique orders
✅ **Bidirectional Links**: Course ↔ LearningPath references sync automatically
✅ **Prerequisites**: Track and validate course dependencies
✅ **Progress Tracking**: LearningPathProgress model with auto-calculated metrics
✅ **Flexible Access**: Optional auth for public browsing
✅ **Admin Controls**: Full CRUD + ordering operations
✅ **Scalable**: Indexed for performance, bulk operations support
✅ **Integrated**: Routes registered and ready to use

**ORDER MATTERS** is fully implemented with database-level validation!
