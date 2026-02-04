# Course Payment - Quick Reference

## Quick Start

### For Admin - Creating Paid Course

1. Go to Admin Dashboard → Create Course
2. Fill course details (title, description, etc.)
3. **Upload Images**:
   - Course Thumbnail: Click "Choose File" → Select image
   - Instructor Photo: Click "Choose File" → Select image
4. **Set Pricing**:
   - Check "Paid Course" checkbox
   - Enter price (e.g., 999)
   - (Optional) Enter discount price (e.g., 499)
   - (Optional) Set discount end date
5. Click "Create Course"

### For Students - Enrolling in Courses

**FREE Course:**
1. Browse courses
2. Click "Enroll Now - Free"
3. Instant enrollment → Redirect to course

**PAID Course:**
1. Browse courses → See price
2. Click "Enroll Now - Pay ₹999"
3. Razorpay modal opens
4. Complete payment (test card: 4111 1111 1111 1111)
5. Success → Enrolled → Redirect to course

## API Quick Reference

### Create Payment Order
```javascript
POST /api/learning/courses/create-payment-order
Body: { courseId }
Returns: { orderId, amount, currency, razorpayKey }
```

### Verify Payment
```javascript
POST /api/learning/courses/verify-payment
Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId }
Returns: { message, courseProgress }
```

### Enroll Free Course
```javascript
POST /api/learning/courses/enroll
Body: { courseId }
Returns: { message, progress }
```

## Models Quick Reference

### Course Schema (Pricing Fields)
```javascript
{
  isPaid: Boolean,
  price: Number,
  currency: String,      // default: 'INR'
  discountPrice: Number,
  discountEndDate: Date
}
```

### CourseProgress Schema (Payment Fields)
```javascript
{
  isPaid: Boolean,
  paymentAmount: Number,
  paymentCurrency: String,
  paymentId: String,
  paymentStatus: String,  // 'pending', 'completed', 'failed'
  paidAt: Date
}
```

## Environment Variables

```env
# Backend
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

## Test Cards (Razorpay Test Mode)

✅ **Success**: 4111 1111 1111 1111  
❌ **Failure**: 4000 0000 0000 0002  
CVV: Any 3 digits | Expiry: Any future date

## Code Snippets

### Payment Handler (Frontend)
```javascript
const handleCoursePayment = async (courseId) => {
  // 1. Create order
  const { data } = await axios.post('/api/learning/courses/create-payment-order', { courseId });
  
  // 2. Open Razorpay
  const options = {
    key: data.razorpayKey,
    amount: data.amount * 100,
    order_id: data.orderId,
    handler: async (response) => {
      // 3. Verify payment
      await axios.post('/api/learning/courses/verify-payment', {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        courseId
      });
    }
  };
  new window.Razorpay(options).open();
};
```

### Signature Verification (Backend)
```javascript
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (expectedSignature !== razorpaySignature) {
  return res.status(400).json({ message: 'Payment verification failed' });
}
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Razorpay modal not opening | Check browser console, verify HTTPS in production |
| Payment verification fails | Check `RAZORPAY_KEY_SECRET` in .env |
| Duplicate enrollments | Already prevented in backend |
| "Already enrolled" error | User has already paid/enrolled |

## File Locations

**Backend:**
- Models: `models/Course.js`, `models/CourseProgress.js`
- Controller: `controllers/learningController.js` (lines 1211-1341)
- Routes: `routes/learningRoutes.js` (lines 22-23)

**Frontend:**
- Payment UI: `pages/LearningHub.jsx` (handleCoursePayment function)
- Admin Form: `components/AdminCreateCourse.jsx`
- Styles: `pages/LearningHub.css` (.course-price styles)

## Payment Flow Diagram

```
User Clicks Enroll
       ↓
  Is Paid Course?
     ↙     ↘
   No      Yes
    ↓       ↓
Enroll   Create Order
Direct      ↓
           Open Razorpay
              ↓
          User Pays
              ↓
        Verify Signature
              ↓
          Create Enrollment
              ↓
         Redirect to Course
```

## Feature Checklist

✅ Admin can set course as paid/free  
✅ Admin can upload course thumbnail  
✅ Admin can upload instructor photo  
✅ Admin can set discount price with expiry  
✅ Students see pricing on course cards  
✅ Free courses enroll instantly  
✅ Paid courses open Razorpay checkout  
✅ Payment verification with signature  
✅ Enrollment created after successful payment  
✅ Enrolled courses show "✓ Enrolled" status  
✅ Duplicate enrollment prevention  
✅ Error handling and toast notifications  

---

**For detailed documentation, see**: [COURSE_PAYMENT_INTEGRATION.md](COURSE_PAYMENT_INTEGRATION.md)
