# Cloudinary Setup Guide

## Backend Setup

1. **Install Dependencies**
   ```bash
   cd jobzee-backend
   npm install cloudinary multer
   ```

2. **Environment Variables**
   Create a `.env` file in the `jobzee-backend` directory with the following variables:
   ```
   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/jobzee
   MONGODB_URI=mongodb://localhost:27017/jobzee

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

3. **Get Cloudinary Credentials**
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Go to your Dashboard
   - Copy your Cloud Name, API Key, and API Secret
   - Replace the placeholder values in your `.env` file

## Features Implemented

### 1. Auto-Logout on Page Close
- **Session Management**: Users are automatically logged out when they close the browser tab or refresh the page
- **Activity Tracking**: Session expires after 24 hours of inactivity
- **Event Listeners**: Monitors page visibility, focus, and user activity

### 2. Cloudinary Integration
- **Profile Photos**: Users can upload profile photos that are stored on Cloudinary
- **Company Logos**: Employers can upload company logos
- **Image Optimization**: Automatic resizing and optimization (400x400px, face detection)
- **File Validation**: Supports JPG, PNG, GIF, WebP formats with 5MB limit
- **Automatic Cleanup**: Old images are deleted when new ones are uploaded

## API Endpoints

### User Profile Photo
- `POST /api/upload/user/profile-photo` - Upload user profile photo
- `DELETE /api/upload/user/profile-photo` - Delete user profile photo

### Employer Profile Photo
- `POST /api/upload/employer/profile-photo` - Upload employer profile photo
- `DELETE /api/upload/employer/profile-photo` - Delete employer profile photo

### Company Logo
- `POST /api/upload/employer/company-logo` - Upload company logo
- `DELETE /api/upload/employer/company-logo` - Delete company logo

## Frontend Integration

### Session Management
The frontend includes a session manager that:
- Automatically logs out users when the page is closed
- Tracks user activity and session timeout
- Provides methods to check login status and user type

### Image Upload Components
- **UserProfile**: Includes profile photo upload with Cloudinary integration
- **EmployerProfile**: Includes company logo upload with Cloudinary integration
- **File Validation**: Client-side validation for file size and type
- **Progress Indicators**: Loading states during upload

## Usage

1. **Start the Backend Server**
   ```bash
   cd jobzee-backend
   npm start
   ```

2. **Start the Frontend**
   ```bash
   cd jobzee-frontend
   npm start
   ```

3. **Test the Features**
   - Login as a user or employer
   - Navigate to profile page
   - Upload a profile photo/logo
   - Close the browser tab to test auto-logout
   - Reopen and verify you're logged out

## Security Features

- **File Type Validation**: Only image files are allowed
- **File Size Limits**: Maximum 5MB per file
- **Authentication Required**: All upload endpoints require valid JWT tokens
- **Automatic Cleanup**: Old images are deleted when new ones are uploaded
- **Secure URLs**: Cloudinary provides HTTPS URLs for all images

## Error Handling

- **Network Errors**: Proper error messages for network issues
- **Upload Failures**: Clear feedback when uploads fail
- **Validation Errors**: Client and server-side validation
- **Session Expiry**: Automatic logout when session expires
