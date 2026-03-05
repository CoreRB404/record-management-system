import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/dataService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const stored = sessionStorage.getItem('user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    // Verify token is still valid with the server
                    const res = await authService.getMe();
                    // Update user data with fresh server data, keep the token
                    setUser({ ...res.data.data, token: parsed.token });
                } catch {
                    // Token is invalid or expired — clear it
                    sessionStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifyAuth();
    }, []);

    const login = async (email, password) => {
        const res = await authService.login({ email, password });
        const userData = res.data.data;
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};
