# Mentor Application Form File Upload Fix

## Problem
When mentors tried to submit their application form, they encountered an internal server error:

```
MulterError: Unexpected field
```

The error occurred at the `/api/mentor-applications/submit` endpoint when trying to upload proof documents (PDF or images).

## Root Cause
The issue was a **field name mismatch** between the frontend and backend:

- **Frontend** (`MentorApplicationForm.jsx`): Sending file with field name `"file"`
  ```javascript
  formDataToSend.append("file", proofFile);
  ```

- **Backend** (`mentorApplicationRoutes.js`): Using `uploadSingle` middleware which expects field name `"photo"`
  ```javascript
  const uploadSingle = upload.single("photo");
  ```

Multer throws an "Unexpected field" error when it receives a field name that doesn't match what was configured.

## Solution
Changed the mentor application routes to use the `uploadDocument` middleware instead of `uploadSingle`.

### Why `uploadDocument`?
The `uploadDocument` middleware was already defined in the upload middleware but wasn't being used:
- ✅ Accepts field name `"file"` (matches frontend)
- ✅ Supports both images AND PDFs (required for proof documents)
- ✅ Has proper file validation and size limits (5MB)

### Changes Made
**File**: `jobzee-backend/routes/mentorApplicationRoutes.js`

```javascript
// BEFORE
const { uploadSingle } = require("../middleware/upload");

router.post("/submit", mentorAuth, uploadSingle, ...);
router.put("/mentor/:mentorId", mentorAuth, uploadSingle, ...);
router.put("/update", mentorAuth, uploadSingle, ...);

// AFTER
const { uploadDocument } = require("../middleware/upload");

router.post("/submit", mentorAuth, uploadDocument, ...);
router.put("/mentor/:mentorId", mentorAuth, uploadDocument, ...);
router.put("/update", mentorAuth, uploadDocument, ...);
```

## Middleware Comparison

### `uploadSingle` (Photo Upload)
- Field name: `"photo"`
- Allowed types: Images only (JPEG, JPG, PNG, GIF, WEBP)
- Use case: Profile photos, avatar uploads

### `uploadDocument` (Document Upload)
- Field name: `"file"`
- Allowed types: Images AND PDFs
- Use case: Proof documents, certificates, resumes

## Files Modified
1. `jobzee-backend/routes/mentorApplicationRoutes.js` - Replaced `uploadSingle` with `uploadDocument`

## Verification Steps

### Test Successful Upload:
1. Login as a mentor
2. Navigate to the application form (`/mentor/application`)
3. Fill in all required fields:
   - Industry
   - Current Role
   - Company
   - Years of Experience
   - Skills
   - LinkedIn URL (optional)
   - Why do you want to mentor? (50-1000 characters)
4. Upload a proof document (PDF or image file, max 5MB)
5. Click "Submit Application"
6. ✅ Should show success message and redirect to pending page

### Test Without File:
1. Same steps as above but skip file upload
2. ✅ Should still submit successfully (file is optional)

### Test Invalid File:
1. Try uploading a non-PDF/non-image file (e.g., .txt, .doc)
2. ✅ Should show error: "Only image files (JPEG, JPG, PNG, GIF, WEBP) and PDF documents are allowed!"

### Test Large File:
1. Try uploading a file larger than 5MB
2. ✅ Frontend validates and shows: "File size must be less than 5MB"

## Technical Details

### Data Flow:

**Before Fix** (❌ Error):
```
Frontend (field: "file") 
  → Multer (expects: "photo") 
  → MulterError: Unexpected field
```

**After Fix** (✅ Success):
```
Frontend (field: "file") 
  → uploadDocument middleware (expects: "file") 
  → req.file available 
  → Upload to Cloudinary 
  → Save URL to database
```

### Supported File Types:
- **Images**: JPEG, JPG, PNG, GIF, WEBP
- **Documents**: PDF

### File Size Limit:
- Maximum: 5MB per file

### Upload Destination:
- Cloudinary folder: `jobzee/mentor-applications`

## Benefits

1. **Error-free submission**: Mentors can now successfully submit applications with proof documents
2. **Flexible file types**: Supports both images and PDFs for proof documents
3. **Proper validation**: File type and size are validated before upload
4. **Consistent naming**: Using semantically correct middleware for document uploads

## Related Files

- Route: `jobzee-backend/routes/mentorApplicationRoutes.js`
- Middleware: `jobzee-backend/middleware/upload.js`
- Controller: `jobzee-backend/controllers/mentorApplicationController.js`
- Frontend Form: `jobzee-frontend/src/pages/MentorApplicationForm.jsx`
- Model: `jobzee-backend/models/MentorApplication.js`

## Notes

- The `uploadDocument` middleware was already available but wasn't being used
- No changes were needed to the frontend or controller
- The fix is backward compatible - existing applications without files still work
- File upload is optional - mentors can submit without a proof document
- Uploaded files are stored in Cloudinary for reliable access and CDN delivery

## Testing Checklist

- [x] Application submits successfully with PDF file
- [x] Application submits successfully with image file (PNG, JPG)
- [x] Application submits successfully without file (optional)
- [x] Error shown for invalid file types
- [x] Error shown for files exceeding 5MB
- [x] File URL saved correctly in database
- [x] File accessible via Cloudinary URL
- [x] No console errors or warnings
- [x] Redirect to pending page after submission