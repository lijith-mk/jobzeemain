# Certificate Verification API - Quick Test Guide

## 🧪 Testing All Verification Endpoints

### Prerequisites
- Backend server running on http://localhost:5000
- At least one certificate issued in the database

---

## 1️⃣ Generate a Test Certificate First

```bash
# Login as user first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Save the token from response, then generate certificate
curl -X POST http://localhost:5000/api/certificates/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "courseId": "YOUR_COURSE_ID"
  }'

# Note the certificateId from response (e.g., CERT-2026-ABC123DEF456)
```

---

## 2️⃣ Test Verification by Certificate ID (Primary Method)

### Valid Certificate
```bash
curl -X GET http://localhost:5000/api/certificates/verify/CERT-2026-ABC123DEF456
```

### Expected Response:
```json
{
  "success": true,
  "valid": true,
  "verificationStatus": "verified",
  "message": "Certificate is valid and verified",
  "certificateId": "CERT-2026-ABC123DEF456",
  "courseName": "JavaScript Fundamentals",
  "issuedTo": "John Doe",
  "issuedAt": "2026-02-05T10:30:00.000Z",
  "courseCategory": "Programming",
  "courseLevel": "beginner",
  "skillsAchieved": ["JavaScript", "ES6", "React"],
  "completionMetrics": {
    "totalLessons": 20,
    "completedLessons": 20,
    "averageQuizScore": 95
  },
  "certificateHash": "7d7518d72e9aefa9d03a9aed0d4f8ea7c411bd8a...",
  "honors": false
}
```

### Invalid Certificate
```bash
curl -X GET http://localhost:5000/api/certificates/verify/CERT-9999-INVALID
```

### Expected Response:
```json
{
  "success": false,
  "valid": false,
  "verificationStatus": "not_found",
  "message": "Certificate not found",
  "certificateId": "CERT-9999-INVALID"
}
```

---

## 3️⃣ Test Verification by Hash

### Valid Hash
```bash
curl -X POST http://localhost:5000/api/certificates/verify-hash \
  -H "Content-Type: application/json" \
  -d '{
    "certificateHash": "7d7518d72e9aefa9d03a9aed0d4f8ea7c411bd8a2c375bf03bcd11cff20b3366"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "valid": true,
  "verificationStatus": "verified",
  "message": "Certificate is valid",
  "certificateId": "CERT-2026-ABC123",
  "courseName": "JavaScript Fundamentals",
  "issuedTo": "John Doe",
  "issuedAt": "2026-02-05T10:30:00.000Z",
  "certificateHash": "7d7518d..."
}
```

### Invalid Hash
```bash
curl -X POST http://localhost:5000/api/certificates/verify-hash \
  -H "Content-Type: application/json" \
  -d '{
    "certificateHash": "invalid_hash_123"
  }'
```

### Expected Response:
```json
{
  "success": false,
  "valid": false,
  "verificationStatus": "not_found",
  "message": "Certificate not found"
}
```

---

## 4️⃣ Test Batch Verification

### Multiple Certificates
```bash
curl -X POST http://localhost:5000/api/certificates/verify-batch \
  -H "Content-Type: application/json" \
  -d '{
    "certificateIds": [
      "CERT-2026-ABC123",
      "CERT-2026-DEF456",
      "CERT-9999-INVALID"
    ]
  }'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Verified 3 certificates",
  "total": 3,
  "valid": 2,
  "invalid": 1,
  "results": [
    {
      "valid": true,
      "verificationStatus": "verified",
      "certificateId": "CERT-2026-ABC123",
      "courseName": "JavaScript Fundamentals",
      "issuedTo": "John Doe"
    },
    {
      "valid": true,
      "verificationStatus": "verified",
      "certificateId": "CERT-2026-DEF456",
      "courseName": "Python Basics",
      "issuedTo": "Jane Smith"
    },
    {
      "valid": false,
      "verificationStatus": "not_found",
      "certificateId": "CERT-9999-INVALID",
      "message": "Certificate not found"
    }
  ]
}
```

### Empty Array
```bash
curl -X POST http://localhost:5000/api/certificates/verify-batch \
  -H "Content-Type: application/json" \
  -d '{
    "certificateIds": []
  }'
```

### Expected Response:
```json
{
  "success": false,
  "message": "Certificate IDs array is required"
}
```

### Too Many Certificates (>50)
```bash
curl -X POST http://localhost:5000/api/certificates/verify-batch \
  -H "Content-Type: application/json" \
  -d '{
    "certificateIds": ["CERT-1", "CERT-2", ... "CERT-51"]
  }'
```

### Expected Response:
```json
{
  "success": false,
  "message": "Maximum 50 certificates can be verified at once"
}
```

---

## 5️⃣ Test Error Scenarios

### Missing Certificate ID
```bash
curl -X GET http://localhost:5000/api/certificates/verify/
```

### Expected Response:
```
404 Not Found (route doesn't match)
```

### Missing Hash in Request Body
```bash
curl -X POST http://localhost:5000/api/certificates/verify-hash \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Response:
```json
{
  "success": false,
  "message": "Certificate hash is required"
}
```

---

## 6️⃣ Test Revoked Certificate

### First, revoke a certificate (Admin only)
```bash
# Login as admin first
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jobzee.com",
    "password": "admin123"
  }'

# Revoke certificate
curl -X POST http://localhost:5000/api/certificates/admin/CERT-2026-ABC123/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "reason": "Fraud detected"
  }'
```

### Then verify the revoked certificate
```bash
curl -X GET http://localhost:5000/api/certificates/verify/CERT-2026-ABC123
```

### Expected Response:
```json
{
  "success": false,
  "valid": false,
  "verificationStatus": "revoked",
  "message": "This certificate has been revoked",
  "certificateId": "CERT-2026-ABC123",
  "courseName": "JavaScript Fundamentals",
  "issuedTo": "John Doe",
  "issuedAt": "2026-02-05T10:30:00.000Z",
  "revokedAt": "2026-02-05T12:00:00.000Z",
  "revokedReason": "Fraud detected"
}
```

---

## 🔍 Using Postman

### Import Collection

Create a Postman collection with these requests:

1. **Verify Certificate by ID**
   - Method: GET
   - URL: `{{baseUrl}}/api/certificates/verify/:certificateId`
   - Variable: `certificateId` = `CERT-2026-ABC123`

2. **Verify by Hash**
   - Method: POST
   - URL: `{{baseUrl}}/api/certificates/verify-hash`
   - Body (JSON):
     ```json
     {
       "certificateHash": "{{certificateHash}}"
     }
     ```

3. **Batch Verify**
   - Method: POST
   - URL: `{{baseUrl}}/api/certificates/verify-batch`
   - Body (JSON):
     ```json
     {
       "certificateIds": [
         "CERT-2026-A",
         "CERT-2026-B",
         "CERT-2026-C"
       ]
     }
     ```

### Environment Variables
```
baseUrl: http://localhost:5000
certificateId: CERT-2026-ABC123DEF456
certificateHash: 7d7518d72e9aefa9d03a9aed0d4f8ea7c411bd8a...
```

---

## 🌐 Frontend Integration Example

### JavaScript/Fetch
```javascript
// Verify certificate
async function verifyCertificate(certificateId) {
  try {
    const response = await fetch(`/api/certificates/verify/${certificateId}`);
    const data = await response.json();
    
    if (data.valid) {
      console.log('✅ Valid Certificate:', data);
      // Show success UI
    } else {
      console.log('❌ Invalid Certificate:', data.message);
      // Show error UI
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Batch verify
async function batchVerify(certificateIds) {
  try {
    const response = await fetch('/api/certificates/verify-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateIds })
    });
    const data = await response.json();
    
    console.log(`Verified ${data.valid}/${data.total} certificates`);
    return data.results;
  } catch (error) {
    console.error('Batch verification failed:', error);
  }
}
```

### React Component
```jsx
import { useState } from 'react';
import axios from 'axios';

function CertificateVerifier() {
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyCertificate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/certificates/verify/${certificateId}`
      );
      setResult(data);
    } catch (error) {
      setResult({ valid: false, message: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        value={certificateId}
        onChange={(e) => setCertificateId(e.target.value)}
        placeholder="Enter Certificate ID"
      />
      <button onClick={verifyCertificate} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Certificate'}
      </button>
      
      {result && (
        <div className={result.valid ? 'success' : 'error'}>
          <h3>{result.message}</h3>
          {result.valid && (
            <div>
              <p>Course: {result.courseName}</p>
              <p>Issued to: {result.issuedTo}</p>
              <p>Date: {new Date(result.issuedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Test valid certificate verification
- [ ] Test invalid certificate ID handling
- [ ] Test revoked certificate detection
- [ ] Test batch verification with mixed results
- [ ] Test rate limiting (if implemented)
- [ ] Test CORS for frontend domain
- [ ] Verify no sensitive data in responses
- [ ] Check database indexing for performance
- [ ] Monitor verification response times
- [ ] Set up logging for verification attempts
- [ ] Test blockchain hash integration (if enabled)

---

## 🚀 Production Deployment Notes

### Environment Variables
```bash
BACKEND_URL=https://api.jobzee.com
PORT=5000
MONGODB_URI=mongodb://...
```

### CORS Configuration
```javascript
// In app.js
app.use(cors({
  origin: ['https://jobzee.com', 'https://www.jobzee.com'],
  credentials: true
}));
```

### Rate Limiting (Recommended)
```javascript
const rateLimit = require('express-rate-limit');

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many verification requests, please try again later'
});

router.get('/verify/:certificateId', verifyLimiter, verifyCertificate);
```

---

**System Status: READY FOR TESTING** ✅
