# Razorpay Integration for Session Payments

## Overview
The session booking and payment system now uses **real Razorpay integration** for processing payments. This replaces the mock payment system with actual payment gateway functionality.

## What Changed

### Backend Updates

#### 1. Session Payment Controller (`controllers/sessionPaymentController.js`)
**Updated to use Razorpay SDK:**

```javascript
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    // ... validation and initialization
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
```

**Key Changes:**
- ✅ Real Razorpay order creation
- ✅ Signature verification using HMAC SHA256
- ✅ Proper error handling
- ✅ Payment status tracking

#### 2. Create Payment Order
```javascript
POST /api/session-payments/create
```

**Request:**
```json
{
  "sessionId": "session_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_XXXXXXXXXXXXX",
    "amount": 500,
    "currency": "INR",
    "sessionId": "SESSION-ABC123",
    "sessionTitle": "Mock Interview",
    "paymentMode": "razorpay",
    "razorpayKeyId": "rzp_test_XXXXXXXXXX"
  }
}
```

#### 3. Verify Payment
```javascript
POST /api/session-payments/verify
```

**Request:**
```json
{
  "sessionId": "session_id_here",
  "razorpay_order_id": "order_XXXXXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXXXXX",
  "razorpay_signature": "signature_hash"
}
```

**Signature Verification:**
```javascript
const body = `${razorpay_order_id}|${razorpay_payment_id}`;
const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

if (expectedSignature !== razorpay_signature) {
    // Payment verification failed
}
```

### Frontend Updates

#### 1. Payment Page (`pages/PaymentPage.jsx`)
**Updated to use Razorpay Checkout:**

**Key Features:**
- ✅ Loads Razorpay script dynamically
- ✅ Opens Razorpay checkout modal
- ✅ Handles payment success/failure
- ✅ Verifies payment with backend
- ✅ Prefills user details

**Razorpay Script Loading:**
```javascript
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
```

**Razorpay Checkout Options:**
```javascript
const options = {
    key: paymentOrder.razorpayKeyId,
    amount: paymentOrder.amount * 100, // Amount in paise
    currency: paymentOrder.currency,
    name: "JobZee - Mentor Session",
    description: paymentOrder.sessionTitle,
    order_id: paymentOrder.orderId,
    prefill: {
        name: "User Name",
        email: "user@example.com",
        contact: "9999999999"
    },
    theme: {
        color: "#667eea"
    },
    handler: async function (response) {
        // Verify payment with backend
    },
    modal: {
        ondismiss: function () {
            // Handle payment cancellation
        }
    }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

#### 2. Updated UI Elements
- **Payment Button:** Changed from "Simulate Payment" to "Pay with Razorpay"
- **Payment Info:** Shows secure payment message instead of test mode warning
- **Payment Methods:** Displays accepted payment methods (Cards, UPI, Net Banking, Wallets)
- **Security Badge:** Shows 256-bit SSL encryption message

## Environment Variables Required

### Backend (.env)
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Testing the Integration

### Test Mode (Recommended for Development)
1. Use Razorpay Test Keys (starts with `rzp_test_`)
2. Use test card numbers provided by Razorpay
3. No real money is charged

### Razorpay Test Cards
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

### Test UPI
```
UPI ID: success@razorpay
```

### Test Net Banking
- Select any bank
- Use credentials: `test@razorpay` / `test123`

## Payment Flow

### 1. User Initiates Payment
```
User clicks "Pay with Razorpay"
  ↓
Frontend loads Razorpay script
  ↓
Frontend calls /api/session-payments/create
  ↓
Backend creates Razorpay order
  ↓
Backend returns order details
```

### 2. Razorpay Checkout Opens
```
Frontend opens Razorpay modal
  ↓
User selects payment method
  ↓
User completes payment
  ↓
Razorpay processes payment
```

### 3. Payment Verification
```
Razorpay returns payment details
  ↓
Frontend calls /api/session-payments/verify
  ↓
Backend verifies signature
  ↓
Backend updates session status
  ↓
User redirected to confirmation page
```

## Security Features

### 1. Signature Verification
- **HMAC SHA256** signature verification
- Prevents payment tampering
- Ensures payment authenticity

### 2. Server-Side Validation
- All payment verification happens on backend
- Frontend cannot manipulate payment status
- Session status updated only after verification

### 3. SSL Encryption
- All communication encrypted with HTTPS
- Razorpay uses 256-bit SSL
- PCI DSS compliant

## Error Handling

### Common Errors and Solutions

#### 1. "Razorpay keys are not configured"
**Solution:** Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`

#### 2. "Failed to load Razorpay"
**Solution:** Check internet connection, Razorpay script might be blocked

#### 3. "Payment verification failed"
**Solution:** 
- Check if Razorpay webhook secret is correct
- Verify signature calculation
- Check server logs for detailed error

#### 4. "Invalid signature"
**Solution:**
- Ensure `RAZORPAY_KEY_SECRET` matches the one in Razorpay dashboard
- Check if order_id and payment_id are correct

## Production Deployment

### 1. Get Production Keys
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate Live Keys (starts with `rzp_live_`)
4. Copy Key ID and Key Secret

### 2. Update Environment Variables
```env
# Production Keys
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Enable Webhooks (Optional but Recommended)
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events: `payment.authorized`, `payment.failed`
4. Copy webhook secret

### 4. KYC Verification
- Complete KYC on Razorpay
- Add bank account details
- Verify business documents
- Required for live payments

## Webhook Integration (Future Enhancement)

### Why Webhooks?
- Real-time payment notifications
- Handle edge cases (network failures)
- Automatic payment reconciliation

### Webhook Endpoint (To be implemented)
```javascript
POST /api/webhooks/razorpay

// Verify webhook signature
const webhookSignature = req.headers['x-razorpay-signature'];
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

if (expectedSignature === webhookSignature) {
    // Process webhook event
}
```

## Comparison: Mock vs Razorpay

| Feature | Mock Payment | Razorpay Integration |
|---------|-------------|---------------------|
| Real Money | ❌ No | ✅ Yes (in live mode) |
| Payment Gateway | ❌ Simulated | ✅ Real (Razorpay) |
| Payment Methods | ❌ None | ✅ Cards, UPI, Net Banking, Wallets |
| Security | ⚠️ Basic | ✅ PCI DSS Compliant |
| Signature Verification | ❌ No | ✅ Yes (HMAC SHA256) |
| Production Ready | ❌ No | ✅ Yes |
| College Safe | ✅ Yes | ✅ Yes (Test Mode) |
| Integration Effort | ✅ Low | ⚠️ Medium |

## Testing Checklist

### Development (Test Mode)
- [ ] Payment order creation works
- [ ] Razorpay modal opens correctly
- [ ] Test card payment succeeds
- [ ] Payment verification works
- [ ] Session status updates to "paid"
- [ ] User redirected to confirmation
- [ ] Payment cancellation handled
- [ ] Error messages displayed correctly

### Production (Live Mode)
- [ ] Live keys configured
- [ ] KYC completed on Razorpay
- [ ] Bank account added
- [ ] Real payment succeeds
- [ ] Money received in Razorpay account
- [ ] Settlement working correctly
- [ ] Refunds working (if applicable)

## Support and Resources

### Razorpay Documentation
- [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
- [Payment Verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/verify-payment/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Razorpay Dashboard
- [Dashboard](https://dashboard.razorpay.com/)
- [API Keys](https://dashboard.razorpay.com/app/keys)
- [Webhooks](https://dashboard.razorpay.com/app/webhooks)
- [Settlements](https://dashboard.razorpay.com/app/settlements)

### Contact
- Razorpay Support: support@razorpay.com
- Documentation: https://razorpay.com/docs/

## Troubleshooting

### Issue: Payment succeeds but session not confirmed
**Check:**
1. Backend logs for verification errors
2. Signature verification logic
3. Database connection
4. Session update query

### Issue: Razorpay modal not opening
**Check:**
1. Razorpay script loaded successfully
2. Browser console for errors
3. Razorpay key ID is correct
4. No ad blockers interfering

### Issue: "Invalid key" error
**Check:**
1. Key ID format (should start with `rzp_test_` or `rzp_live_`)
2. Key copied correctly (no extra spaces)
3. Environment variables loaded
4. Using correct environment (test/live)

---

## Summary

✅ **Real Razorpay integration implemented**
✅ **Secure payment processing with signature verification**
✅ **Support for multiple payment methods**
✅ **Test mode available for development**
✅ **Production-ready architecture**
✅ **College-safe with test keys**

The session booking system now uses professional-grade payment processing while remaining safe for college projects through Razorpay's test mode!
