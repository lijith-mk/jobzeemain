# Google OAuth Setup Guide for JobZee

This guide will help you set up Google OAuth authentication for your JobZee application.

## Prerequisites

1. A Google Cloud Console account
2. Your JobZee application running locally

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" 
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Fill in the required information:
   - **App name**: JobZee
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (click **Add or Remove Scopes**):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile` 
   - `openid`
5. Add test users if needed
6. Submit for verification (optional for development)

### 1.4 Create OAuth 2.0 Client ID
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure the client:

**Name**: JobZee Web Client

**Authorized JavaScript origins**:
```
http://localhost:3000
https://yourdomain.com (for production)
```

**Authorized redirect URIs**:
```
http://localhost:3000 (for frontend callbacks)
http://localhost:5000/api/auth/google/callback (if using server-side flow)
```

5. Click **Create**
6. **Important**: Copy the Client ID and Client Secret

## Step 2: Environment Variables Setup

### 2.1 Backend Environment Variables
Add these to your `jobzee-backend/.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2.2 Frontend Environment Variables
Add these to your `jobzee-frontend/.env` file:

```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**⚠️ Security Note**: 
- Never put the Client Secret in frontend environment variables
- The Client ID can be public, but the Client Secret must remain private

## Step 3: Install Dependencies

### 3.1 Backend Dependencies
```bash
cd jobzee-backend
npm install google-auth-library
```

### 3.2 Frontend Dependencies
The Google Sign-In library is loaded dynamically via CDN, so no additional installation is needed.

## Step 4: Test the Implementation

### 4.1 Start Your Applications
```bash
# Terminal 1 - Backend
cd jobzee-backend
npm run dev

# Terminal 2 - Frontend  
cd jobzee-frontend
npm start
```

### 4.2 Test Google Sign-In
1. Go to `http://localhost:3000/login`
2. Click the "Continue with Google" button
3. Complete the Google sign-in flow
4. Verify that you're redirected appropriately

## Step 5: Verification Checklist

✅ **Google Cloud Setup**
- [ ] OAuth 2.0 Client ID is created
- [ ] Authorized JavaScript origins include your frontend URL
- [ ] Authorized redirect URIs are configured correctly
- [ ] Client ID and Secret are copied

✅ **Environment Variables**
- [ ] `GOOGLE_CLIENT_ID` is set in backend `.env`
- [ ] `GOOGLE_CLIENT_SECRET` is set in backend `.env`
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` is set in frontend `.env`
- [ ] Client Secret is NOT in frontend environment

✅ **Dependencies**
- [ ] `google-auth-library` is installed in backend
- [ ] Backend includes Google OAuth route (`POST /api/auth/google`)

✅ **Testing**
- [ ] Google Sign-In button appears on login page
- [ ] Clicking button opens Google sign-in popup
- [ ] Successful sign-in creates user account
- [ ] User is redirected to appropriate dashboard
- [ ] JWT token is properly issued and stored

## Step 6: Production Deployment

### 6.1 Update Authorized Origins
When deploying to production, add your production URLs:

**Authorized JavaScript origins**:
```
https://yourproductiondomain.com
https://www.yourproductiondomain.com
```

**Authorized redirect URIs**:
```
https://yourproductiondomain.com
https://yourproductiondomain.com/api/auth/google/callback
```

### 6.2 Environment Variables
Update your production environment variables with the same Google credentials.

### 6.3 HTTPS Requirement
Google OAuth requires HTTPS in production. Make sure your production deployment uses SSL/TLS.

## Troubleshooting

### Common Issues

**1. "Invalid Origin" Error**
- Verify that your current URL is listed in Authorized JavaScript origins
- Make sure there are no typos in the URLs
- Check that you're using the correct protocol (http vs https)

**2. "Invalid Client ID" Error**
- Verify that `REACT_APP_GOOGLE_CLIENT_ID` matches your Google Console Client ID
- Make sure there are no extra spaces or characters
- Restart your React development server after changing environment variables

**3. "Token Verification Failed" Error**
- Verify that `GOOGLE_CLIENT_ID` in backend matches the frontend
- Check that the Google+ API is enabled
- Ensure your server system time is accurate

**4. "Popup Blocked" Error**
- Allow popups for your development domain
- Use the fallback sign-in method
- Consider implementing redirect-based flow for production

### Debug Mode
Enable debug logging by adding this to your backend:

```javascript
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
```

## Security Best Practices

1. **Never expose Client Secret**: Keep it only in backend environment variables
2. **Validate tokens server-side**: Always verify Google ID tokens on your backend
3. **Use HTTPS in production**: Required for Google OAuth
4. **Limit OAuth scopes**: Only request the permissions you actually need
5. **Implement CSRF protection**: Use state parameters for additional security
6. **Regular credential rotation**: Consider rotating OAuth credentials periodically

## Next Steps

After successful setup:

1. **Add profile picture sync**: Use Google profile pictures as user avatars
2. **Implement account linking**: Allow users to link Google accounts to existing email accounts
3. **Add Google profile data**: Pre-fill onboarding forms with Google profile information
4. **Add sign-out integration**: Properly handle Google sign-out

## Support

If you encounter issues:

1. Check Google Cloud Console logs
2. Review browser console for client-side errors  
3. Check backend server logs for token verification issues
4. Verify all environment variables are correctly set
5. Test with different Google accounts

For Google OAuth specific documentation, visit: https://developers.google.com/identity/protocols/oauth2
