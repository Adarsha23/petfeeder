import { supabase } from '../../shared/lib/supabase';
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

        // 1. Create the feeding event record first (Pending)
        const { data: event } = await createFeedingEvent(deviceId, user.id, targetGrams, petId);

        const idempotencyToken = generateIdempotencyToken();

        // 2. Queue the command with the event ID in the payload
        const { data, error } = await supabase
            .from('command_queue')
            .insert([
                {
                    device_id: deviceId,
                    user_id: user.id,
                    command_type: 'FEED',
                    payload: {
                        grams: targetGrams,
                        target_grams: targetGrams,
                        pet_id: petId,
                        feeding_event_id: event.id // LINKED!
                    },
                    status: 'PENDING',
                    idempotency_token: idempotencyToken,
                    priority: 0,
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Queue feed command error:', error);
        return { data: null, error: error.message };
    }
};

// Queue a calibrate (tare/zero) command
export const queueCalibrateCommand = async (deviceId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const idempotencyToken = generateIdempotencyToken();

        const { data, error } = await supabase
            .from('command_queue')
            .insert([{
                device_id: deviceId,
                user_id: user.id,
                command_type: 'CALIBRATE',
                payload: {},
                status: 'PENDING',
                idempotency_token: idempotencyToken,
                priority: 2,
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Queue calibrate command error:', error);
        return { data: null, error: error.message };
    }
};

// Queue a water command
export const queueWaterCommand = async (deviceId, durationMs = 3000, petId = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create a record in feeding_events (representing a "Drinking" event)
        const { data: event } = await createFeedingEvent(deviceId, user.id, 0, petId);

        const idempotencyToken = generateIdempotencyToken();

        const { data, error } = await supabase
            .from('command_queue')
            .insert([
                {
                    device_id: deviceId,
                    user_id: user.id,
                    command_type: 'WATER_FEED',
                    payload: {
                        duration: durationMs,
                        pet_id: petId,
                        feeding_event_id: event.id
                    },
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
        console.error('Queue water command error:', error);
        return { data: null, error: error.message };
    }
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
