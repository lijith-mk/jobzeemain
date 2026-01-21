# JobZee API Map

This document maps routes → controllers → middleware, with brief workflow notes. It also lists key services and utils.

## Auth (Users) — routes: `jobzee-backend/routes/authRoutes.js`
- POST `/api/auth/register` → `authController.register`
- POST `/api/auth/login` → `authController.login`
- POST `/api/auth/google` → `authController.googleAuth`
- POST `/api/auth/forgot-password` → `authController.forgotPassword`
- POST `/api/auth/reset-password/:token` → `authController.resetPassword`
- GET `/api/auth/profile` → `authController.getProfile` [auth]
- PUT `/api/auth/profile` → `authController.updateProfile` [auth]

Workflow:
- Validate input → find/create user → bcrypt for passwords → JWT 7d → respond.
- Google: verify ID token (Google) → find/link/create → JWT.

Middleware:
- `auth` (JWT verify + error types)
- `rateLimiter.authLimiter` on sensitive endpoints (where applied)

## Employers — routes: `jobzee-backend/routes/employerRoutes.js`
- POST `/api/employers/register` → `employerController.registerEmployer`
- POST `/api/employers/login` → `employerController.loginEmployer`
- POST `/api/employers/google` → `employerController.googleAuth`
- POST `/api/employers/forgot-password` → `employerController.forgotPassword`
- POST `/api/employers/reset-password` → `employerController.resetPassword`
- GET `/api/employers/profile` → `employerController.getProfile` [employerAuth]
- PUT `/api/employers/profile` → `employerController.updateProfile` [employerAuth]

Workflow:
- Similar to user auth, with `role: employer`, `isActive` check, sign-in upsert.
- Forgot/reset uses hashed token + 1h TTL.

Middleware:
- `employerAuth` (JWT verify + role check + active account)
- `rateLimiter.passwordResetLimiter` (where applied)

## Admin — routes: `jobzee-backend/routes/adminRoutes.js`
- POST `/api/admin/init` → initialize admin (restricted usage)
- POST `/api/admin/login` → admin login → JWT 24h
- GET `/api/admin/dashboard` → stats [adminAuth]

Middleware:
- `adminAuth` + optional `adminAuth.checkPermission(...)`

## Jobs — routes: `jobzee-backend/routes/jobRoutes.js`
- POST `/api/jobs` → `jobController.createJob` [employerAuth]
- PUT `/api/jobs/:id` → `jobController.updateJob` [employerAuth]
- DELETE `/api/jobs/:id` → `jobController.deleteJob` [employerAuth]
- GET `/api/jobs` → `jobController.getJobs` (public)
- GET `/api/jobs/:id` → `jobController.getJobById` (public)
- GET `/api/employers/:id/jobs` → employer listings (public or guarded as implemented)

Workflow:
- Employer-auth writes; enforce plan limits; CRUD on `Job`.

## Applications — routes: `jobzee-backend/routes/applicationRoutes.js`
- POST `/api/applications/:jobId` → `applicationController.applyToJob` [auth]
- GET `/api/applications/me` → `applicationController.getUserApplications` [auth]
- GET `/api/applications/employer` → `applicationController.getEmployerApplications` [employerAuth]
- PATCH `/api/applications/:id/status` → `applicationController.updateStatus` [employerAuth]

Workflow:
- Auth → validate → create/transition Application → notify as needed.

## Saved Jobs — routes: `jobzee-backend/routes/savedJobRoutes.js`
- POST `/api/saved/:jobId` → `savedJobController.saveJob` [auth]
- DELETE `/api/saved/:jobId` → `savedJobController.unsaveJob` [auth]
- GET `/api/saved` → `savedJobController.listSavedJobs` [auth]

## Pricing — routes: `jobzee-backend/routes/pricingRoutes.js`
- GET `/api/pricing` → `pricingController.getPlans`
- GET `/api/pricing/:planId` → `pricingController.getPlanById`

## Payments — routes: `jobzee-backend/routes/paymentRoutes.js`
- POST `/api/payments/create-order` → `paymentController.createOrder` [employerAuth]
- POST `/api/payments/verify` → `paymentController.verifyPayment` [employerAuth]
- GET `/api/payments/history` → `paymentController.getPaymentHistory` [employerAuth]
- GET `/api/payments/stats` → `paymentController.getPaymentStats` [employerAuth]
- GET `/api/payments/:paymentId` → `paymentController.getPaymentDetails` [employerAuth]

Workflow:
- Create Razorpay order → persist `Payment` (initiated) + `Subscription` (created).
- Verify HMAC signature → update `Employer` subscription + mark success → generate invoice (PDF) + email.

## Invoices — routes: `jobzee-backend/routes/invoiceRoutes.js`
- Typical: list/get employer invoices (exact handlers in `invoiceController.js`) [employerAuth/admin]

## Uploads — routes: `jobzee-backend/routes/uploadRoutes.js`
- POST `/api/upload/user/profile-photo` [auth, uploadLimiter] → Cloudinary
- POST `/api/upload/employer/profile-photo` [employerAuth, uploadLimiter] → Cloudinary
- POST `/api/upload/employer/company-logo` [employerAuth, uploadLimiter] → Cloudinary
- POST `/api/upload/user/resume` [auth, uploadLimiter] → Cloudinary (PDF/doc)
- DELETE endpoints to remove photos [auth/employerAuth]

Workflow:
- `multer` memory → `utils/cloudinaryUpload.uploadToCloudinary` → save URL → delete old asset if exists.

## Dashboard assets — routes: `jobzee-backend/routes/dashboardAssets.js`
- GET `/api/dashboard/assets` → formatted assets (public)
- GET `/api/dashboard/assets/category/:category` (public)
- POST `/api/dashboard/initialize` [auth, isAdmin] → `dashboardAssetsService.initializeDefaultAssets`
- POST `/api/dashboard/upload` [auth, isAdmin] → upload new asset (Cloudinary)
- PUT `/api/dashboard/assets/:id` [auth, isAdmin]
- DELETE `/api/dashboard/assets/:id` [auth, isAdmin]

## Middleware — `jobzee-backend/middleware/*`
- `auth.js`: user JWT verify → `req.user` (handles TOKEN_EXPIRED/MALFORMED)
- `employerAuth.js`: employer JWT + role + active → `req.employer`
- `adminAuth.js`: admin JWT + active → `req.admin`
- `rateLimiter.js`: `authLimiter`, `uploadLimiter`, `passwordResetLimiter`, etc.
- `upload.js`: `uploadSingle('photo')`, `uploadMultiple('photos')` (image types, 5MB)
- `uploadCloudinary.js`: `multer-storage-cloudinary` storage (alt path)
- `security.js`: security headers/hardening

## Services — `jobzee-backend/services/*`
- `invoiceService.js`
  - `renderInvoicePdf(invoiceData)`
  - `uploadInvoiceToCloudinary(pdfBuffer, invoiceNumber)`
  - `createAndSendInvoice({ employerId, payment, subscription, plan })`
- `emailService.js`
  - Nodemailer transport, `sendPasswordResetEmail`, generic mail helpers
- `dashboardAssetsService.js`
  - `uploadAsset(imageData, assetInfo)`
  - `initializeDefaultAssets()`
  - `getAssetsByCategory(category?)`
  - `getFormattedDashboardAssets()`, `getFallbackAssets()`
  - `deleteAsset(assetId)`, `updateAssetMetadata(id, updates)`, `toggleAssetStatus(id)`

## Utils — `jobzee-backend/utils/*`
- `cloudinaryUpload.js`
  - `uploadToCloudinary(file, folder)`
  - `deleteFromCloudinary(publicId)`
  - `getPublicIdFromUrl(url)`
- `emailService.js` (utility variant)
- `authProfileUtils.js` (profile normalization/helpers)

## Key Models (selection)
- `User`, `Employer`, `Admin`
- `Job`, `Application`, `SavedJob`
- `PricingPlan`, `Subscription`, `Payment`, `Invoice`, `InvoiceCounter`
- `DashboardAsset`
- `UserSignIn`, `EmployerSignIn`, `ContactQuery`

## Session/Auth Summary
- Stateless JWTs:
  - Users: 7d tokens; Employers: JWT with role; Admins: 24h.
- Middlewares verify JWT and role; no server-side session store.

