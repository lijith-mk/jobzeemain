import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../constants/config';

// Storage wrapper that handles AsyncStorage errors gracefully
const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      // Ignore errors
    }
  },
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get user type to determine which token to use
      const userType = await storage.getItem(STORAGE_KEYS.USER_TYPE);
      
      let token = null;
      if (userType === 'employer') {
        token = await storage.getItem(STORAGE_KEYS.EMPLOYER_TOKEN);
      } else {
        token = await storage.getItem(STORAGE_KEYS.USER_TOKEN);
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await storage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.EMPLOYER_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.EMPLOYER_DATA,
        STORAGE_KEYS.USER_TYPE,
      ]);
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  get: (url, config) => {
    return apiClient.get(url, config);
  },
  
  post: (url, data, config) => {
    return apiClient.post(url, data, config);
  },
  
  put: (url, data, config) => {
    return apiClient.put(url, data, config);
  },
  
  delete: (url, config) => {
    return apiClient.delete(url, config);
  },
  
  patch: (url, data, config) => {
    return apiClient.patch(url, data, config);
  },
};

// Upload file helper
export const uploadFile = async (endpoint, file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
  
  const userType = await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE);
  let token = null;
  
  if (userType === 'employer') {
    token = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYER_TOKEN);
  } else {
    token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  }
  
  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
};

export default apiClient;
