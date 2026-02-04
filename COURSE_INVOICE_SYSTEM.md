# Course Invoice System Documentation

## Overview
Automatic invoice generation system for paid course purchases with invoice management and download capabilities.

## Features Implemented

### 1. **Invoice Model** (`CourseInvoice.js`)
- Separate model from employer subscription invoices
- Auto-generates unique invoice numbers (Format: `CINV-YYYYMM-0001`)
- Stores complete payment and billing details
- Calculates tax (18% GST) automatically
- Fields:
  - Invoice number, user, course details
  - Payment information (Razorpay IDs)
  - Pricing breakdown (original, discount, subtotal, tax, total)
  - Billing details (name, email, phone, address)
  - Status tracking (issued, void, refunded)

### 2. **Backend Implementation**

#### Invoice Generation (in `verifyCoursePayment`)
After successful payment verification:
1. Creates CourseProgress entry
2. Generates invoice with all transaction details
3. Includes user billing information
4. Returns invoice number and ID to frontend

#### API Endpoints
```javascript
GET  /api/learning/invoices                    // Get all user invoices
GET  /api/learning/invoices/:invoiceId         // Get specific invoice
GET  /api/learning/invoices/number/:invoiceNumber  // Get by invoice number
```

### 3. **Frontend Components**

#### MyInvoices Page (`MyInvoices.jsx`)
- Lists all user invoices in a grid
- Shows course thumbnail, name, date, amount
- Status badges (paid, pending, failed, refunded)
- View details modal
- Download/print functionality

#### Features:
- **Invoice List**: Grid view of all invoices
- **Invoice Details Modal**: 
  - Complete course information
  - Billing details
  - Payment breakdown (price, discount, tax, total)
  - Download button
- **Print/Download**: 
  - Generates formatted HTML invoice
  - Opens in new window for printing
  - Professional invoice layout

## Invoice Generation Flow

```
Payment Verification Success
       ↓
Get User Details
       ↓
Create CourseProgress
       ↓
Generate Invoice
   - Auto invoice number
   - Calculate tax (18%)
   - Store billing details
   - Link to payment
       ↓
Save Invoice to Database
       ↓
Return Invoice Info to Frontend
```

## Invoice Details

### Invoice Number Format
- **Pattern**: `CINV-YYYYMM-0001`
- **Example**: `CINV-202602-0023`
- C = Course Invoice
- YYYYMM = Year and Month
- 0001 = Sequential number for the month

### Tax Calculation
- **Default GST**: 18% (Indian tax)
- **Calculation**: `taxAmount = (subtotal × 18) / 100`
- **Total**: `subtotal + taxAmount`

### Billing Information Captured
- User name, email, phone
- Payment IDs (Razorpay)
- Course details
- Transaction date
- Payment status

## Usage Examples

### Accessing Invoices (Frontend)

```javascript
// Get all invoices
const { data } = await axios.get(
  `${API_URL}/api/learning/invoices`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// Get specific invoice
const { data } = await axios.get(
  `${API_URL}/api/learning/invoices/${invoiceId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Invoice Model Schema

```javascript
{
  invoiceNumber: "CINV-202602-0001",
  userId: ObjectId,
  courseId: ObjectId,
  courseName: "Complete Web Development",
  paymentId: "pay_ABC123",
  razorpayOrderId: "order_XYZ789",
  razorpayPaymentId: "pay_ABC123",
  originalPrice: 999,
  discountAmount: 500,
  subtotal: 499,
  taxPercentage: 18,
  taxAmount: 89.82,
  totalAmount: 588.82,
  currency: "INR",
  billingDetails: {
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210"
  },
  status: "issued"
}
```

## Frontend Routes

Add to your router:
```javascript
import MyInvoices from './pages/MyInvoices';

<Route path="/my-invoices" element={<MyInvoices />} />
```

## User Journey

1. **Purchase Course**: User completes Razorpay payment
2. **Auto Invoice**: System generates invoice automatically
3. **View Invoices**: Navigate to "My Invoices" page
4. **Download**: Click download to print/save PDF
5. **Email**: Invoice details sent with enrollment confirmation

## Invoice Display Features

### Invoice Card (List View)
- Course thumbnail
- Invoice number
- Status badge
- Total amount
- Date issued
- Action buttons

### Invoice Modal (Detail View)
- Complete course information
- Billing details
- Payment breakdown:
  - Original price
  - Discount (if applicable)
  - Subtotal
  - Tax (18%)
  - Total amount
- Payment ID
- Download button

### Print Format
Professional invoice layout with:
- Company header (Jobzee Learning)
- Invoice number and date
- Billing information
- Itemized pricing table
- Tax breakdown
- Total amount
- Footer with contact info

## Error Handling

### Backend Validation
- Validates user authentication
- Checks invoice ownership
- Handles missing invoices gracefully

### Frontend Error Messages
- "Failed to load invoices"
- "Failed to load invoice details"
- Clear user feedback with toast notifications

## Database Indexes

Optimized queries with indexes on:
- `userId` + `createdAt` (for user invoice list)
- `invoiceNumber` (unique, for lookup)
- `paymentId` (for payment tracking)
- `status` (for filtering)

## API Response Examples

### Get All Invoices
```json
{
  "invoices": [
    {
      "_id": "65abc123...",
      "invoiceNumber": "CINV-202602-0001",
      "courseName": "Web Development",
      "totalAmount": 588.82,
      "currency": "INR",
      "invoiceDate": "2026-02-04T10:30:00Z",
      "status": "issued",
      "courseId": {
        "title": "Complete Web Development",
        "thumbnail": "https://..."
      }
    }
  ],
  "totalPages": 1,
  "currentPage": 1,
  "total": 1
}
```

### Get Invoice Details
```json
{
  "invoice": {
    "invoiceNumber": "CINV-202602-0001",
    "originalPrice": 999,
    "discountAmount": 500,
    "subtotal": 499,
    "taxPercentage": 18,
    "taxAmount": 89.82,
    "totalAmount": 588.82,
    "billingDetails": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "razorpayPaymentId": "pay_ABC123",
    "status": "issued"
  }
}
```

## Future Enhancements

1. **PDF Generation**: Server-side PDF with libraries like PDFKit
2. **Email Invoices**: Auto-send via email after payment
3. **GST Details**: Add GST number field for businesses
4. **Invoice Export**: Bulk export to Excel/CSV
5. **Refund Management**: Handle refunded invoice status
6. **Custom Templates**: Multiple invoice template designs

## Files Created/Modified

### Backend
- ✅ `models/CourseInvoice.js` - Invoice model
- ✅ `controllers/learningController.js` - Invoice generation & retrieval
- ✅ `routes/learningRoutes.js` - Invoice API endpoints

### Frontend
- ✅ `pages/MyInvoices.jsx` - Invoice management page
- ✅ `pages/MyInvoices.css` - Invoice styling
- ✅ `pages/LearningHub.jsx` - Updated to show invoice info

## Testing Checklist

- ✅ Invoice auto-generated after payment
- ✅ Unique invoice numbers per transaction
- ✅ Tax calculated correctly (18%)
- ✅ User can view all invoices
- ✅ Invoice details modal displays correctly
- ✅ Download/print functionality works
- ✅ Invoice linked to correct course and user
- ✅ Payment IDs stored accurately
- ✅ Billing details captured

---

**Status**: ✅ Complete and Ready for Use

Invoice system is fully implemented with automatic generation, storage, and user-friendly viewing/downloading capabilities!
