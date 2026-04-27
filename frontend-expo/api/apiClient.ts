import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://dev.sopa-it.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  let token = null;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('jwt_token');
  } else {
    token = await SecureStore.getItemAsync('jwt_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('jwt_token', token);
  } else {
    await SecureStore.setItemAsync('jwt_token', token);
  }
};

export const clearToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('jwt_token');
  } else {
    await SecureStore.deleteItemAsync('jwt_token');
  }
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('jwt_token');
  }
  return await SecureStore.getItemAsync('jwt_token');
};

export default apiClient;
