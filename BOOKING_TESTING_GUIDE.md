# Quick Testing Guide - Booking & Payment Flow

## Prerequisites
- Backend server running on port 5000
- Frontend server running on port 3000
- User account created and logged in
- At least one approved mentor with:
  - Session types created (both FREE and PAID)
  - Availability set up

## Test Scenario 1: FREE Session Booking

### Steps:
1. Navigate to `/mentors`
2. Click on any mentor card
3. On mentor profile, click "Book Session" button
4. **Step 1:** Select a FREE session type (shows "FREE" badge)
5. **Step 2:** Select a date (tomorrow or later)
6. Click "Continue"
7. **Step 3:** Select an available time slot
8. **Step 4:** Review booking details
9. (Optional) Add notes in the text area
10. Click "Confirm Booking"

### Expected Result:
- ✅ Redirected to `/sessions/:sessionId/confirmation`
- ✅ Success animation appears
- ✅ Session details displayed
- ✅ Shows "FREE" amount
- ✅ No payment information shown
- ✅ Session status: "scheduled"

## Test Scenario 2: PAID Session Booking

### Steps:
1. Navigate to `/mentors`
2. Click on any mentor card
3. On mentor profile, click "Book Session" button
4. **Step 1:** Select a PAID session type (shows price in ₹)
5. **Step 2:** Select a date (tomorrow or later)
6. Click "Continue"
7. **Step 3:** Select an available time slot
8. **Step 4:** Review booking details
9. (Optional) Add notes
10. Click "Proceed to Payment"

### Expected Result - Payment Page:
- ✅ Redirected to `/sessions/:sessionId/payment`
- ✅ Session summary displayed
- ✅ Amount shown correctly
- ✅ "Mock Payment Mode" badge visible
- ✅ Order ID generated
- ✅ "Simulate Payment Success" button visible

### Continue Payment:
11. Click "Simulate Payment Success"
12. Wait 2 seconds (simulated processing)

### Expected Result - Confirmation:
- ✅ Redirected to `/sessions/:sessionId/confirmation`
- ✅ Success animation appears
- ✅ Session details displayed
- ✅ Shows paid amount
- ✅ Payment success badge visible
- ✅ Payment ID displayed
- ✅ Session status: "scheduled"

## Test Scenario 3: View My Sessions

### Steps:
1. Navigate to `/my-sessions`
2. View all booked sessions

### Expected Result:
- ✅ All booked sessions displayed
- ✅ Filter tabs work (All, Upcoming, Past, Cancelled)
- ✅ Each session card shows:
  - Mentor name and photo
  - Session type
  - Date and time
  - Duration
  - Amount (FREE or ₹X)
  - Status badge
  - "Paid" badge for paid sessions
- ✅ "View Details" button works
- ✅ "Cancel" button visible for upcoming sessions

## Test Scenario 4: Cancel Session

### Steps:
1. Go to `/my-sessions`
2. Find an upcoming session
3. Click "Cancel" button
4. Confirm cancellation in dialog
5. (Optional) Provide cancellation reason

### Expected Result:
- ✅ Confirmation dialog appears
- ✅ Session status updated to "cancelled"
- ✅ Session moves to "Cancelled" filter
- ✅ "Cancel" button no longer visible
- ✅ Success message shown

## Test Scenario 5: Validation Tests

### Test 5.1: Unavailable Day
1. Start booking flow
2. Select a session type
3. Select a date where mentor has no availability
4. Try to select time slot

**Expected:** No time slots shown, message: "No available slots for this date"

### Test 5.2: Double Booking Prevention
1. Book a session for a specific date/time
2. Try to book another session for the same mentor, date, and time

**Expected:** Error message: "This time slot is already booked"

### Test 5.3: Authentication Required
1. Log out
2. Try to access `/mentors/:id/book`

**Expected:** Redirected to login page

### Test 5.4: Payment Page for FREE Session
1. Book a FREE session
2. Try to manually navigate to `/sessions/:sessionId/payment`

**Expected:** Redirected to confirmation page with message

## Test Scenario 6: Edge Cases

### Test 6.1: Past Date Booking
1. Try to select a date in the past

**Expected:** Date picker prevents past dates (min date is tomorrow)

### Test 6.2: Cancel Past Session
1. Go to a completed/past session
2. Look for cancel button

**Expected:** No cancel button visible

### Test 6.3: View Session Details
1. From "My Sessions", click "View Details"

**Expected:** 
- ✅ Redirected to confirmation page
- ✅ All session details visible
- ✅ Payment info shown if paid

## API Testing (Optional - Using Postman/Thunder Client)

### 1. Book FREE Session
```
POST http://localhost:5000/api/sessions/book
Headers: Authorization: Bearer <user_token>
Body: {
  "mentorId": "mentor_id_here",
  "sessionTypeId": "session_type_id_here",
  "scheduledDate": "2025-12-25",
  "scheduledTime": "10:00 AM - 11:00 AM",
  "notes": "Test booking"
}
```

### 2. Get My Bookings
```
GET http://localhost:5000/api/sessions/my-bookings
Headers: Authorization: Bearer <user_token>
```

### 3. Create Payment Order
```
POST http://localhost:5000/api/session-payments/create
Headers: Authorization: Bearer <user_token>
Body: {
  "sessionId": "session_id_here"
}
```

### 4. Verify Payment
```
POST http://localhost:5000/api/session-payments/verify
Headers: Authorization: Bearer <user_token>
Body: {
  "sessionId": "session_id_here",
  "orderId": "order_id_from_create",
  "paymentMode": "mock"
}
```

## Common Issues & Solutions

### Issue 1: "Mentor not available"
**Solution:** Ensure mentor has availability set for the selected day

### Issue 2: "No time slots shown"
**Solution:** 
- Check mentor's availability in their profile
- Ensure you selected a day they're available
- Verify time slots are added for that day

### Issue 3: "Session not found"
**Solution:** Ensure you're logged in as the user who booked the session

### Issue 4: Payment page not loading
**Solution:** 
- Check if session exists
- Verify session is not already paid
- Ensure session amount > 0

### Issue 5: Cannot cancel session
**Solution:** 
- Check if session is in the future
- Verify session status is "scheduled"
- Ensure you're the user who booked it

## Browser Console Checks

Open browser console (F12) and check for:
- ✅ No 404 errors
- ✅ No 401 unauthorized errors
- ✅ API calls returning 200/201 status
- ✅ No CORS errors
- ✅ Session data being populated correctly

## Database Verification (MongoDB)

After booking, check `mentorsessions` collection:
```javascript
// FREE session
{
  paymentStatus: "free",
  paymentMode: "none",
  sessionStatus: "scheduled",
  amount: 0
}

// PAID session (after payment)
{
  paymentStatus: "paid",
  paymentMode: "mock",
  paymentId: "PAY-XXXXXXXX",
  sessionStatus: "scheduled",
  amount: 500
}
```

## Success Indicators

### Visual Indicators:
- ✅ Smooth step transitions in booking flow
- ✅ Loading spinners during API calls
- ✅ Success animations on confirmation
- ✅ Toast notifications for errors
- ✅ Responsive design on mobile

### Functional Indicators:
- ✅ All API calls succeed
- ✅ Data persists in database
- ✅ Sessions appear in "My Sessions"
- ✅ Payment flow completes without errors
- ✅ Validation prevents invalid bookings

## Performance Checks

- ✅ Page loads in < 2 seconds
- ✅ API responses in < 500ms
- ✅ No memory leaks
- ✅ Smooth animations
- ✅ No layout shifts

---

## Quick Test Checklist

- [ ] FREE session booking works
- [ ] PAID session booking works
- [ ] Payment simulation works
- [ ] Confirmation page shows correct data
- [ ] My Sessions page displays all bookings
- [ ] Filtering works (All, Upcoming, Past, Cancelled)
- [ ] Session cancellation works
- [ ] Validation prevents invalid bookings
- [ ] Authentication is enforced
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Database records are correct

---

**Happy Testing! 🚀**

If you encounter any issues, check the browser console and network tab for detailed error messages.
