import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { store } from '../redux/store';
import { logout, setCredentials } from '../redux/slices/authSlice';
import { resetToLogin } from '../navigation/navigationRef';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth.accessToken || (await AsyncStorage.getItem('calora_access_token'));

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('calora_refresh_token');
        if (!refreshToken) {
          // No refresh token available, session is gone
          await AsyncStorage.removeItem('calora_access_token');
          await AsyncStorage.removeItem('calora_user_profile');
          store.dispatch(logout());
          resetToLogin();
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        }, { timeout: 15000 });

        const newTokens = refreshResponse.data.data;
        await AsyncStorage.setItem('calora_access_token', newTokens.accessToken);
        await AsyncStorage.setItem('calora_refresh_token', newTokens.refreshToken);

        const currentUser = store.getState().auth.user;
        if (currentUser) {
          store.dispatch(
            setCredentials({
              user: currentUser,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
            })
          );
        }

        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        // ONLY clear tokens and reset to login if the server EXPLICITLY rejected the refresh token (401 / 403).
        // If it was a network drop, timeout, or server wake-up (502/503), KEEP tokens so the user isn't logged out!
        const isAuthRejection = refreshErr?.response?.status === 401 || refreshErr?.response?.status === 403;
        if (isAuthRejection) {
          await AsyncStorage.removeItem('calora_access_token');
          await AsyncStorage.removeItem('calora_refresh_token');
          await AsyncStorage.removeItem('calora_user_profile');
          store.dispatch(logout());
          resetToLogin();
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
