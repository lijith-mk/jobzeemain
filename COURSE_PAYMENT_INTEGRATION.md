# Course Payment Integration - Complete Guide

## Overview
This document describes the paid/free course system with Razorpay payment integration implemented in Jobzee.

## Features Implemented

### 1. **Admin Course Creation with Pricing**
- Location: `AdminCreateCourse.jsx`
- Admin can now:
  - Toggle between Free/Paid course
  - Set course price in INR
  - Set optional discount price with end date
  - Upload course thumbnail (Cloudinary)
  - Upload instructor photo (Cloudinary)

### 2. **Course Model Extensions**
- File: `models/Course.js`
- New Fields:
  ```javascript
  isPaid: Boolean           // true for paid, false for free
  price: Number            // Base price in rupees
  currency: String         // Default: 'INR'
  discountPrice: Number    // Optional discounted price
  discountEndDate: Date    // Discount expiry date
  ```

### 3. **CourseProgress Model Extensions**
- File: `models/CourseProgress.js`
- New Fields:
  ```javascript
  isPaid: Boolean              // Payment required flag
  paymentAmount: Number        // Amount paid
  paymentCurrency: String      // Currency used
  paymentId: String           // Razorpay payment ID
  paymentStatus: String       // 'pending', 'completed', 'failed'
  paidAt: Date                // Payment timestamp
  ```

## Payment Flow

### Step 1: User Browses Courses
- **Frontend**: [LearningHub.jsx](jobzee-frontend/src/pages/LearningHub.jsx)
- Courses display pricing information
- Free courses: "Enroll Now - Free"
- Paid courses: "Enroll Now - Pay ₹{price}"
- Discounted courses show strikethrough original price

### Step 2: User Clicks Enroll
- **Function**: `handleEnrollCourse(courseId, isPaid)`
- For **FREE courses**: Direct enrollment via `/api/learning/courses/enroll`
- For **PAID courses**: Triggers payment flow via `handleCoursePayment(courseId)`

### Step 3: Create Payment Order
- **Backend Route**: `POST /api/learning/courses/create-payment-order`
- **Controller**: `learningController.createCoursePaymentOrder`
- **Logic**:
  1. Validates course exists and is paid
  2. Checks user not already enrolled
  3. Calculates amount (discount if valid)
  4. Creates Razorpay order
  5. Returns order details + Razorpay key

### Step 4: Frontend Opens Razorpay Checkout
- **Function**: `handleCoursePayment(courseId)`
- **Process**:
  1. Loads Razorpay SDK dynamically if not present
  2. Configures payment options:
     - Order ID from backend
     - Amount and currency
     - User prefill data
     - Success/failure handlers
  3. Opens Razorpay modal

### Step 5: User Completes Payment
- User enters card/UPI/netbanking details
- Razorpay processes payment
- On success: Calls `handler` function with:
  - `razorpay_order_id`
  - `razorpay_payment_id`
  - `razorpay_signature`

### Step 6: Verify Payment & Enroll
- **Backend Route**: `POST /api/learning/courses/verify-payment`
- **Controller**: `learningController.verifyCoursePayment`
- **Logic**:
  1. Verifies Razorpay signature using HMAC SHA256
  2. Validates signature matches order+payment IDs
  3. Creates CourseProgress with payment details
  4. Increments course enrollment count
  5. Returns success response

### Step 7: Redirect to Course
- Frontend shows success toast
- Navigates user to course page
- User can now access all course content

## API Endpoints

### Create Payment Order
```http
POST /api/learning/courses/create-payment-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "65abc123..."
}

Response:
{
  "orderId": "order_ABC123",
  "amount": 999,
  "currency": "INR",
  "courseName": "Complete Web Development",
  "razorpayKey": "rzp_test_..."
}
```

### Verify Payment
```http
POST /api/learning/courses/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpayOrderId": "order_ABC123",
  "razorpayPaymentId": "pay_XYZ789",
  "razorpaySignature": "abc123...",
  "courseId": "65abc123..."
}

Response:
{
  "message": "Payment verified and enrolled successfully",
  "courseProgress": { ... }
}
```

### Enroll in Free Course
```http
POST /api/learning/courses/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "65abc123..."
}

Response:
{
  "message": "Successfully enrolled",
  "progress": { ... }
}
```

## Environment Variables Required

### Backend (.env)
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## Security Features

1. **Signature Verification**
   - HMAC SHA256 signature verification prevents payment tampering
   - Formula: `HMAC_SHA256(order_id + "|" + payment_id, secret_key)`

2. **Token Authentication**
   - All payment endpoints require valid JWT token
   - User identity verified before creating orders

3. **Double Enrollment Prevention**
   - Backend checks existing CourseProgress before payment
   - Prevents duplicate charges

4. **Amount Validation**
   - Payment amount calculated server-side
   - Frontend cannot manipulate pricing

## Frontend UI Components

### Price Display
```jsx
<div className="course-price">
  {discountActive ? (
    <>
      <span className="original-price">₹{originalPrice}</span>
      <span className="discount-price">₹{discountPrice}</span>
    </>
  ) : (
    <span className="price">₹{price}</span>
  )}
</div>
```

### Enroll Button
```jsx
<button 
  className="enroll-btn"
  onClick={() => handleEnrollCourse(courseId, isPaid)}
>
  {isPaid 
    ? `Enroll Now - Pay ₹${finalPrice}` 
    : 'Enroll Now - Free'
  }
</button>
```

## CSS Classes Added

- `.course-price` - Container for price display
- `.price` - Regular price (green)
- `.original-price` - Strikethrough original price (gray)
- `.discount-price` - Discounted price (red)

## Testing Checklist

### Admin Testing
- ✅ Create free course
- ✅ Create paid course with price
- ✅ Create paid course with discount
- ✅ Upload course thumbnail
- ✅ Upload instructor photo

### Student Testing - Free Course
- ✅ Browse courses shows "Free" label
- ✅ Click enroll on free course
- ✅ Immediate enrollment without payment
- ✅ Redirect to course page
- ✅ Course shows as enrolled in browse

### Student Testing - Paid Course
- ✅ Browse courses shows price
- ✅ Discounted price shows with strikethrough
- ✅ Click enroll opens Razorpay modal
- ✅ Complete payment with test card
- ✅ Payment success enrolls user
- ✅ Redirect to course page
- ✅ Course shows as enrolled

### Test Cards (Razorpay Test Mode)
```
Success: 4111 1111 1111 1111
         CVV: Any 3 digits
         Expiry: Any future date

Failure: 4000 0000 0000 0002
         (Use to test failed payments)
```

## Error Handling

### Payment Errors
- Order creation fails → Toast error shown
- Payment cancelled → "Payment cancelled" toast
- Verification fails → "Payment verification failed" error
- Already enrolled → "Already enrolled" message

### Network Errors
- Razorpay SDK load failure → Retries or shows error
- Backend API errors → Logged and displayed to user
- Token expiry → Redirects to login

## Files Modified

### Backend
1. `models/Course.js` - Added pricing fields
2. `models/CourseProgress.js` - Added payment tracking
3. `controllers/learningController.js` - Added payment functions
4. `routes/learningRoutes.js` - Added payment routes
5. `routes/uploadRoutes.js` - Added image upload routes

### Frontend
1. `components/AdminCreateCourse.jsx` - File uploads + pricing form
2. `components/AdminCreateCourse.css` - Upload and price styles
3. `pages/LearningHub.jsx` - Payment integration
4. `pages/LearningHub.css` - Price display styles

## Integration with Existing Features

### Enrollment Status Display
- Already implemented enrollment checking works seamlessly
- Paid courses show "✓ Enrolled" after payment
- Free courses show "✓ Enrolled" after direct enrollment

### Course Access
- `enrollCourse` function checks payment for paid courses
- Prevents enrollment without payment
- Returns `requiresPayment: true` for paid courses without payment

### Learning Paths
- Learning paths remain free (separate feature)
- Individual courses within paths can be paid
- Path enrollment doesn't bypass course payments

## Future Enhancements

1. **Subscription Model**
   - Monthly/yearly subscription for unlimited access
   - Separate pricing tier

2. **Coupon Codes**
   - Admin creates coupon codes
   - Students apply at checkout
   - Additional discount on top of course discount

3. **Payment History**
   - Student dashboard showing all payments
   - Download invoices
   - Refund requests

4. **Bulk Purchase**
   - Employer purchases courses for employees
   - Organization billing

5. **Payment Analytics**
   - Admin dashboard showing revenue
   - Course-wise earnings
   - Payment success/failure rates

## Troubleshooting

### Razorpay Key Not Working
- Verify `RAZORPAY_KEY_ID` in backend .env
- Check test mode vs live mode keys
- Ensure key is active in Razorpay dashboard

### Payment Verification Fails
- Check `RAZORPAY_KEY_SECRET` is correct
- Verify signature calculation matches Razorpay docs
- Check backend logs for signature mismatch details

### Razorpay Modal Not Opening
- Check browser console for script load errors
- Verify HTTPS in production (Razorpay requires HTTPS)
- Check popup blockers

### Duplicate Enrollments
- Backend prevents this with CourseProgress check
- If occurring, check database for orphaned records

## Support

For issues or questions:
1. Check backend logs for detailed error messages
2. Use Razorpay dashboard to track payments
3. Test with Razorpay test cards before going live
4. Contact Razorpay support for payment gateway issues

---

**Implementation Date**: December 2024  
**Payment Gateway**: Razorpay  
**Status**: ✅ Complete and Ready for Testing
