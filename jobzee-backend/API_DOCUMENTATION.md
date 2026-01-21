# Jobzee Backend API Documentation

## Server Info
- **Base URL**: http://localhost:5000
- **Status**: ✅ Running
- **MongoDB**: ✅ Connected
- **Cloudinary**: ✅ Connected

## Admin Portal Access

### Admin Login
**Endpoint**: `POST /api/admin/login`

**Default Credentials**:
- User ID: `admin123`
- Password: `admin@123`

**Request Body**:
```json
{
  "userId": "admin123",
  "password": "admin@123"
}
```

**Response**:
```json
{
  "token": "jwt_token_here",
  "admin": {
    "id": "admin_id",
    "userId": "admin123",
    "name": "System Administrator",
    "email": "admin@jobzee.com",
    "role": "super_admin",
    "permissions": {
      "userManagement": true,
      "employerManagement": true,
      "jobManagement": true,
      "analytics": true,
      "systemSettings": true
    }
  }
}
```

### Admin Dashboard
**Endpoint**: `GET /api/admin/dashboard`
**Headers**: `Authorization: Bearer <token>`

### User Management
**Endpoint**: `GET /api/admin/users`
**Headers**: `Authorization: Bearer <token>`

### Employer Management
**Endpoint**: `GET /api/admin/employers`
**Headers**: `Authorization: Bearer <token>`

### Job Management
**Endpoint**: `GET /api/admin/jobs`
**Headers**: `Authorization: Bearer <token>`

## Employer Cart API

### Get Employer Cart
**Endpoint**: `GET /api/employer/cart`
**Headers**: `Authorization: Bearer <employer_token>`

**Response**:
```json
{
  "success": true,
  "cart": {
    "_id": "cart_id",
    "employer": "employer_id",
    "userType": "employer",
    "items": [],
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "total": 0,
    "currency": "USD",
    "isActive": true,
    "lastUpdated": "2023-01-01T00:00:00.000Z",
    "itemCount": 0,
    "productCount": 0
  }
}
```

### Get Employer Cart Summary
**Endpoint**: `GET /api/employer/cart/summary`
**Headers**: `Authorization: Bearer <employer_token>`

**Response**:
```json
{
  "success": true,
  "summary": {
    "itemCount": 0,
    "productCount": 0,
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "total": 0,
    "currency": "USD"
  }
}
```

### Add Item to Employer Cart
**Endpoint**: `POST /api/employer/cart/add`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "productId": "product_id_here",
  "quantity": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "cart": {
    "itemCount": 1,
    "total": 29.99,
    "currency": "USD"
  }
}
```

### Update Employer Cart Item
**Endpoint**: `PUT /api/employer/cart/update`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "productId": "product_id_here",
  "quantity": 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cart updated successfully",
  "cart": {
    "itemCount": 2,
    "total": 59.98,
    "currency": "USD"
  }
}
```

### Remove Item from Employer Cart
**Endpoint**: `DELETE /api/employer/cart/remove/:productId`
**Headers**: `Authorization: Bearer <employer_token>`

**Response**:
```json
{
  "success": true,
  "message": "Item removed from cart successfully",
  "cart": {
    "itemCount": 0,
    "total": 0,
    "currency": "USD"
  }
}
```

### Clear Employer Cart
**Endpoint**: `DELETE /api/employer/cart/clear`
**Headers**: `Authorization: Bearer <employer_token>`

**Response**:
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

### Apply Coupon to Employer Cart
**Endpoint**: `POST /api/employer/cart/coupon/apply`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "couponCode": "SAVE10"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Coupon SAVE10 applied successfully",
  "discount": {
    "code": "SAVE10",
    "description": "10% off",
    "amount": 5.99
  },
  "cart": {
    "subtotal": 59.98,
    "discount": 5.99,
    "tax": 5.40,
    "total": 59.39,
    "currency": "USD"
  }
}
```

### Remove Coupon from Employer Cart
**Endpoint**: `DELETE /api/employer/cart/coupon/remove`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "couponCode": "SAVE10"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Coupon removed successfully",
  "cart": {
    "subtotal": 59.98,
    "discount": 0,
    "tax": 5.99,
    "total": 65.97,
    "currency": "USD"
  }
}
```

### Update Employer Cart Shipping Information
**Endpoint**: `PUT /api/employer/cart/shipping`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  },
  "method": "standard",
  "cost": 5.99
}
```

**Response**:
```json
{
  "success": true,
  "message": "Shipping information updated successfully",
  "cart": {
    "subtotal": 59.98,
    "discount": 0,
    "tax": 5.99,
    "shippingCost": 5.99,
    "total": 71.96,
    "currency": "USD"
  }
}
```

## File Upload Endpoints

### Upload User Profile Photo
**Endpoint**: `POST /api/upload/user/profile-photo`
**Headers**: 
- `Authorization: Bearer <user_token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `photo`: Image file (JPEG, JPG, PNG, GIF, WEBP)
- Max size: 5MB

**Response**:
```json
{
  "message": "Profile photo uploaded successfully",
  "photoUrl": "https://res.cloudinary.com/..."
}
```

### Upload User Resume
**Endpoint**: `POST /api/upload/user/resume`
**Headers**: 
- `Authorization: Bearer <user_token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `resume`: Document file (PDF, DOC, DOCX)
- Max size: 10MB

**Response**:
```json
{
  "message": "Resume uploaded successfully",
  "resumeUrl": "https://res.cloudinary.com/..."
}
```

### Upload Employer Profile Photo
**Endpoint**: `POST /api/upload/employer/profile-photo`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `photo`: Image file (JPEG, JPG, PNG, GIF, WEBP)
- Max size: 5MB

### Upload Company Logo
**Endpoint**: `POST /api/upload/employer/company-logo`
**Headers**: 
- `Authorization: Bearer <employer_token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `photo`: Image file (JPEG, JPG, PNG, GIF, WEBP)
- Max size: 5MB

## Common Issues & Solutions

### 1. Upload Issues
- **No file uploaded**: Make sure the form field name matches (`photo` for images, `resume` for documents)
- **File too large**: Reduce file size (5MB for images, 10MB for documents)
- **Invalid file type**: Use supported formats only
- **No token**: Include Authorization header with valid JWT token

### 2. Admin Access Issues
- **Invalid credentials**: Use `admin123` / `admin@123`
- **Token expired**: Login again to get new token
- **Permission denied**: Make sure you're using admin token, not user token

### 3. CORS Issues
- **Blocked by CORS**: Frontend must be running on http://localhost:3000 or add your URL to CORS config

## Testing Commands

```bash
# Initialize admin (if not already done)
npm run init-admin

# Test Cloudinary connection
npm run test-upload

# Start server
npm start

# Start server in development mode
npm run dev
```

## Environment Variables

Make sure your `.env` file contains:
```
PORT=5000
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=dxspcarx8
CLOUDINARY_API_KEY=762594944533685
CLOUDINARY_API_SECRET=W6Rsq5GsRLDo5nvC3neHywkODdQ
JWT_SECRET=jobzee_super_secret_key_2024_secure
NODE_ENV=development
```

## Status Check

✅ **Server**: Running on port 5000
✅ **Database**: Connected to MongoDB
✅ **Cloudinary**: Connected and working
✅ **Admin**: Initialized (admin123/admin@123)
✅ **JWT**: Configured
✅ **CORS**: Configured for localhost:3000

## Next Steps

1. **For Admin Access**: Use the credentials above to login via POST to `/api/admin/login`
2. **For File Uploads**: Make sure you have valid user/employer tokens first
3. **Frontend Integration**: Update your frontend to use the correct endpoints and headers