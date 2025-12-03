import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Command Service
 * Handles command queue operations for offline-first command delivery
 */

// Generate idempotency token
const generateIdempotencyToken = () => {
    return `${Date.now()}-${uuidv4()}`;
};

// Queue a feed command
export const queueFeedCommand = async (deviceId, targetGrams, petId = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const idempotencyToken = generateIdempotencyToken();

        const { data, error } = await supabase
            .from('command_queue')
            .insert([
                {
                    device_id: deviceId,
                    user_id: user.id,
                    command_type: 'FEED',
                    payload: {
                        target_grams: targetGrams,
                        pet_id: petId,
                    },
                    status: 'PENDING',
                    idempotency_token: idempotencyToken,
                    priority: 0,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        // Also create a feeding event record
        await createFeedingEvent(deviceId, user.id, targetGrams, petId);

        return { data, error: null };
    } catch (error) {
        console.error('Queue feed command error:', error);
        return { data: null, error: error.message };
    }
};

// Queue a pause command
export const queuePauseCommand = async (deviceId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const idempotencyToken = generateIdempotencyToken();

        const { data, error } = await supabase
            .from('command_queue')
            .insert([
                {
                    device_id: deviceId,
                    user_id: user.id,
                    command_type: 'PAUSE',
                    payload: {},
                    status: 'PENDING',
                    idempotency_token: idempotencyToken,
                    priority: 1, // Higher priority
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Queue pause command error:', error);
        return { data: null, error: error.message };
    }
};

// Queue a resume command
export const queueResumeCommand = async (deviceId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const idempotencyToken = generateIdempotencyToken();

        const { data, error } = await supabase
            .from('command_queue')
            .insert([
                {
                    device_id: deviceId,
                    user_id: user.id,
                    command_type: 'RESUME',
                    payload: {},
                    status: 'PENDING',
                    idempotency_token: idempotencyToken,
                    priority: 1,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Queue resume command error:', error);
        return { data: null, error: error.message };
    }
};

// Get pending commands for a device
export const getPendingCommands = async (deviceId) => {
    try {
        const { data, error } = await supabase
            .from('command_queue')
            .select('*')
            .eq('device_id', deviceId)
            .eq('status', 'PENDING')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get pending commands error:', error);
        return { data: null, error: error.message };
    }
};

// Get command history for a device
export const getCommandHistory = async (deviceId, limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('command_queue')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get command history error:', error);
        return { data: null, error: error.message };
    }
};

// Update command status (typically called by device/backend)
export const updateCommandStatus = async (commandId, status, errorMessage = null) => {
    try {
        const updates = {
            status,
            error_message: errorMessage,
        };

        if (status === 'DELIVERED') {
            updates.delivered_at = new Date().toISOString();
        } else if (status === 'EXECUTED') {
            updates.executed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('command_queue')
            .update(updates)
            .eq('id', commandId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update command status error:', error);
        return { data: null, error: error.message };
    }
};

// Cancel a pending command
export const cancelCommand = async (commandId) => {
    try {
        const { data, error } = await supabase
            .from('command_queue')
            .update({ status: 'CANCELLED' })
            .eq('id', commandId)
            .eq('status', 'PENDING')
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Cancel command error:', error);
        return { data: null, error: error.message };
    }
};

// Subscribe to command status changes
export const subscribeToCommandStatus = (commandId, callback) => {
    const subscription = supabase
        .channel(`command-${commandId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'command_queue',
                filter: `id=eq.${commandId}`,
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

// Subscribe to all commands for a device
export const subscribeToDeviceCommands = (deviceId, callback) => {
    const subscription = supabase
        .channel(`device-commands-${deviceId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'command_queue',
                filter: `device_id=eq.${deviceId}`,
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return subscription;
};

// Helper function to create feeding event
const createFeedingEvent = async (deviceId, userId, targetGrams, petId) => {
    try {
        const { data, error } = await supabase
            .from('feeding_events')
            .insert([
                {
                    device_id: deviceId,
                    user_id: userId,
                    pet_id: petId,
                    target_grams: targetGrams,
                    status: 'PENDING',
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Create feeding event error:', error);
        return { data: null, error: error.message };
    }
};
