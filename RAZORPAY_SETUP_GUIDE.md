# Quick Setup Guide - Razorpay Integration

## Prerequisites
- Razorpay account (Sign up at https://razorpay.com/)
- Node.js and npm installed
- MongoDB running
- Backend and frontend servers

## Step 1: Get Razorpay Keys

### For Testing (Recommended)
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key** (if not already generated)
4. Copy **Key ID** (starts with `rzp_test_`)
5. Click **Show** next to Key Secret and copy it

### For Production (Later)
1. Complete KYC verification
2. Add bank account details
3. Generate **Live Keys** (starts with `rzp_live_`)

## Step 2: Configure Backend

### Update `.env` file
```env
# Add these lines to jobzee-backend/.env

# Razorpay Test Keys (for development)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Important:** Replace the X's with your actual keys from Razorpay dashboard

### Verify Razorpay Package
The `razorpay` package is already installed. Verify in `package.json`:
```json
{
  "dependencies": {
    "razorpay": "^2.9.6"
  }
}
```

## Step 3: Test the Integration

### Start Backend Server
```bash
cd jobzee-backend
npm start
```

### Start Frontend Server
```bash
cd jobzee-frontend
npm start
```

### Test Payment Flow
1. Navigate to http://localhost:3000
2. Login as a user
3. Go to `/mentors`
4. Click on a mentor
5. Click "Book Session"
6. Select a **PAID** session type
7. Choose date and time
8. Click "Proceed to Payment"
9. Click "Pay with Razorpay"
10. Razorpay modal should open

### Use Test Payment Details

#### Test Card
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
Name: Test User
```

#### Test UPI
```
UPI ID: success@razorpay
```

#### Test Net Banking
```
Select any bank
Username: test@razorpay
Password: test123
```

## Step 4: Verify Payment

### Check Backend Logs
You should see:
```
✓ Razorpay order created successfully
✓ Payment verified successfully
✓ Session status updated to 'paid'
```

### Check Frontend
1. Payment success message appears
2. Redirected to confirmation page
3. Session details displayed
4. Payment ID shown

### Check Database
```javascript
// In MongoDB, check mentorsessions collection
{
  paymentStatus: "paid",
  paymentMode: "razorpay",
  paymentId: "pay_XXXXXXXXXXXXX",
  sessionStatus: "scheduled"
}
```

## Step 5: Common Issues & Solutions

### Issue 1: "Razorpay keys are not configured"
**Solution:**
- Check if `.env` file exists in `jobzee-backend`
- Verify keys are copied correctly (no extra spaces)
- Restart backend server after adding keys

### Issue 2: Razorpay modal not opening
**Solution:**
- Check browser console for errors
- Disable ad blockers
- Check internet connection
- Verify Razorpay script loaded (check Network tab)

### Issue 3: Payment verification failed
**Solution:**
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check backend logs for detailed error
- Verify signature calculation

### Issue 4: "Invalid key" error
**Solution:**
- Ensure key starts with `rzp_test_` (for test mode)
- Copy key again from Razorpay dashboard
- Check for typos

## Step 6: Switch to Production (When Ready)

### 1. Complete KYC
- Login to Razorpay Dashboard
- Go to **Account & Settings** → **KYC**
- Submit required documents
- Wait for approval (usually 24-48 hours)

### 2. Add Bank Account
- Go to **Settings** → **Bank Accounts**
- Add your bank account details
- Verify with micro-deposit

### 3. Generate Live Keys
- Go to **Settings** → **API Keys**
- Click **Generate Live Key**
- Copy Key ID and Secret

### 4. Update Environment Variables
```env
# Production Keys
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 5. Test with Small Amount
- Make a real payment of ₹1
- Verify money received in Razorpay account
- Check settlement timeline

## Quick Reference

### Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Key Prefix | `rzp_test_` | `rzp_live_` |
| Real Money | ❌ No | ✅ Yes |
| KYC Required | ❌ No | ✅ Yes |
| Bank Account | ❌ No | ✅ Yes |
| Test Cards | ✅ Yes | ❌ No |

### Environment Variables Checklist
- [ ] `RAZORPAY_KEY_ID` set in `.env`
- [ ] `RAZORPAY_KEY_SECRET` set in `.env`
- [ ] Backend server restarted after adding keys
- [ ] Keys match the mode (test/live)

### Payment Flow Checklist
- [ ] User can navigate to booking page
- [ ] Session types displayed correctly
- [ ] Date and time selection works
- [ ] Payment page loads
- [ ] Razorpay modal opens
- [ ] Test payment succeeds
- [ ] Payment verified on backend
- [ ] Session status updated
- [ ] Confirmation page displayed

## Support

### Razorpay Support
- Email: support@razorpay.com
- Phone: +91-80-61159600
- Dashboard: https://dashboard.razorpay.com/

### Documentation
- Integration Guide: https://razorpay.com/docs/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
- API Reference: https://razorpay.com/docs/api/

## Next Steps

1. ✅ **Test thoroughly** with test keys
2. ✅ **Complete KYC** when ready for production
3. ✅ **Add bank account** for settlements
4. ✅ **Switch to live keys** for real payments
5. ✅ **Monitor transactions** in Razorpay dashboard
6. ✅ **Set up webhooks** for automatic updates (optional)

---

**You're all set!** 🎉

The Razorpay integration is now complete and ready to use. Start with test mode for development and switch to live mode when you're ready to accept real payments.

For any issues, check the `RAZORPAY_INTEGRATION.md` file for detailed troubleshooting.
