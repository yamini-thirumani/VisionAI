import axios from 'axios';

// Without VITE_API_URL, requests hit the Vite dev server and return HTML → broken JSON / missing `data.test`.
const resolvedBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

const api = axios.create({
  baseURL: resolvedBase,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;