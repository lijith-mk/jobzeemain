/**
 * Google Sign-In utility for React Native
 * Uses @react-native-google-signin/google-signin for native authentication
 * 
 * Setup Instructions:
 * 1. npm install @react-native-google-signin/google-signin
 * 2. Configure OAuth 2.0 credentials in Google Cloud Console
 * 3. Add configuration to app.json
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { STORAGE_KEYS } from '../constants/config';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://jobzeemain-zjrh.onrender.com';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId || '', // From Google Cloud Console
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
  }
};

/**
 * Sign in with Google
 * Returns user info and ID token
 */
export const signInWithGoogle = async () => {
  try {
    // Check if device supports Google Play Services (Android)
    await GoogleSignin.hasPlayServices();
    
    // Sign in and get user info
    const userInfo = await GoogleSignin.signIn();
    
    // Get ID token
    const tokens = await GoogleSignin.getTokens();
    
    return {
      userInfo: userInfo.user,
      idToken: tokens.idToken,
    };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

/**
 * Authenticate with backend using Google ID token
 */
export const authenticateWithGoogle = async (idToken, userType = 'user') => {
  // Determine the endpoint based on user type
  const endpoint = userType === 'employer' 
    ? `${API_BASE_URL}/api/employer/google`
    : `${API_BASE_URL}/api/auth/google`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ credential: idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Google authentication failed');
    }

    // Store token and user data with correct keys
    if (userType === 'user') {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_TOKEN, data.token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)],
        [STORAGE_KEYS.USER_TYPE, 'user'],
      ]);
    } else {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.EMPLOYER_TOKEN, data.token],
        [STORAGE_KEYS.EMPLOYER_DATA, JSON.stringify(data.employer)],
        [STORAGE_KEYS.USER_TYPE, 'employer'],
      ]);
    }

    return data;
  } catch (error) {
    console.error('Backend authentication error:', error);
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('Signed out from Google');
  } catch (error) {
    console.error('Error signing out from Google:', error);
  }
};

/**
 * Check if user is signed in
 */
export const isSignedIn = async () => {
  return await GoogleSignin.isSignedIn();
};

/**
 * Get current user info (if signed in)
 */
export const getCurrentUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo.user;
  } catch (error) {
    console.log('No signed in user');
    return null;
  }
};
