import { supabase } from '../lib/supabase';

/**
 * Feeding Service
 * Handles feeding events, history, and analytics
 */

// Get feeding events for a device
export const getFeedingEvents = async (deviceId, limit = 50, startDate = null, endDate = null) => {
    try {
        let query = supabase
            .from('feeding_events')
            .select(`
        *,
        pet_profiles (
          id,
          name,
          photo_url
        )
      `)
            .eq('device_id', deviceId)
            .order('timestamp', { ascending: false });

        if (startDate) query = query.gte('timestamp', startDate);
        if (endDate) query = query.lte('timestamp', endDate);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get feeding events error:', error);
        return { data: null, error: error.message };
    }
};

// Get feeding event by ID
export const getFeedingEventById = async (eventId) => {
    try {
        const { data, error } = await supabase
            .from('feeding_events')
            .select(`
        *,
        pet_profiles (
          id,
          name,
          photo_url
        )
      `)
            .eq('id', eventId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get feeding event error:', error);
        return { data: null, error: error.message };
    }
};

// Update feeding event (typically called by device after completion)
export const updateFeedingEvent = async (eventId, updates) => {
    try {
        const { data, error } = await supabase
            .from('feeding_events')
            .update(updates)
            .eq('id', eventId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update feeding event error:', error);
        return { data: null, error: error.message };
    }
};

// Get feeding statistics for a device
export const getFeedingStatistics = async (deviceId) => {
    try {
        const { data, error } = await supabase
            .from('feeding_statistics')
            .select('*')
            .eq('device_id', deviceId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get feeding statistics error:', error);
        return { data: null, error: error.message };
    }
};

// Get daily feeding summary
export const getDailyFeedingSummary = async (deviceId, days = 7) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('daily_feeding_summary')
            .select('*')
            .eq('device_id', deviceId)
            .gte('feeding_date', startDate.toISOString().split('T')[0])
            .order('feeding_date', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get daily feeding summary error:', error);
        return { data: null, error: error.message };
    }
};

// Get feeding events by date range
export const getFeedingEventsByDateRange = async (deviceId, startDate, endDate) => {
    try {
        const { data, error } = await supabase
            .from('feeding_events')
            .select(`
        *,
        pet_profiles (
          id,
          name,
          photo_url
        )
      `)
            .eq('device_id', deviceId)
            .gte('timestamp', startDate)
            .lte('timestamp', endDate)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get feeding events by date range error:', error);
        return { data: null, error: error.message };
    }
};

// Subscribe to feeding events for a device
export const subscribeToFeedingEvents = (deviceId, callback) => {
    const subscription = supabase
        .channel(`feeding-events-${deviceId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'feeding_events',
                filter: `device_id=eq.${deviceId}`,
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return subscription;
};

// Get feeding accuracy metrics
export const getFeedingAccuracyMetrics = async (deviceId, limit = 100) => {
    try {
        const { data, error } = await supabase
            .from('feeding_events')
            .select('target_grams, actual_grams, status')
            .eq('device_id', deviceId)
            .eq('status', 'SUCCESS')
            .not('actual_grams', 'is', null)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Calculate accuracy metrics
        if (data && data.length > 0) {
            const accuracyData = data.map(event => ({
                target: event.target_grams,
                actual: event.actual_grams,
                error: Math.abs(event.actual_grams - event.target_grams),
                errorPercentage: (Math.abs(event.actual_grams - event.target_grams) / event.target_grams) * 100,
            }));

            const avgError = accuracyData.reduce((sum, item) => sum + item.error, 0) / accuracyData.length;
            const avgErrorPercentage = accuracyData.reduce((sum, item) => sum + item.errorPercentage, 0) / accuracyData.length;

            return {
                data: {
                    events: accuracyData,
                    averageError: avgError,
                    averageErrorPercentage: avgErrorPercentage,
                    totalEvents: data.length,
                },
                error: null,
            };
        }

        return { data: null, error: 'No feeding events found' };
    } catch (error) {
        console.error('Get feeding accuracy metrics error:', error);
        return { data: null, error: error.message };
    }
};
