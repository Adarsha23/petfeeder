import { supabase } from '../lib/supabase';

/**
 * Schedule Service (Refined)
 * Handles recurring feeding schedules with multiple times and naming
 */

// Get all schedules for the current user
export const getSchedules = async () => {
    try {
        const { data, error } = await supabase
            .from('feeding_schedules')
            .select(`
                *,
                pet:pet_profiles(name, photo_url, species),
                device:devices(device_name, status)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get schedules error:', error);
        return { data: null, error: error.message };
    }
};

// Create a new schedule
export const createSchedule = async (scheduleData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('feeding_schedules')
            .insert([
                {
                    user_id: user.id,
                    device_id: scheduleData.deviceId,
                    pet_id: scheduleData.petId,
                    name: scheduleData.name || 'Feeding Plan',
                    feeding_times: scheduleData.feedingTimes || [],
                    days_of_week: scheduleData.daysOfWeek || [],
                    is_active: true
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Create schedule error:', error);
        return { data: null, error: error.message };
    }
};

// Update an existing schedule
export const updateSchedule = async (scheduleId, updates) => {
    try {
        const { data, error } = await supabase
            .from('feeding_schedules')
            .update({
                device_id: updates.deviceId,
                pet_id: updates.petId,
                name: updates.name,
                feeding_times: updates.feedingTimes,
                days_of_week: updates.daysOfWeek,
                is_active: updates.isActive
            })
            .eq('id', scheduleId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update schedule error:', error);
        return { data: null, error: error.message };
    }
};

// Toggle schedule active status
export const toggleSchedule = async (scheduleId, isActive) => {
    try {
        const { data, error } = await supabase
            .from('feeding_schedules')
            .update({ is_active: isActive })
            .eq('id', scheduleId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Toggle schedule error:', error);
        return { data: null, error: error.message };
    }
};

// Delete a schedule
export const deleteSchedule = async (scheduleId) => {
    try {
        const { error } = await supabase
            .from('feeding_schedules')
            .delete()
            .eq('id', scheduleId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete schedule error:', error);
        return { error: error.message };
    }
};
