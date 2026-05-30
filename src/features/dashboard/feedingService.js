import { supabase } from '../../shared/lib/supabase';

export const getFeedingHistory = async (limit = 100) => {
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
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get feeding history error:', error);
        return { data: null, error: error.message };
    }
};
