# Course Payment Troubleshooting Guide

## Issue: Payment Error After Completing Payment

This guide helps you fix course payment issues on your hosted site.

---

## Quick Diagnosis Steps

### Step 1: Check Razorpay Configuration

**In Render Dashboard → Your Backend Service → Environment:**

Verify these environment variables are set:
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID (starts with `rzp_test_` or `rzp_live_`)
- `RAZORPAY_KEY_SECRET` - Your Razorpay Secret Key

**How to check:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Look for `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

**If missing:** Add them with your Razorpay credentials

### Step 2: Check Backend Logs

After a payment attempt, check your backend logs:

1. Go to Render Dashboard → Backend Service → **Logs**
2. Look for these messages:

**Success looks like:**
```
[Payment Verification] Starting...
[Payment Verification] Signature verified successfully
[Payment Verification] Course progress created
[Payment Verification] Invoice created: INV-XXXXX
```

**Error looks like:**
```
[Payment Verification] RAZORPAY_KEY_SECRET not configured!
```
OR
```
[Payment Verification] Signature mismatch!
```
OR
```
[Payment Verification] Course not found
```

### Step 3: Check Frontend Console

Open browser console (F12) during payment:

**Success logs:**
```
[Payment] Payment successful, verifying...
[Payment] Verification response: { success: true, ... }
```

**Error logs:**
```
[Payment] Verification error: ...
[Payment] Error response: { message: "..." }
```

---

## Common Issues & Fixes

### Issue 1: "Payment gateway not configured"

**Cause:** `RAZORPAY_KEY_SECRET` missing in Render environment

**Fix:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your API keys (Settings → API Keys)
3. In Render Dashboard:
   - Go to Backend Service → **Environment**
   - Add `RAZORPAY_KEY_ID` = `rzp_test_XXXXXXXXXX`
   - Add `RAZORPAY_KEY_SECRET` = `XXXXXXXXXXXXXX`
4. Click **Save Changes**
5. Service will automatically redeploy

### Issue 2: "Payment verification failed. Invalid signature."

**Cause:** Wrong Razorpay secret key or keys mismatch

**Fix:**
1. Verify you're using the correct key pair from Razorpay
2. Make sure frontend uses the same `RAZORPAY_KEY_ID` as backend
3. Check if there are any extra spaces in the keys
4. Regenerate keys in Razorpay if needed

### Issue 3: "Course not found" after payment

**Cause:** Course ID mismatch or database connection issue

**Fix:**
1. Check if MongoDB is connected (check backend logs for connection message)
2. Verify the course exists in database
3. Check if `MONGODB_URI` is set correctly in Render

### Issue 4: Payment succeeds but enrollment fails

**Cause:** Database error or invoice generation error

**Fix:**
The updated code now handles this gracefully:
- Enrollment will succeed even if invoice fails
- Check logs for "[Payment Verification] Invoice creation error"
- User will still be enrolled in the course

### Issue 5: Already enrolled error after payment

**Cause:** Duplicate payment attempts or refresh after success

**Fix:**
This is actually a success! The user is already enrolled.
- Check if they can access the course
- No refund needed as they're enrolled

---

## Frontend Environment Setup

Make sure your frontend `.env` has:

```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
```

**Note:** Use the same `RAZORPAY_KEY_ID` in both frontend and backend

---

## Testing Payment Flow

### Test Mode (Recommended for initial testing)

1. Use Razorpay **Test Mode** keys
2. Test card details:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
   - OTP: `123456`

### What to Check:

✅ Payment modal opens
✅ Payment completes successfully
✅ Success toast appears
✅ User redirected to course page
✅ Course shows as "enrolled"
✅ Invoice generated (check backend logs)

---

## Step-by-Step Resolution

### For Hosted Site (Render):

#### Step 1: Verify Razorpay Keys

```bash
# In Render Dashboard → Backend → Environment
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXX
```

#### Step 2: Verify Frontend Environment

```bash
# In Render Dashboard → Frontend → Environment
REACT_APP_API_URL=https://jobzee-backend-xxxx.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX  # Same as backend
```

#### Step 3: Redeploy

After adding/updating environment variables:
- Backend will auto-redeploy
- Frontend: Click **Manual Deploy** if needed

#### Step 4: Test Payment

1. Go to your hosted site
2. Navigate to a paid course
3. Click "Enroll Now" or "Buy Course"
4. Complete payment with test card
5. Check browser console for logs
6. Check Render backend logs

---

## Detailed Logs Explanation

### Backend Logs:

```
[Payment Verification] Starting...
```
✅ Payment verification endpoint called

```
[Payment Verification] User ID: 6xxxxx
[Payment Verification] Course ID: 6xxxxx
[Payment Verification] Order ID: order_xxxxx
[Payment Verification] Payment ID: pay_xxxxx
```
✅ All required data received

```
[Payment Verification] Signature verified successfully
```
✅ Payment is legitimate

```
[Payment Verification] Course found: Course Name
```
✅ Course exists in database

```
[Payment Verification] User found: user@email.com
```
✅ User authenticated

```
[Payment Verification] Course progress created
[Payment Verification] Enrollment count updated
[Payment Verification] Invoice created: INV-XXXXX
```
✅ Everything succeeded!

### Frontend Console Logs:

```javascript
[Payment] Payment successful, verifying...
[Payment] Response: { razorpay_payment_id: "pay_xxxx", ... }
[Payment] Verification response: { success: true, ... }
✅ Payment successful! Invoice INV-XXXXX generated.
```
✅ End-to-end success!

---

## Emergency Fixes

### If payment taken but enrollment failed:

1. **Check backend logs** for the payment ID
2. **Find the transaction** in Razorpay dashboard
3. **Manually enroll** the user:
   ```javascript
   // In MongoDB or backend console
   CourseProgress.create({
     userId: "USER_ID",
     courseId: "COURSE_ID",
     isPaid: true,
     paymentId: "PAYMENT_ID",
     paymentStatus: "completed"
   });
   ```

### If duplicate payment attempts:

Razorpay prevents duplicate charges for the same order ID automatically.

### If signature verification keeps failing:

1. Regenerate Razorpay keys
2. Update both frontend and backend
3. Redeploy both services
4. Clear browser cache

---

## Prevention Checklist

Before going live:

- [ ] Razorpay keys set in backend environment
- [ ] Razorpay key ID set in frontend environment  
- [ ] Test payment works end-to-end
- [ ] Backend logs show successful verification
- [ ] Invoice generation works
- [ ] User can access course after payment
- [ ] Email notifications work (if configured)
- [ ] Refund process tested (if needed)

---

## Support Information

If issue persists after all fixes:

1. **Collect this information:**
   - Backend logs (last 100 lines)
   - Frontend console logs
   - Payment ID from Razorpay
   - Course ID user tried to purchase
   - User email/ID

2. **Check Razorpay Dashboard:**
   - Go to Payments section
   - Find the payment
   - Check if it shows as "captured" or "failed"

3. **Manual Resolution:**
   - If payment captured in Razorpay but enrollment failed
   - Manually create CourseProgress entry
   - Contact user with course access

---

## Quick Commands

### Check if Razorpay is configured:
```bash
# In backend terminal
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET
```

### Test Razorpay connection:
```bash
# In project root
node jobzee-backend/test-razorpay.js
```

---

## Updated Code Features

The fixes include:

✅ **Detailed logging** - Every step is logged
✅ **Better error messages** - Clear indication of what failed
✅ **Environment validation** - Checks if keys are configured
✅ **Graceful degradation** - Enrollment succeeds even if invoice fails  
✅ **Duplicate prevention** - Handles already-enrolled users
✅ **Frontend error display** - Shows specific error messages
✅ **Payment ID in error** - Users can reference payment ID when contacting support

---

## Summary

**Most Common Issue:** Missing `RAZORPAY_KEY_SECRET` in Render environment

**Quick Fix:** 
1. Add Razorpay keys in Render Dashboard → Environment
2. Save changes (service auto-redeploys)
3. Test payment again

The improved code now provides detailed logs to help you identify exactly where the issue occurs!
