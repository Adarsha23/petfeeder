import { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, onAuthStateChange } from '../services/authService';

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

    // Initialize auth state and listen for changes
    useEffect(() => {
        // Check for existing session
        const initializeAuth = async () => {
            try {
                const { user: currentUser } = await getCurrentUser();
                setUser(currentUser);
            } catch (err) {
                console.error('Error initializing auth:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);

            const { data, error: signInError } = await signIn(
                credentials.email,
                credentials.password
            );

            if (signInError) {
                throw new Error(signInError);
            }

            setUser(data.user);
            return data.user;
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

            const { data, error: signUpError } = await signUp(
                userData.email,
                userData.password,
                userData.name
            );

            if (signUpError) {
                throw new Error(signUpError);
            }

            // DON'T set user here - they need to verify email first
            // setUser(data.user);

            // Return the data but don't log them in
            return data;
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
            const { error: signOutError } = await signOut();

            if (signOutError) {
                throw new Error(signOutError);
            }

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
        isAuthenticated: !!user && user.email_confirmed_at !== null,
        isEmailVerified: user?.email_confirmed_at !== null
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

