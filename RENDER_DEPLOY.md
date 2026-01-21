# Jobzee Deployment Guide - Render (Both Frontend & Backend)

Deploy both your frontend and backend to Render from a single GitHub repository.

## 🚀 Quick Start

### Prerequisites

1. **Render Account**: [render.com](https://render.com)
2. **MongoDB Atlas**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Cloudinary Account**: [cloudinary.com](https://cloudinary.com)
4. **GitHub Repository**: Code already pushed

---

## 📦 Step 1: Setup MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. **Database Access** → Add Database User
   - Username: `jobzee-user`
   - Password: Generate strong password
   - Permissions: Read & Write to any database
4. **Network Access** → Add IP → **0.0.0.0/0** (Allow from anywhere)
5. **Database** → Connect → Connect your application
6. Copy connection string:
   ```
   mongodb+srv://jobzee-user:<password>@cluster.mongodb.net/jobzee
   ```
7. Replace `<password>` with actual password

---

## 🎯 Step 2: Deploy to Render (10 minutes)

### Option A: Using Blueprint (Recommended - Deploys Both at Once)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and show:
   - ✅ jobzee-backend (Web Service)
   - ✅ jobzee-frontend (Static Site)
5. Click **Apply**
6. Both services will start deploying!

### Option B: Manual Setup (Deploy Each Separately)

#### Deploy Backend First:

1. **New +** → **Web Service**
2. Connect GitHub repository
3. Configure:
   ```
   Name: jobzee-backend
   Region: Oregon
   Branch: main
   Root Directory: jobzee-backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```
4. Click **Create Web Service**

#### Deploy Frontend After Backend:

1. **New +** → **Static Site**
2. Connect same GitHub repository
3. Configure:
   ```
   Name: jobzee-frontend
   Region: Oregon
   Branch: main
   Root Directory: jobzee-frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   Plan: Free
   ```
4. Click **Create Static Site**

---

## 🔧 Step 3: Configure Environment Variables

### Backend Environment Variables

Go to **jobzee-backend service** → **Environment** tab → Add these:

```bash
# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobzee

# Security (Required) - Generate random 64+ character string
JWT_SECRET=your-super-secret-random-64-character-string-here

# File Uploads (Required)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yoursite.com
FROM_NAME=Jobzee Platform

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id

# App Config (Auto-set by render.yaml, but can override)
NODE_ENV=production
PORT=5000
APP_NAME=JobZee
```

**Note**: `FRONTEND_URL` is automatically set from the frontend service if using Blueprint.

### Frontend Environment Variables

Go to **jobzee-frontend service** → **Environment** tab → Add these:

```bash
# Backend API URL (Auto-set by render.yaml if using Blueprint)
REACT_APP_API_URL=https://jobzee-backend-xxxx.onrender.com

# OAuth (Optional - must match backend)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# Maps (Optional)
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
```

**Note**: If using Blueprint, `REACT_APP_API_URL` is automatically set to your backend URL.

---

## ✅ Step 4: Verify Deployment

### Check Backend

1. Wait for backend deploy to complete (2-5 minutes)
2. Visit: `https://jobzee-backend-xxxx.onrender.com/api/health`
3. Should see JSON: `{"status":"OK",...}`

### Check Frontend

1. Wait for frontend deploy to complete (2-5 minutes)
2. Visit: `https://jobzee-frontend-xxxx.onrender.com`
3. App should load properly

### Test Features

- [ ] User registration/login works
- [ ] Employer registration/login works
- [ ] No CORS errors in browser console
- [ ] File uploads work (profile pictures)
- [ ] Job search works
- [ ] Dashboard loads

---

## 🎨 Step 5: Update OAuth Settings (If Using Google OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins**:
   ```
   https://jobzee-frontend-xxxx.onrender.com
   ```
4. Add **Authorized redirect URIs**:
   ```
   https://jobzee-frontend-xxxx.onrender.com
   ```
5. Save changes

---

## 🔄 Auto-Deployment

Both services auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild changed services
3. Deploy updates
4. Show deployment status in dashboard

---

## 💡 Pro Tips

### Generate Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Check Logs

Always check logs when debugging:
- Backend: **jobzee-backend** → **Logs** tab
- Frontend: **jobzee-frontend** → **Logs** tab

### Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after sleep: 30-60 seconds to wake up
- 750 hours/month free for web services
- 100GB bandwidth/month for static sites

**Upgrade When Needed:**
- Starter Plan: $7/month (no cold starts)
- Pro Plan: $20/month (better resources)

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'qrcode'"

**Solution**: Already fixed in `package.json`. If you see this:
```bash
cd jobzee-backend
npm install qrcode
```
Then commit and push.

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS error

**Solutions**:
1. Verify `FRONTEND_URL` in backend matches frontend URL exactly
2. Check both services are deployed and running
3. Redeploy backend after updating environment variables
4. Clear browser cache

### Issue: Backend Showing 404

**Solution**: Make sure you're accessing `/api/` endpoints:
- ✅ `https://backend-url.onrender.com/api/health`
- ❌ `https://backend-url.onrender.com/health`

### Issue: Build Failures

**Backend Build Fails**:
- Check logs for missing dependencies
- Verify all packages in `package.json`
- Ensure `rootDir: jobzee-backend` is correct

**Frontend Build Fails**:
- Check logs for build errors
- Verify `rootDir: jobzee-frontend` is correct
- Ensure `REACT_APP_API_URL` is set before build

### Issue: Slow First Load

**Cause**: Free tier services sleep after 15 minutes

**Solutions**:
- Accept 30-60 second first load (free tier)
- Upgrade to paid plan ($7/month) for instant response
- Use a uptime monitor to ping every 14 minutes (not recommended for production)

---

## 📊 Environment Variables Reference

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key | 64+ random chars |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | `abcdef...` |

### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | Email server | - |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |
| `GOOGLE_CLIENT_ID` | OAuth client | - |

### Frontend (Auto-configured via Blueprint)

| Variable | Description | Auto-set |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend URL | ✅ Yes |

### Frontend (Manual if needed)

| Variable | Description |
|----------|-------------|
| `REACT_APP_GOOGLE_CLIENT_ID` | OAuth client ID |
| `REACT_APP_MAPBOX_TOKEN` | Mapbox token |

---

## 🎯 Your Deployed URLs

After deployment:

- **Frontend**: `https://jobzee-frontend-xxxx.onrender.com`
- **Backend API**: `https://jobzee-backend-xxxx.onrender.com/api`
- **Health Check**: `https://jobzee-backend-xxxx.onrender.com/api/health`

---

## 🔐 Security Checklist

Before going live:

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 for Render)
- [ ] Environment variables set (not in code)
- [ ] `.env` files not committed to git
- [ ] Google OAuth URLs updated
- [ ] CORS properly configured
- [ ] HTTPS enabled (automatic on Render)

---

## 💰 Costs

### Free Forever

- **Render**: 750 hours/month web services + 100GB static hosting
- **MongoDB**: 512MB M0 cluster
- **Cloudinary**: 25 credits/month

### When to Upgrade

- High traffic (>750hrs/month)
- Need instant response (no cold starts)
- Production application
- Custom domains with SSL

**Recommended Upgrade**:
- Render Starter: $7/month per service
- MongoDB M2: $9/month (2GB)
- Total: ~$23/month for production-ready setup

---

## 📚 Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com  
- **Cloudinary**: https://cloudinary.com/documentation
- **React Deployment**: https://create-react-app.dev/docs/deployment

---

## 🎉 Success!

Once everything is deployed:

✅ Backend running at: `https://jobzee-backend-xxxx.onrender.com`
✅ Frontend running at: `https://jobzee-frontend-xxxx.onrender.com`
✅ Auto-deploys on git push
✅ Free tier for development
✅ Easy to scale when ready

Happy deploying! 🚀
