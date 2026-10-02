import axios from 'axios';

const api = axios.create({
  baseURL: 'https://eduvoice-ai-2.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await api.post('/api/auth/token/refresh/', {
            refresh: refreshToken,
          });

          if (res.status === 200) {
            const newAccessToken = res.data.access;

            localStorage.setItem('access_token', newAccessToken);

            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          window.location.href = '/login';

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;