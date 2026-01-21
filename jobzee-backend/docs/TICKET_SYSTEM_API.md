# Ticket System API Documentation

## Overview

The Ticket System provides functionality for creating, managing, and validating event tickets. It supports both free and paid tickets with QR code generation for easy validation.

## Models

### Ticket Schema

```javascript
{
  "_id": ObjectId,
  "ticketId": "TCKT-20251010-1234",   // unique human-friendly code
  "eventId": ObjectId,                // reference to Event
  "userId": ObjectId,                 // reference to User
  "employerId": ObjectId,             // reference to Employer
  "ticketType": "Free" | "Paid",      // ticket type
  "ticketPrice": Number,              // price (0 for free tickets)
  "qrData": "TCKT-...|<signature>",   // QR code data with signature
  "qrImageUrl": "https://...png",     // optional QR image URL
  "status": "valid" | "used" | "cancelled",
  "issuedAt": ISODate,
  "usedAt": ISODate,                  // when ticket was used
  "cancelledAt": ISODate,             // when ticket was cancelled
  "metadata": {
    "ip": String,
    "userAgent": String,
    "source": "web" | "mobile" | "api"
  }
}
```

## API Endpoints

### Public Endpoints

#### Validate Ticket (QR Code)
```http
POST /api/tickets/validate
Content-Type: application/json

{
  "qrData": "TCKT-20251010-1234|eventId|userId|signature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket is valid",
  "ticket": {
    "ticketId": "TCKT-20251010-1234",
    "status": "valid",
    "event": { ... },
    "user": { ... },
    "issuedAt": "2025-01-10T10:00:00.000Z"
  }
}
```

### User Endpoints (Authentication Required)

#### Get User's Tickets
```http
GET /api/tickets/user/my-tickets?status=valid&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Ticket by ID
```http
GET /api/tickets/user/ticket/:ticketId
Authorization: Bearer <token>
```

#### Get Ticket by Ticket Code
```http
GET /api/tickets/user/ticket-code/:ticketId
Authorization: Bearer <token>
```

#### Cancel Ticket
```http
PUT /api/tickets/user/ticket/:ticketId/cancel
Authorization: Bearer <token>
```

### Employer Endpoints (Authentication Required)

#### Create Ticket
```http
POST /api/tickets/employer/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": "eventId",
  "userId": "userId",
  "ticketType": "Paid",
  "ticketPrice": 25.00,
  "source": "web"
}
```

#### Get Event Tickets
```http
GET /api/tickets/employer/event/:eventId/tickets?status=valid&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Event Ticket Statistics
```http
GET /api/tickets/employer/event/:eventId/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTickets": 100,
    "validTickets": 85,
    "usedTickets": 10,
    "cancelledTickets": 5,
    "totalRevenue": 2500.00,
    "freeTickets": 20,
    "paidTickets": 80
  }
}
```

#### Mark Ticket as Used
```http
PUT /api/tickets/employer/ticket/:ticketId/use
Authorization: Bearer <token>
```

#### Cancel Ticket (Employer)
```http
PUT /api/tickets/employer/ticket/:ticketId/cancel
Authorization: Bearer <token>
```

## Features

### QR Code Generation
- Each ticket gets a unique QR code with cryptographic signature
- Format: `TCKT-YYYYMMDD-NNNN|eventId|userId|signature`
- Signature prevents tampering and ensures authenticity

### Ticket Validation
- QR codes are cryptographically signed
- Automatic verification of ticket authenticity
- Status checking (valid/used/cancelled)
- Expiration checking (tickets expire after 1 year)

### Business Logic
- Free tickets must have price = 0
- Paid tickets must have price > 0
- Users can only have one valid ticket per event
- Event capacity checking (if seats limit is set)
- Only approved events can have tickets

### Security Features
- JWT-based authentication
- Role-based access control (users vs employers)
- Input validation and sanitization
- Rate limiting on endpoints
- Cryptographic QR code signatures

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errorType": "ERROR_TYPE"
}
```

### Error Types
- `validation_error`: Input validation failed
- `not_found`: Resource not found
- `access_denied`: Insufficient permissions
- `ticket_already_exists`: User already has ticket for event
- `event_full`: Event at capacity
- `invalid_qr_code`: QR code is invalid or tampered
- `ticket_expired`: Ticket has expired
- `ticket_already_used`: Ticket already used/cancelled

## Usage Examples

### Creating a Ticket (Employer)
```javascript
const response = await fetch('/api/tickets/employer/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventId: 'eventId',
    userId: 'userId',
    ticketType: 'Paid',
    ticketPrice: 25.00
  })
});
```

### Validating a Ticket (Check-in)
```javascript
const response = await fetch('/api/tickets/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qrData: 'TCKT-20251010-1234|eventId|userId|signature'
  })
});
```

### Getting User Tickets
```javascript
const response = await fetch('/api/tickets/user/my-tickets?status=valid', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## Testing

Run the test suite:
```bash
node scripts/test-ticket-system.js
```

The test suite covers:
- Ticket creation and validation
- QR code generation and verification
- Ticket operations (use, cancel)
- Database queries and aggregations
- Validation rules and error handling












