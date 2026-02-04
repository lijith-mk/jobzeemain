# Invoice System - Quick Reference

## What's New

✅ **Automatic invoice generation** after successful course payment  
✅ **Invoice management page** to view all invoices  
✅ **Download/Print functionality** for invoices  
✅ **18% GST calculation** included automatically  
✅ **Unique invoice numbers** (Format: CINV-202602-0001)

## How It Works

### After Payment
1. User completes Razorpay payment
2. System verifies payment signature
3. **Invoice auto-generated** with all details
4. Invoice number shown in success message
5. User can view invoice in "My Invoices" page

### Invoice Details Include
- Invoice number
- Course name and details
- Original price, discount, subtotal
- Tax (18% GST)
- Total amount paid
- Payment IDs (Razorpay)
- Billing information
- Transaction date

## API Endpoints

```javascript
// Get all user invoices
GET /api/learning/invoices

// Get specific invoice by ID
GET /api/learning/invoices/:invoiceId

// Get invoice by invoice number
GET /api/learning/invoices/number/:invoiceNumber
```

## Frontend Usage

### Route Setup
Add to your App.js router:
```javascript
import MyInvoices from './pages/MyInvoices';

<Route path="/my-invoices" element={<MyInvoices />} />
```

### Navigation
Link from user dashboard/profile:
```javascript
<Link to="/my-invoices">My Invoices</Link>
```

## Invoice Features

### List View
- Grid of invoice cards
- Course thumbnail
- Invoice number & date
- Total amount
- Status badge
- View/Download buttons

### Detail View (Modal)
- Complete course info
- Billing details
- Payment breakdown
- Download button

### Print/Download
- Formatted HTML invoice
- Professional layout
- Opens in new window
- Ready to print or save as PDF

## Example Invoice

```
JOBZEE LEARNING
INVOICE
CINV-202602-0023

Date: Feb 4, 2026
Payment ID: pay_ABC123XYZ

Bill To:
John Doe
john@example.com
9876543210

Description                Amount
Complete Web Development   ₹999.00
Discount                   -₹500.00
Subtotal                   ₹499.00
Tax (18%)                  ₹89.82
Total Amount               ₹588.82
```

## Database Schema

```javascript
CourseInvoice {
  invoiceNumber: "CINV-202602-0023",
  userId: ObjectId,
  courseId: ObjectId,
  courseName: String,
  originalPrice: 999,
  discountAmount: 500,
  subtotal: 499,
  taxPercentage: 18,
  taxAmount: 89.82,
  totalAmount: 588.82,
  billingDetails: {
    name, email, phone
  },
  razorpayPaymentId: String,
  status: "issued"
}
```

## Files Modified

**Backend:**
- `models/CourseInvoice.js` - New invoice model
- `controllers/learningController.js` - Invoice generation & APIs
- `routes/learningRoutes.js` - Invoice routes

**Frontend:**
- `pages/MyInvoices.jsx` - Invoice management page
- `pages/MyInvoices.css` - Invoice styling
- `pages/LearningHub.jsx` - Shows invoice number after payment

## Testing

1. ✅ Purchase a paid course
2. ✅ Complete Razorpay payment
3. ✅ See invoice number in success message
4. ✅ Navigate to "My Invoices" page
5. ✅ View invoice details
6. ✅ Download/print invoice

## Key Features

- **Auto-generation**: No manual invoice creation needed
- **Unique numbers**: Sequential invoice numbers per month
- **Tax included**: 18% GST calculated automatically
- **Print-ready**: Professional invoice format
- **User-friendly**: Easy to view and download
- **Secure**: Only user can access their own invoices

---

**Status**: ✅ Ready to Use!
