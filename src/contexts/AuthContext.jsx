import { createContext, useContext, useState, useEffect } from 'react';
import { login as mockLogin, signup as mockSignup, logout as mockLogout, getCurrentSession } from '../utils/mockAuth';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const session = getCurrentSession();
        if (session) {
            setUser(session.user);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);
            const session = await mockLogin(credentials);
            setUser(session.user);
            return session.user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            setLoading(true);
            const session = await mockSignup(userData);
            setUser(session.user);
            return session.user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setError(null);
            await mockLogout();
            setUser(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
