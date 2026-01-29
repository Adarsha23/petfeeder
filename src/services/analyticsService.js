import { supabase } from '../lib/supabase';

/**
 * Analytics Service
 * Processes raw feeding data into chart-ready formats
 */

export const getAnalyticsData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch last 30 days of SUCCESSFUL feeding events
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: events, error } = await supabase
            .from('feeding_events')
            .select(`
                *,
                pet_profiles (name)
            `)
            .eq('user_id', user.id)
            .eq('status', 'SUCCESS')
            .gte('timestamp', thirtyDaysAgo.toISOString())
            .order('timestamp', { ascending: true });

        if (error) throw error;

        return {
            consumptionData: processDailyConsumption(events),
            petBreakdownData: processPetBreakdown(events),
            totalGrams: events.reduce((sum, e) => sum + (e.actual_grams || 0), 0),
            totalFeedings: events.length
        };
    } catch (err) {
        console.error('Analytics Error:', err);
        return { error: err.message };
    }
};

/**
 * Groups events by day and sums grams
 * Returns: [{ date: 'Jan 01', grams: 150 }, ...]
 */
const processDailyConsumption = (events) => {
    const dailyMap = {};

    events.forEach(event => {
        const date = new Date(event.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        dailyMap[date] = (dailyMap[date] || 0) + (event.actual_grams || 0);
    });

    return Object.keys(dailyMap).map(date => ({
        date,
        grams: Math.round(dailyMap[date])
    }));
};

/**
 * Totals grams per pet
 * Returns: [{ name: 'Buddy', grams: 500 }, ...]
 */
const processPetBreakdown = (events) => {
    const petMap = {};

    events.forEach(event => {
        const petName = event.pet_profiles?.name || 'Unknown';
        petMap[petName] = (petMap[petName] || 0) + (event.actual_grams || 0);
    });

    return Object.keys(petMap).map(name => ({
        name,
        grams: Math.round(petMap[name])
    }));
};
