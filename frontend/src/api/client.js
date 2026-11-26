import axios from 'axios';
import { loadingTracker } from './loadingTracker';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Automatically normalizes base URL whether user includes /api/v1 or just domain
const normalizeBaseUrl = (url) => {
  if (!url || url === '/api/v1') return '/api/v1';
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api/v1')) {
    if (clean.endsWith('/api')) {
      clean = `${clean}/v1`;
    } else {
      clean = `${clean}/api/v1`;
    }
  }
  return clean;
};

const API_BASE_URL = normalizeBaseUrl(rawBaseUrl);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: increment global loading counter & attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    loadingTracker.startRequest(config);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingTracker.endRequest(error?.config);
    return Promise.reject(error);
  }
);

// Response interceptor: decrement loading counter, handle 401 and refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    loadingTracker.endRequest(response.config);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    // Check if error is a 401 eligible for refresh token retry
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh')
      ) {
        loadingTracker.endRequest(originalRequest);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            loadingTracker.endRequest(originalRequest);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            loadingTracker.endRequest(originalRequest);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        loadingTracker.endRequest(originalRequest);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token: newRefreshToken } = resp.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        loadingTracker.endRequest(originalRequest);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        loadingTracker.endRequest(originalRequest);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Decrement request counter for all other errors (4xx, 5xx, network, timeouts)
    loadingTracker.endRequest(originalRequest);
    return Promise.reject(error);
  }
);

export { loadingTracker };
export default apiClient;
