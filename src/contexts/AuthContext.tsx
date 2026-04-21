import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    profileImage?: string;
    bio?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (emailOrUsername: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    signup: (name: string, username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = authService.getToken();
            const storedUser = authService.getCurrentUser();

            if (token) {
                // If we have a stored user, set it immediately for a fast UI response
                if (storedUser) setUser(storedUser);

                try {
                    // Then fetch the latest data from server
                    const userProfile = await authService.getUserProfile();
                    setUser(userProfile);
                    localStorage.setItem('user', JSON.stringify(userProfile));
                    socketService.connect(token);
                } catch (e) {
                    console.error("Failed to sync profile with server:", e);
                    if (token) socketService.connect(token);
                }
            }
            setLoading(false);
        };

        initAuth();
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

    const loginWithGoogle = async (idToken: string) => {
        const data = await authService.googleLogin(idToken);
        setUser(data.user);
        socketService.connect(data.token);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        // Disconnect from Socket.IO
        socketService.disconnect();
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
        loading,
        updateUser
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
