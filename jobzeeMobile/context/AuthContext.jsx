import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

const AuthContext = createContext(undefined);

// Storage wrapper that handles AsyncStorage errors gracefully
const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('Storage not available, using memory only');
      return null;
    }
  },
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('Storage not available, using memory only');
    }
  },
  async multiSet(pairs) {
    try {
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.warn('Storage not available, using memory only');
    }
  },
  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.warn('Storage not available, using memory only');
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data from storage on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUserType = await storage.getItem(STORAGE_KEYS.USER_TYPE);
      
      if (storedUserType === 'user') {
        const storedUser = await storage.getItem(STORAGE_KEYS.USER_DATA);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setUserType('user');
        }
      } else if (storedUserType === 'employer') {
        const storedEmployer = await storage.getItem(STORAGE_KEYS.EMPLOYER_DATA);
        if (storedEmployer) {
          setEmployer(JSON.parse(storedEmployer));
          setUserType('employer');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, type) => {
    try {
      const endpoint = type === 'user' ? API_ENDPOINTS.AUTH.LOGIN : API_ENDPOINTS.EMPLOYER.LOGIN;
      
      // Employer login uses 'companyEmail', user login uses 'email'
      const payload = type === 'employer' 
        ? { companyEmail: email, password }
        : { email, password };
      
      const response = await api.post(endpoint, payload);
      
      const { token, user: userData, employer: employerData } = response.data;
      
      if (type === 'user' && userData) {
        await storage.multiSet([
          [STORAGE_KEYS.USER_TOKEN, token],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
          [STORAGE_KEYS.USER_TYPE, 'user'],
        ]);
        setUser(userData);
        setUserType('user');
      } else if (type === 'employer' && employerData) {
        await storage.multiSet([
          [STORAGE_KEYS.EMPLOYER_TOKEN, token],
          [STORAGE_KEYS.EMPLOYER_DATA, JSON.stringify(employerData)],
          [STORAGE_KEYS.USER_TYPE, 'employer'],
        ]);
        setEmployer(employerData);
        setUserType('employer');
      }
    } catch (error) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).join('\n');
        throw new Error(errorMessages);
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data, type) => {
    try {
      const endpoint = type === 'user' ? API_ENDPOINTS.AUTH.REGISTER : API_ENDPOINTS.EMPLOYER.REGISTER;
      
      const response = await api.post(endpoint, data);
      
      const { token, user: userData, employer: employerData } = response.data;
      
      if (type === 'user' && userData) {
        await storage.multiSet([
          [STORAGE_KEYS.USER_TOKEN, token],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
          [STORAGE_KEYS.USER_TYPE, 'user'],
        ]);
        setUser(userData);
        setUserType('user');
      } else if (type === 'employer' && employerData) {
        await storage.multiSet([
          [STORAGE_KEYS.EMPLOYER_TOKEN, token],
          [STORAGE_KEYS.EMPLOYER_DATA, JSON.stringify(employerData)],
          [STORAGE_KEYS.USER_TYPE, 'employer'],
        ]);
        setEmployer(employerData);
        setUserType('employer');
      }
    } catch (error) {
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).join('\n');
        throw new Error(errorMessages);
      }
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await storage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.EMPLOYER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.EMPLOYER_DATA,
        STORAGE_KEYS.USER_TYPE,
      ]);
      setUser(null);
      setEmployer(null);
      setUserType(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (data) => {
    try {
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
      setUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateEmployer = async (data) => {
    try {
      await storage.setItem(STORAGE_KEYS.EMPLOYER_DATA, JSON.stringify(data));
      setEmployer(data);
    } catch (error) {
      console.error('Error updating employer:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employer,
        userType,
        loading,
        login,
        register,
        logout,
        updateUser,
        updateEmployer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
