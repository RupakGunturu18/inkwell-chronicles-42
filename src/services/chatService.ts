import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://inkwell-chronicles-42.onrender.com';
const API_URL = `${API_BASE_URL}/api/chat`;

// Create axios instance with auth
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const chatService = {
    // Send message
    sendMessage: async (receiverId: string, content: string) => {
        const response = await api.post('/send', { receiverId, content });
        return response.data;
    },

    // Get conversations
    getConversations: async () => {
        const response = await api.get('/conversations');
        return response.data.conversations;
    },

    // Get messages with a user
    getMessages: async (userId: string, page = 1, limit = 50) => {
        const response = await api.get(`/messages/${userId}?page=${page}&limit=${limit}`);
        return response.data;
    },

    // Mark message as read
    markAsRead: async (messageId: string) => {
        const response = await api.put(`/read/${messageId}`);
        return response.data;
    },

    // Mark all messages from a user as read
    markAllAsRead: async (userId: string) => {
        const response = await api.put(`/read-all/${userId}`);
        return response.data;
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await api.get('/unread-count');
        return response.data.count;
    }
};
