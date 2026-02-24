# Certificate Download Troubleshooting Guide

## Issue: "Failed to download certificate" on hosted environment

This guide helps you fix certificate download issues on Render.com or other hosting platforms.

---

## Quick Diagnosis

### Step 1: Test Puppeteer Health
Visit your deployed backend URL:
```
https://your-backend-url.onrender.com/api/certificates/health/puppeteer
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Puppeteer is working correctly",
  "details": {
    "executablePath": "...",
    "launchTime": "2000ms",
    "pdfGenerationTime": "500ms",
    "pdfSize": "12345 bytes"
  }
}
```

**Error Response (Failure):**
```json
{
  "success": false,
  "message": "Puppeteer health check failed",
  "error": "Failed to launch chrome/chromium..."
}
```

---

## Common Fixes

### Fix 1: Update Render Configuration

1. **Go to your Render Dashboard**
2. **Select your backend service**
3. **Update Environment Variables:**
   - Remove or set `PUPPETEER_EXECUTABLE_PATH` to empty
   - Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false`

4. **Manual Deploy** (redeploy with changes)

### Fix 2: Use Render's Chrome Build Pack

Update your `render.yaml`:

```yaml
services:
  - type: web
    name: jobzee-backend
    runtime: node
    buildCommand: |
      npm install
      npm install puppeteer
    startCommand: npm start
    envVars:
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: false
```

### Fix 3: Check Backend Logs

In Render Dashboard:
1. Go to your service → **Logs**
2. Look for these messages:
   - `[Puppeteer] Launching browser...`
   - `[Puppeteer] Browser launched successfully`
   - `[Certificate Download] PDF generated successfully`

**Common Error Messages:**

**Error:** `Failed to launch chrome`
- **Solution:** Puppeteer needs to download Chromium. Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false`

**Error:** `ENOENT: no such file or directory`
- **Solution:** Certificate template missing. Ensure `templates/certificateTemplate.html` exists in repo

**Error:** `TimeoutError: Navigation timeout`
- **Solution:** Increase timeout or check network connectivity

---

## Step-by-Step Resolution

### On Render.com:

#### Step 1: Update Build Command
In Render Dashboard → Your Service → Settings:

**Build Command:**
```bash
npm install && npm install puppeteer
```

#### Step 2: Update Environment Variables
Remove or update these variables:
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `false` (or remove it)
- `PUPPETEER_EXECUTABLE_PATH` = (leave empty or remove it)

#### Step 3: Trigger Manual Deploy
- Click **Manual Deploy** → **Deploy latest commit**
- Wait 5-10 minutes for build to complete

#### Step 4: Test
Once deployed, test the Puppeteer health endpoint:
```
https://your-backend.onrender.com/api/certificates/health/puppeteer
```

#### Step 5: Try Certificate Download
- Log into your frontend
- Go to Certificates page
- Click download on any certificate

---

## Alternative Solution: Pre-generate Certificates

If Puppeteer continues to fail, you can pre-generate certificates on course completion:

### Backend Change:
In `courseController.js`, when marking course as complete, generate certificate immediately:

```javascript
// When course completed
if (courseCompleted) {
  try {
    // Generate certificate on server (before sending response)
    await certificateController.generateCertificate({
      user: { id: userId },
      body: { courseId }
    });
  } catch (error) {
    console.error('Certificate generation failed:', error);
    // Don't block course completion
  }
}
```

This way:
- ✅ Certificates are generated when course is completed
- ✅ They're stored on disk
- ✅ Download just retrieves the file (no Puppeteer needed)

---

## Debugging Commands

### Check Puppeteer Installation
```bash
npm list puppeteer
```

### Test Puppeteer Locally
```bash
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(browser => { console.log('OK'); browser.close(); });"
```

### View Render Build Logs
In Render Dashboard:
- Go to your service
- Click **Logs** tab
- Filter by "Build" to see installation logs

---

## Environment-Specific Settings

### For Render.com:
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=
NODE_ENV=production
```

### For Heroku:
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

Add buildpack:
```bash
heroku buildpacks:add jontewks/puppeteer
```

### For Railway:
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

### For Vercel (Serverless):
Use `@vercel/og` or `puppeteer-core` with Chrome AWS Lambda layer

---

## Verification Checklist

After making changes, verify:

- [ ] Puppeteer health check returns success
- [ ] Backend logs show "Browser launched successfully"
- [ ] Certificate download works in frontend
- [ ] PDF file is generated (check file size > 0)
- [ ] No timeout errors in logs

---

## Still Having Issues?

### Check These:

1. **Memory Limits:** Puppeteer needs ~512MB RAM minimum
   - On Render free tier: Check if service is running out of memory
   
2. **Timeout Issues:** Puppeteer can be slow on free tiers
   - Frontend has 60s timeout - should be enough
   - If still timing out, pre-generate certificates
   
3. **Template Issues:** Ensure `certificateTemplate.html` exists
   - Located in: `jobzee-backend/templates/certificateTemplate.html`
   - Should be committed to Git
   
4. **Chromium Dependencies:** Some platforms need additional dependencies
   - Render usually handles this automatically
   - Heroku needs specific buildpack

---

## Quick Fix Commands

### Redeploy on Render:
```bash
# From project root
git add .
git commit -m "Fix certificate generation"
git push origin main
# Then trigger manual deploy in Render Dashboard
```

### Check Logs:
```bash
# In Render Dashboard
# Go to your service → Logs → Filter by "puppeteer" or "certificate"
```

---

## Contact Points

If certificate download still fails after all fixes:

1. **Check build logs** for Puppeteer installation errors
2. **Check runtime logs** for browser launch errors
3. **Test health endpoint** to verify Puppeteer works
4. **Contact Render support** if it's a platform issue

---

## Summary of Changes Made

This troubleshooting included fixes to:

1. ✅ **Backend certificate controller** - Better error logging
2. ✅ **Puppeteer configuration** - Production-friendly launch options
3. ✅ **Frontend download handlers** - Better error messages & timeout
4. ✅ **Health check endpoint** - Test Puppeteer without full certificate
5. ✅ **render.yaml** - Proper Chromium installation
6. ✅ **Error messages** - More descriptive for easier debugging

Test the health endpoint first, then try downloading a certificate!
