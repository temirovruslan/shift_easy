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

export default api;

// HOW TO USE IN OTHER FILES:
// import api from '@/api/axios'
// api.get('/shifts/my')        — GET request, token attached automatically
// api.post('/shifts/start', { siteId })  — POST request, same