import { supabase } from '../lib/supabase';

/**
 * Authentication Service
 * Handles user authentication, session management, and profile operations
 */

// Sign up new user
export const signUp = async (email, password, fullName) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { data: null, error: error.message };
    }
};

// Sign in existing user
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
