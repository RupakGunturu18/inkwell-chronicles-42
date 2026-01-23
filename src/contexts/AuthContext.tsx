import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (emailOrUsername: string, password: string) => Promise<void>;
    signup: (name: string, username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();

        if (currentUser && token) {
            setUser(currentUser);
            // Connect to Socket.IO
            socketService.connect(token);
        }

        setLoading(false);
    }, []);

    const login = async (emailOrUsername: string, password: string) => {
        const data = await authService.login(emailOrUsername, password);
        setUser(data.user);
        // Connect to Socket.IO
        socketService.connect(data.token);
    };

    const signup = async (name: string, username: string, email: string, password: string) => {
        const data = await authService.signup(name, username, email, password);
        setUser(data.user);
        // Connect to Socket.IO
        socketService.connect(data.token);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        // Disconnect from Socket.IO
        socketService.disconnect();
    };

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
