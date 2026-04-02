import { supabase } from '../lib/supabase';

/**
 * AUTHENTICATION SERVICE
 * This uses Supabase's built-in GoTrue auth system. 
 * Why? It handles JWT tokens, salted password hashing, and email verification
 * automatically
 */

// SIGN UP: Creates a new user in the auth.users table.
// We also store the "full_name" in the user's metadata for display in the UI.
export const signUp = async (email, password, fullName) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/login?verified=true`,
            },
        });

        if (error) throw error;

        // Check if the user already exists (identities will be empty if account enumeration protection is on)
        if (data?.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error('An account with this email already exists. Please log in instead.');
        }

        return { data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { data: null, error: error.message };
    }
};

// SIGN IN: Authenticates with email and password.
// If successful, Supabase returns a JWT token which is stored in LocalStorage.
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { data: null, error: error.message };
    }
};

// Sign out current user
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error: error.message };
    }
};

// Get current session
export const getSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { session, error: null };
    } catch (error) {
        console.error('Get session error:', error);
        return { session: null, error: error.message };
    }
};

// Get current user
export const getCurrentUser = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user, error: null };
    } catch (error) {
        console.error('Get user error:', error);
        return { user: null, error: error.message };
    }
};

// Update user profile
export const updateProfile = async (updates) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates,
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update profile error:', error);
        return { data: null, error: error.message };
    }
};

// Reset password
export const resetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { data: null, error: error.message };
    }
};

// Update password
export const updatePassword = async (newPassword) => {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update password error:', error);
        return { data: null, error: error.message };
    }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
};
