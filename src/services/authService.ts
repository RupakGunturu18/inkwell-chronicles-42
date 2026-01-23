import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    // Signup
    signup: async (name: string, username: string, email: string, password: string) => {
        const response = await api.post('/signup', { name, username, email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Login
    login: async (emailOrUsername: string, password: string) => {
        const response = await api.post('/login', { emailOrUsername, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Forgot password
    forgotPassword: async (email: string) => {
        const response = await api.post('/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (token: string, password: string) => {
        const response = await api.post(`/reset-password/${token}`, { password });
        return response.data;
    },

    // Check username availability
    checkUsername: async (username: string) => {
        try {
            const response = await axios.get(`${API_URL}/check-username/${username}`);
            console.log('Username check response:', response.data);
            return response.data.available;
        } catch (error) {
            console.error('Username check error:', error);
            // If there's an error, assume username is available to not block signup
            return true;
        }
    },

    // Search users
    searchUsers: async (query: string) => {
        const response = await api.get(`/search-users?q=${query}`);
        return response.data.users;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get current user
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Get token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Check if authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};
