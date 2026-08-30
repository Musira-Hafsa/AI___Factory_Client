import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const api = axios.create({ baseURL });

let authToken = localStorage.getItem('token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getAuthToken() {
  return authToken;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// Normalise the error shape so components can just read err.message.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Network error — is the API server running?';
    return Promise.reject(new Error(message));
  }
);
