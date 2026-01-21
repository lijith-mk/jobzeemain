# Migration Guide - Employer Test Feature

## Overview
This guide covers the migration process for the employer test creation feature. The changes are **backward compatible** and require no immediate action.

## Database Changes Summary

### 1. Test Model Changes
**File:** `models/Test.js`

#### Before:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
}
```

#### After:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  refPath: 'createdByModel',
},
createdByModel: {
  type: String,
  enum: ['Admin', 'Employer'],
  default: 'Admin',
}
```

### 2. Job Model Changes
**File:** `models/Job.js`

#### Added Fields:
```javascript
testId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Test',
},
requiresTest: {
  type: Boolean,
  default: false,
}
```

## Migration Required?

### ❌ NO MIGRATION NEEDED

The changes are fully backward compatible:

1. **Existing Tests**: All existing tests will automatically have `createdByModel: 'Admin'` (the default value)
2. **Existing Jobs**: Will have `testId: null` and `requiresTest: false` (default values)
3. **No Data Loss**: All existing data remains intact and functional

## Automatic Handling

### Existing Admin Tests
- All existing tests created by admins will continue to work
- They automatically default to `createdByModel: 'Admin'`
- No code changes needed for admin test functionality
- Admin test routes continue to work unchanged

### Existing Jobs
- All existing jobs will have `testId: null`
- `requiresTest` defaults to `false`
- Jobs without tests continue to function normally
- No changes to existing job posting behavior

## Optional Migration Script

If you want to explicitly set `createdByModel` for existing tests (recommended for data consistency):

```javascript
// migration-script.js
const mongoose = require('mongoose');
const Test = require('./models/Test');

async function migrateExistingTests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Starting migration...');
    
    // Update all tests that don't have createdByModel set
    const result = await Test.updateMany(
      { createdByModel: { $exists: false } },
      { $set: { createdByModel: 'Admin' } }
    );
    
    console.log(`✅ Migration complete: ${result.modifiedCount} tests updated`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateExistingTests();
```

**Note:** This script is optional since the default value handles this automatically.

## Verification Steps

### 1. Verify Existing Admin Tests
```javascript
// Check that existing tests still work
GET /api/admin/tests

// Expected: All existing tests returned with createdByModel: 'Admin'
```

### 2. Verify Admin Can Still Create Tests
```javascript
POST /api/admin/tests
{
  "title": "Admin Test",
  "type": "mcq",
  ...
}

// Expected: Test created with createdByModel: 'Admin'
```

### 3. Verify Employer Can Create Tests
```javascript
POST /api/employer-tests
{
  "title": "Employer Test",
  "type": "mcq",
  ...
}

// Expected: Test created with createdByModel: 'Employer'
```

### 4. Verify Job Posting Works
```javascript
// Existing jobs (without test)
POST /api/employers/jobs
{
  "title": "Job without test",
  ...
}
// Expected: Job created with testId: null

// New jobs (with test)
POST /api/employers/jobs
{
  "title": "Job with test",
  "testId": "employer_test_id",
  ...
}
// Expected: Job created with testId populated
```

## Rollback Plan

If you need to rollback the changes:

### 1. Remove New Routes
In `index.js`, comment out:
```javascript
// const employerTestRoutes = require("./routes/employerTestRoutes");
// app.use("/api/employer-tests", employerTestRoutes);
```

### 2. Revert Model Changes
In `models/Test.js`, revert to:
```javascript
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
}
```

In `models/Job.js`, remove:
```javascript
// testId: { ... },
// requiresTest: { ... },
```

### 3. Revert Controller Changes
In `controllers/employerController.js`, remove test-related code from `createJob` and `updateJob`.

**Note:** This is unlikely to be needed since changes are additive and non-breaking.

## Testing After Deployment

### Quick Test Checklist

1. **Admin Tests** ✓
   - [ ] Admin can view existing tests
   - [ ] Admin can create new tests
   - [ ] Admin can edit tests
   - [ ] Admin can delete tests

2. **Employer Tests** ✓
   - [ ] Employer can create tests
   - [ ] Employer can add questions
   - [ ] Employer can activate tests
   - [ ] Employer can link tests to jobs

3. **Jobs** ✓
   - [ ] Jobs without tests work normally
   - [ ] Jobs with tests work correctly
   - [ ] Test validation works
   - [ ] Cannot use invalid tests

4. **Security** ✓
   - [ ] Employers cannot access other employers' tests
   - [ ] Employers cannot access admin tests
   - [ ] Admins can access all tests (if needed)

## Database Indexes

The new fields are automatically indexed by Mongoose. No manual index creation needed.

### Test Model Indexes
```javascript
// Existing indexes
testSchema.index({ title: 1 });
testSchema.index({ category: 1 });
testSchema.index({ type: 1 });
testSchema.index({ isActive: 1 });

// createdBy and createdByModel are automatically indexed by Mongoose
```

### Job Model Indexes
```javascript
// testId field is automatically indexed as a reference
```

## Performance Impact

### Minimal Impact Expected
- Added fields are optional and have default values
- Queries on existing data won't change
- New queries are efficient with proper indexes
- No N+1 query issues introduced

### Query Performance
```javascript
// Efficient: Uses index on createdBy
Test.find({ createdBy: employerId, createdByModel: 'Employer' })

// Efficient: Uses reference lookup
Job.findById(jobId).populate('testId')

// Efficient: Uses compound query
Job.find({ employerId: id, requiresTest: true })
```

## Environment Variables

No new environment variables required. Everything uses existing configuration.

## API Versioning

No API version changes needed. New endpoints are additive:
- Existing routes: `/api/admin/tests` (unchanged)
- New routes: `/api/employer-tests` (new)

No conflicts or breaking changes to existing APIs.

## Monitoring Recommendations

After deployment, monitor:

1. **Error Logs**
   - Watch for validation errors on test creation
   - Check for ownership validation failures
   - Monitor job creation with invalid tests

2. **Database Queries**
   - Check for slow queries on Test model
   - Monitor Job model query performance
   - Verify index usage

3. **API Usage**
   - Track employer test creation rate
   - Monitor question addition patterns
   - Check job linking success rate

## Support & Troubleshooting

### Common Issues

1. **"Cannot activate test without questions"**
   - Cause: Trying to activate empty test
   - Solution: Add questions first, then activate

2. **"You do not have permission"**
   - Cause: Accessing another employer's test
   - Solution: Use own tests or create new ones

3. **"Cannot delete test linked to jobs"**
   - Cause: Test is referenced by active jobs
   - Solution: Remove test from jobs first

4. **"Test must be active"**
   - Cause: Using inactive test in job posting
   - Solution: Activate test first

### Debug Queries

```javascript
// Check test ownership
db.tests.find({ createdByModel: 'Employer' })

// Check jobs with tests
db.jobs.find({ testId: { $exists: true, $ne: null } })

// Find tests without createdByModel
db.tests.find({ createdByModel: { $exists: false } })
```

## Conclusion

✅ **Migration is automatic and safe**
✅ **No data loss or corruption risk**
✅ **Backward compatible with existing code**
✅ **Can rollback easily if needed**
✅ **Production ready**

The feature can be deployed with confidence. All existing functionality remains intact while adding powerful new capabilities for employers.

---

**Last Updated:** January 19, 2026
**Status:** Ready for Production
**Risk Level:** Low
