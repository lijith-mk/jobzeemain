# Google Sign-In Setup for JobZee Mobile

## Installation

```bash
npm install @react-native-google-signin/google-signin
```

## Google Cloud Console Setup

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create a project
   - Navigate to "APIs & Services" > "Credentials"

2. **Create Android OAuth Client**
   - Click "Create Credentials" > "OAuth Client ID"
   - Application type: Android
   - Package name: `com.jobzee.mobile` (or your package name)
   - Get SHA-1 certificate fingerprint:
     ```bash
     # For debug build (development)
     cd android
     ./gradlew signingReport
     # Look for "SHA1" under "Variant: debug"
     ```
   - Enter the SHA-1 fingerprint
   - Click "Create"
   - **Save the Client ID** (you'll need it)

3. **Create iOS OAuth Client** (if building for iOS)
   - Click "Create Credentials" > "OAuth Client ID"
   - Application type: iOS
   - Bundle ID: `com.jobzee.mobile` (or your bundle ID)
   - Click "Create"
   - **Save the Client ID**

4. **Create Web OAuth Client**
   - Click "Create Credentials" > "OAuth Client ID"
   - Application type: Web application
   - Click "Create"
   - **Save the Client ID** - This is the most important one!

## App Configuration

### Option 1: Using app.json (Recommended for Expo)

Add to your `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleWebClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
      "googleIosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
      "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com"
    },
    "android": {
      "package": "com.jobzee.mobile"
    },
    "ios": {
      "bundleIdentifier": "com.jobzee.mobile"
    }
  }
}
```

### Option 2: Using Environment Variables

Create/update `.env` file:

```env
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
```

## Backend Configuration

Ensure your backend has the same Web Client ID configured:

In `jobzee-backend/.env`:
```env
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

**Important:** The Web Client ID must match between mobile app and backend!

## Android Specific Setup

1. **Update android/build.gradle**
   
   Already done if using React Native 0.60+, but verify:
   ```gradle
   allprojects {
       repositories {
           google()
           mavenCentral()
       }
   }
   ```

2. **SHA-1 Certificate**
   
   For production builds, generate a release keystore:
   ```bash
   keytool -genkey -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
   
   Get the SHA-1:
   ```bash
   keytool -list -v -keystore release.keystore -alias my-key-alias
   ```
   
   Add this SHA-1 to your Android OAuth Client in Google Cloud Console

## iOS Specific Setup (if building for iOS)

1. **Update Info.plist**
   
   Add URL scheme:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
       </array>
     </dict>
   </array>
   ```

2. **Install CocoaPods**
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Testing

1. **Development Build**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

2. **Test Google Sign-In**
   - Open the app
   - Navigate to Login screen
   - Click "Sign in with Google"
   - Select your Google account
   - Verify successful login

## Troubleshooting

### "DEVELOPER_ERROR" or "API_DISABLED"
- Verify Web Client ID is correct in app.json
- Enable Google Sign-In API in Google Cloud Console
- Check that the SHA-1 certificate matches (Android)

### "SIGN_IN_REQUIRED" 
- The user cancelled the sign-in
- No error handling needed

### "PLAY_SERVICES_NOT_AVAILABLE" (Android)
- Update Google Play Services on the device/emulator
- Use a device with Google Play Services installed

### "Network Error"
- Check internet connection
- Verify backend endpoint is accessible
- Check backend logs for authentication errors

### Backend returns "Invalid Google token"
- Verify GOOGLE_CLIENT_ID matches in backend .env
- Ensure you're using the Web Client ID, not Android/iOS Client ID

## Production Checklist

- [ ] Created release keystore for Android
- [ ] Added release SHA-1 to Google Cloud Console
- [ ] Updated app.json with production Google Client IDs
- [ ] Verified backend has correct GOOGLE_CLIENT_ID
- [ ] Tested on physical devices (Android and iOS)
- [ ] Verified OAuth consent screen is configured
- [ ] Added privacy policy and terms of service links

## Support

For more details, see:
- [@react-native-google-signin/google-signin Documentation](https://react-native-google-signin.github.io/docs/)
- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios)
