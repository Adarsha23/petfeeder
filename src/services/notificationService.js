import { supabase } from '../lib/supabase';

/**
 * Notification Service
 * Handles user notifications for feeding events, device status, and alerts
 */

// Get all notifications for current user
export const getNotifications = async (limit = 50, unreadOnly = false) => {
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('read', false);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get notifications error:', error);
        return { data: null, error: error.message };
    }
};

// Get unread notification count
export const getUnreadCount = async () => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);

        if (error) throw error;
        return { count, error: null };
    } catch (error) {
        console.error('Get unread count error:', error);
        return { count: 0, error: error.message };
    }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Mark as read error:', error);
        return { data: null, error: error.message };
    }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Mark all as read error:', error);
        return { data: null, error: error.message };
    }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete notification error:', error);
        return { error: error.message };
    }
};

// Delete all read notifications
export const deleteAllRead = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
            .eq('read', true);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete all read error:', error);
        return { error: error.message };
    }
};

// Subscribe to new notifications
export const subscribeToNotifications = (callback) => {
    const subscription = supabase
        .channel('notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

// Create notification (typically called by backend/triggers, but can be used for testing)
export const createNotification = async (type, title, message, deviceId = null, metadata = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('notifications')
            .insert([
                {
                    user_id: user.id,
                    device_id: deviceId,
                    type,
                    title,
                    message,
                    metadata,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Create notification error:', error);
        return { data: null, error: error.message };
    }
};
