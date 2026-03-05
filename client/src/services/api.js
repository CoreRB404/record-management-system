import axios from 'axios';

// Vite exposes environment variables prefixed with VITE_ to import.meta.env
// This allows us to override the backend host when tunnelling.
// If the variable is omitted we default to '/api' so the dev-server proxy
// (configured in vite.config.js) will forward to localhost:5000 automatically.

function makeApiUrl(raw) {
    if (!raw) return '/api';
    // remove any trailing slashes
    let url = raw.replace(/\/+$/g, '');
    // append /api if not already present
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
}

const API_URL = makeApiUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
