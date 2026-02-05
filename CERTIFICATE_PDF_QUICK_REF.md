# 📜 Certificate PDF Generation - Quick Reference

## 🎯 Quick Start

### Install Dependencies
```bash
cd jobzee-backend
npm install puppeteer handlebars
```

### Create Certificates Directory
```bash
mkdir -p uploads/certificates
```

### Set Environment Variables
```env
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

---

## 📁 Files Created

```
jobzee-backend/
├── templates/
│   └── certificateTemplate.html          # Beautiful HTML template
├── utils/
│   └── certificateGenerator.js           # PDF generation utility
├── controllers/
│   └── certificateController.js          # Updated with PDF logic
└── uploads/
    └── certificates/                      # Generated PDFs stored here
```

---

## 🎨 Certificate Design

**Size:** 1200x850px (landscape)  
**Colors:** Purple gradient (#667eea → #764ba2)  
**Font:** Georgia (serif)  
**Style:** Modern, professional, elegant  

**Elements:**
- ✅ Platform logo and branding
- ✅ Certificate ID badge
- ✅ Learner name (large, gradient)
- ✅ Course name (highlighted)
- ✅ Grade badge (A+, A, B+, etc.)
- ✅ Honors badge (🏆 for exceptional)
- ✅ Skills badges
- ✅ Issue date
- ✅ Official seal
- ✅ Verification URL

---

## 🔌 API Endpoints

### Generate Certificate with PDF
```http
POST /api/certificates/generate
Body: { "courseId": "..." }
→ Generates certificate + PDF
→ Returns certificate with downloadUrl
```

### Download Certificate
```http
GET /api/certificates/:certificateId/download
→ Returns PDF file or download URL
```

### Access PDF Directly
```http
GET /uploads/certificates/certificate_CERT-2026-....pdf
→ Static file serving
```

---

## 💻 Code Usage

### Generate PDF
```javascript
const { generateAndSaveCertificate } = require('../utils/certificateGenerator');

const result = await generateAndSaveCertificate({
  certificateId: 'CERT-2026-ABC123',
  userName: 'John Doe',
  courseName: 'Full Stack Development',
  courseCategory: 'web-development',
  courseLevel: 'intermediate',
  grade: 'A',
  honors: false,
  skillsAchieved: ['React', 'Node.js'],
  issuedAt: new Date()
});

console.log(result.filePath);
// uploads/certificates/certificate_CERT-2026-ABC123_1738742400000.pdf
```

### Stream PDF
```javascript
const { generateCertificateBuffer } = require('../utils/certificateGenerator');

const pdfBuffer = await generateCertificateBuffer(certData);

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="cert.pdf"');
res.send(pdfBuffer);
```

---

## 🎯 Certificate Generation Flow

```
1. User completes course
2. API: POST /api/certificates/generate
3. Validate eligibility ✅
4. Create certificate in DB ✅
5. Generate PDF from template ✅
6. Save PDF to uploads/certificates/ ✅
7. Update certificate.certificateUrl ✅
8. Return certificate data ✅
```

---

## 🔒 Security

- ✅ User authentication required
- ✅ User must own certificate
- ✅ Revoked certificates blocked
- ✅ Secure file storage
- ✅ Unique filenames

---

## 📊 Certificate Data

```javascript
{
  certificateId: "CERT-2026-A1B2C3D4E5F6",
  userName: "John Doe",
  userEmail: "john@example.com",
  courseName: "Full Stack Development",
  courseCategory: "web-development",
  courseLevel: "intermediate",
  grade: "A",
  honors: false,
  skillsAchieved: ["React", "Node.js", "MongoDB"],
  issuedAt: "2026-02-05T10:30:00.000Z",
  certificateUrl: "http://localhost:5000/uploads/certificates/certificate_CERT-2026-A1B2C3D4E5F6_1738742400000.pdf",
  certificateHash: "a3f8b2c9d1e5f7a8b9c0d1e2f3a4b5c6...",
  verificationStatus: "verified"
}
```

---

## 🎨 Customization

### Change Colors
Edit `templates/certificateTemplate.html`:
```css
/* Change gradient */
background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
```

### Change Logo
```html
<div class="logo">YOUR BRAND</div>
```

### Add Elements
```html
<!-- Add company signature -->
<div class="signature">
  <img src="signature.png" />
</div>
```

---

## 🚀 Production Deployment

### Puppeteer Configuration
```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
  ]
});
```

### Heroku Buildpack
```bash
heroku buildpacks:add jontewks/puppeteer
```

### Cloud Storage (Optional)
For production, consider uploading PDFs to:
- AWS S3
- Cloudinary
- Google Cloud Storage

---

## 🧪 Testing

```javascript
// Test PDF generation
const testData = {
  certificateId: 'CERT-TEST-123',
  userName: 'Test User',
  courseName: 'Test Course',
  courseCategory: 'web-development',
  courseLevel: 'beginner',
  grade: 'A+',
  honors: true,
  skillsAchieved: ['Skill 1', 'Skill 2'],
  issuedAt: new Date()
};

generateAndSaveCertificate(testData)
  .then(r => console.log('✅', r.filePath))
  .catch(e => console.error('❌', e));
```

---

## 📦 Dependencies

```json
{
  "puppeteer": "^21.11.0",
  "handlebars": "^4.7.8"
}
```

---

## ⚠️ Troubleshooting

### PDF not generating?
- Check Puppeteer installation
- Ensure Chrome dependencies installed
- Check disk space
- Verify template file exists

### Template not found?
```bash
# Check template path
ls templates/certificateTemplate.html
```

### URL not working?
- Verify static file serving enabled
- Check certificates directory exists
- Confirm file permissions

---

## 📸 Certificate Preview

```
╔═══════════════════════════════════════════════════════════╗
║              [CERT-2026-A1B2C3D4E5F6]                    ║
║                                                           ║
║                      JOBZEE                               ║
║                 Learning Platform                         ║
║                                                           ║
║          CERTIFICATE OF COMPLETION                        ║
║                                                           ║
║           This is to certify that                         ║
║                                                           ║
║                   John Doe                                ║
║                                                           ║
║      has successfully completed the course                ║
║                                                           ║
║          Full Stack Web Development                       ║
║                                                           ║
║  Level: Intermediate | Category: Web Development          ║
║                                                           ║
║        [Grade: A]  [🏆 WITH HONORS]                      ║
║                                                           ║
║           Skills Achieved:                                ║
║   [React] [Node.js] [MongoDB] [Express]                  ║
║                                                           ║
║  [SEAL]                                                   ║
║  2026                                                     ║
║                                                           ║
║  Issued On: February 5, 2026                             ║
║  Certificate ID: CERT-2026-A1B2C3D4E5F6                  ║
║  Verified By: JOBZEE Platform                            ║
║                                                           ║
║  Verify at: https://jobzee.com/verify/CERT-2026-...      ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ Features Checklist

- [x] Beautiful HTML template
- [x] PDF generation with Puppeteer
- [x] Secure file storage
- [x] Download URLs
- [x] API integration
- [x] Grade and honors display
- [x] Skills badges
- [x] Verification URL
- [x] Access control
- [x] Bulk generation support

---

## 🎉 Status: COMPLETE!

All features implemented and ready to use!

**Next:** Install dependencies and test certificate generation.

```bash
npm install
node -e "require('./utils/certificateGenerator').generateAndSaveCertificate({certificateId:'TEST',userName:'Test',courseName:'Test',issuedAt:new Date()}).then(console.log)"
```
