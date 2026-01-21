const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const UserSignIn = require('../models/UserSignIn');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    console.log('Registration attempt for email:', email);
    
    // Enhanced validation
    const errors = {};
    
    // Name validation
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      errors.name = 'Name must be between 2 and 50 characters';
    }
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      errors.name = 'Name can only contain letters and spaces';
    }
    
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address';
    }
    
    // Phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phone || !phoneRegex.test(phone) || phone.length < 10) {
      errors.phone = 'Please provide a valid phone number with country code';
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Creating new user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
    });

    console.log('User registered successfully:', email);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);
    
    // Enhanced validation for login
    const errors = {};
    
    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password || !password.trim()) {
      errors.password = 'Password is required';
    }
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors,
        errorType: 'validation_error'
      });
    }
    
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Looking for user with normalized email:', normalizedEmail);
    
    // Add timeout and error handling for database query
    const user = await User.findOne({ email: normalizedEmail }).maxTimeMS(10000);
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(400).json({ 
        message: 'Invalid email or password',
        errorType: 'user_not_found'
      });
    }

    console.log('User found:', user.email, 'ID:', user._id);
    console.log('User stored password exists:', !!user.password);
    // Block suspended/deleted users
    if (user.status === 'suspended' || user.isActive === false) {
      return res.status(403).json({
        message: 'Your account is suspended. Please contact support.',
        errorType: 'account_blocked'
      });
    }
    if (user.status === 'deleted') {
      return res.status(403).json({
        message: 'Your account has been deactivated.',
        errorType: 'account_deleted'
      });
    }
    
    // Verify password with enhanced error handling
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result:', isMatch);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({ 
        message: 'Authentication error',
        errorType: 'auth_system_error'
      });
    }
    
    if (!isMatch) {
      console.log('Password mismatch for user:', normalizedEmail);
      return res.status(400).json({ 
        message: 'Invalid email or password',
        errorType: 'invalid_password'
      });
    }

    console.log('Password matched, generating token...');
    
    // Generate JWT token with enhanced payload
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_jwt_secret_key', {
      expiresIn: '7d',
    });

    console.log('Login successful for user:', normalizedEmail);
    
    // Fire-and-forget: upsert user sign-in summary (avoid duplicates)
    try {
      UserSignIn.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            method: 'password',
            authProvider: user.authProvider || 'local',
            avatar: user.avatar,
            profilePhoto: user.profilePhoto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch(() => {});
    } catch (_) {}

    // Return success response with complete user data
    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isOnboarded: user.isOnboarded || false,
        profilePhoto: user.profilePhoto || null
      },
      loginTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('Login error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Handle specific MongoDB errors
    if (err.name === 'MongoTimeoutError' || err.name === 'MongoNetworkError') {
      return res.status(503).json({ 
        message: 'Database connection issue. Please try again.',
        errorType: 'database_timeout'
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Data validation error',
        errorType: 'validation_error'
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Internal server error. Please try again.',
      errorType: 'server_error'
    });
  }
};

// New controller for onboarding
exports.updateOnboarding = async (req, res) => {
  try {
    const { userId } = req.params;
    const onboardingData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};
    
    // Always update onboarding status
    updateData.isOnboarded = true;
    
    // Only include other fields if they are provided and not undefined/null
    Object.keys(onboardingData).forEach(key => {
      if (key !== 'isOnboarded' && onboardingData[key] !== undefined && onboardingData[key] !== null) {
        updateData[key] = onboardingData[key];
      }
    });

    // Update user with onboarding data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Onboarding updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isOnboarded: updatedUser.isOnboarded,
        onboardingSkipped: updatedUser.onboardingSkipped
      }
    });
  } catch (err) {
    console.error('Onboarding update error:', err);
    res.status(500).json({ message: 'Onboarding update failed', error: err.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile fetched successfully for:', user.email);
    res.json({
      message: 'Profile fetched successfully',
      user: user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Updating profile for user ID:', req.user.id);
    console.log('Update data received:', JSON.stringify(req.body, null, 2));
    
    const userId = req.user.id;
    const updateData = req.body;
    
    // Handle profilePicture to profilePhoto mapping (frontend uses profilePicture, backend stores as profilePhoto)
    if (updateData.profilePicture) {
      updateData.profilePhoto = updateData.profilePicture;
      delete updateData.profilePicture;
    }
    
    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Validate expected salary if provided
    if (updateData.expectedSalary) {
      if (updateData.expectedSalary.min && isNaN(Number(updateData.expectedSalary.min))) {
        return res.status(400).json({ message: 'Invalid minimum salary value' });
      }
      if (updateData.expectedSalary.max && isNaN(Number(updateData.expectedSalary.max))) {
        return res.status(400).json({ message: 'Invalid maximum salary value' });
      }
      // Convert to numbers
      if (updateData.expectedSalary.min) {
        updateData.expectedSalary.min = Number(updateData.expectedSalary.min);
      }
      if (updateData.expectedSalary.max) {
        updateData.expectedSalary.max = Number(updateData.expectedSalary.max);
      }
    }
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for update:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found, updating profile...');
    
    // Use findByIdAndUpdate for better error handling
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        select: '-password' // Exclude password from response
      }
    );
    
    if (!updatedUser) {
      console.log('Failed to update user profile');
      return res.status(500).json({ message: 'Failed to update profile' });
    }
    
    console.log('Profile updated successfully for:', updatedUser.email);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors,
        errorType: 'validation_error'
      });
    }
    
    // Handle duplicate key errors (like unique email)
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate value detected',
        errorType: 'duplicate_error'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile',
      errorType: 'server_error'
    });
  }
};

// Google OAuth authentication
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    
    console.log('Google OAuth attempt with credential');
    
    if (!credential) {
      return res.status(400).json({ 
        message: 'Google credential is required',
        errorType: 'validation_error'
      });
    }
    
    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verificationError) {
      console.error('Google token verification failed:', verificationError);
      return res.status(400).json({ 
        message: 'Invalid Google token',
        errorType: 'invalid_token'
      });
    }
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('Google user verified:', { email, name, googleId });
    
    // Validate required Google data
    if (!email || !name || !googleId) {
      return res.status(400).json({ 
        message: 'Incomplete Google profile data',
        errorType: 'incomplete_profile'
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId }
      ]
    });
    
    if (user) {
      console.log('Existing user found, logging in:', email);
      // Block suspended/deleted users
      if (user.status === 'suspended' || user.isActive === false) {
        return res.status(403).json({
          message: 'Your account is suspended. Please contact support.',
          errorType: 'account_blocked'
        });
      }
      if (user.status === 'deleted') {
        return res.status(403).json({
          message: 'Your account has been deactivated.',
          errorType: 'account_deleted'
        });
      }
      
      // Update user with Google data if they registered with email/password but now using Google
      if (!user.googleId) {
        console.log('Linking Google account to existing user');
        user.googleId = googleId;
        user.authProvider = 'google';
        user.avatar = picture;
        await user.save();
      }
      
      // Update avatar if it changed
      if (user.avatar !== picture) {
        user.avatar = picture;
        await user.save();
      }
    } else {
      console.log('Creating new user with Google OAuth:', email);
      
      // Create new user with Google OAuth
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        googleId: googleId,
        authProvider: 'google',
        avatar: picture,
        // Phone and password are not required for Google OAuth users
        // They will be prompted during onboarding if needed
        isOnboarded: false
      });
      
      console.log('New Google user created successfully:', email);
    }
    
    // Generate JWT token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback_jwt_secret_key', {
      expiresIn: '7d',
    });
    
    console.log('Google OAuth successful for user:', email);
    
    // Fire-and-forget: upsert Google sign-in summary (avoid duplicates)
    try {
      UserSignIn.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            method: 'google',
            authProvider: 'google',
            avatar: user.avatar,
            profilePhoto: user.profilePhoto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch(() => {});
    } catch (_) {}

    // Return success response
    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        isOnboarded: user.isOnboarded || false,
        authProvider: user.authProvider,
        avatar: user.avatar,
        profilePhoto: user.profilePhoto || null
      },
      loginTime: new Date().toISOString(),
      isNewUser: !user.isOnboarded // Indicate if this is a first-time Google user
    });
    
  } catch (err) {
    console.error('Google OAuth error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    // Handle specific errors
    if (err.name === 'MongoTimeoutError' || err.name === 'MongoNetworkError') {
      return res.status(503).json({ 
        message: 'Database connection issue. Please try again.',
        errorType: 'database_timeout'
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Data validation error',
        errorType: 'validation_error',
        details: err.errors
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Google authentication failed. Please try again.',
      errorType: 'server_error'
    });
  }
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Forgot password request for email:', email);

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Email is required',
        errorType: 'validation_error'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
        errorType: 'validation_error'
      });
    }

    // Find user by email
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log('User not found for forgot password:', normalizedEmail);
      return res.json({
        message: 'If an account with that email exists, we have sent a password reset link to it.',
        success: true
      });
    }

    // Check if user uses Google OAuth (no password to reset)
    if (user.authProvider === 'google' && !user.password) {
      console.log('Google OAuth user attempting password reset:', normalizedEmail);
      return res.json({
        message: 'This account uses Google Sign-In. Please use the Google Sign-In option to access your account.',
        errorType: 'google_auth_user'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour from now)
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    console.log('Reset token generated for user:', normalizedEmail);

    // Send password reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken, 'user');
      console.log('Password reset email sent successfully to:', normalizedEmail);

      // In development, also provide the reset link for easy testing
      const response = {
        message: 'Password reset link has been sent to your email address.',
        success: true
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.devInfo = {
          resetToken: resetToken,
          resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
          message: 'Development mode: You can use this link to test password reset'
        };
      }
      
      res.json(response);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // If email fails, still provide the reset token for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Email failed, providing reset token for debugging:', resetToken);
        return res.json({
          message: 'Email service unavailable. Reset token generated for testing.',
          success: true,
          resetToken: resetToken,
          resetLink: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
        });
      }
      
      // Remove the reset token if email failed to send in production
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: 'Failed to send password reset email. Please try again later.',
        errorType: 'email_send_error'
      });
    }
  } catch (err) {
    console.error('Forgot password error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    res.status(500).json({
      message: 'An error occurred while processing your request. Please try again later.',
      errorType: 'server_error'
    });
  }
};

// Reset Password - Verify token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log('Password reset attempt with token');

    // Validation
    const errors = {};

    if (!token) {
      errors.token = 'Reset token is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required';
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password && !passwordRegex.test(password)) {
      errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
        errorType: 'validation_error'
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({
        message: 'Invalid or expired password reset token. Please request a new password reset.',
        errorType: 'invalid_token'
      });
    }

    console.log('Valid reset token found for user:', user.email);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.authProvider = 'local'; // Ensure auth provider is set to local after password reset
    await user.save();

    console.log('Password reset successful for user:', user.email);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
      success: true
    });
  } catch (err) {
    console.error('Reset password error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    res.status(500).json({
      message: 'An error occurred while resetting your password. Please try again later.',
      errorType: 'server_error'
    });
  }
};

// Verify reset token (for frontend validation)
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: 'Reset token is required',
        valid: false,
        errorType: 'validation_error'
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired password reset token',
        valid: false,
        errorType: 'invalid_token'
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.max(0, Math.floor((user.resetPasswordExpires - new Date()) / 1000 / 60)); // minutes

    res.json({
      message: 'Reset token is valid',
      valid: true,
      user: {
        email: user.email,
        name: user.name
      },
      timeRemaining: timeRemaining
    });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({
      message: 'An error occurred while verifying the reset token',
      valid: false,
      errorType: 'server_error'
    });
  }
};
