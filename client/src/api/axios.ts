import axios from "axios";

// Create a custom axios instance with a base URL from .env
// Instead of writing the full URL every time (http://localhost:5000/api/shifts),
// you just write: api.get('/shifts')
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // set in client/.env as VITE_API_URL=http://localhost:5000/api
});

// Interceptor = runs automatically before EVERY request this instance makes
// Think of it like a security guard that checks your bag before you enter —
// here it checks if you have a JWT token and staples it to the request header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // grab JWT saved at login
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // attach it — server uses this to identify who you are
    }
    return config;
});

// Response interceptor — if the server says our token is expired/invalid (401),
// the remembered session is dead. Clear it and bounce to the landing page so the
// user re-logs in cleanly, instead of getting stuck on a broken dashboard.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginAt');
            // Avoid a redirect loop if we're already on a public page
            if (!['/', '/login/worker', '/login/manager'].includes(window.location.pathname)) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// HOW TO USE IN OTHER FILES:
// import api from '@/api/axios'
// api.get('/shifts/my')        — GET request, token attached automatically
// api.post('/shifts/start', { siteId })  — POST request, same