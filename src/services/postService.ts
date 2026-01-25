import axios from 'axios';

const API_URL = 'http://localhost:5001/api/posts';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // Increased to 30s
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

export const postService = {
    // Get all posts
    getAllPosts: async () => {
        const response = await api.get('/');
        return response.data;
    },

    // Get post by ID
    getPostById: async (id: string) => {
        const response = await api.get(`/${id}`);
        return response.data;
    },

    // Get user drafts
    getUserDrafts: async () => {
        const response = await api.get('/drafts');
        return response.data;
    },

    // Get user published posts
    getMyPosts: async () => {
        const response = await api.get('/my-posts');
        return response.data;
    },

    // Create post
    createPost: async (postData: any) => {
        const response = await api.post('/', postData);
        return response.data;
    },

    // Update post
    updatePost: async (id: string, postData: any) => {
        const response = await api.put(`/${id}`, postData);
        return response.data;
    },

    // Delete post
    deletePost: async (id: string) => {
        const response = await api.delete(`/${id}`);
        return response.data;
    },

    // Like post
    likePost: async (id: string) => {
        const response = await api.post(`/${id}/like`);
        return response.data;
    },

    // Comment on post
    commentOnPost: async (id: string, text: string) => {
        const response = await api.post(`/${id}/comment`, { text });
        return response.data;
    }
};
