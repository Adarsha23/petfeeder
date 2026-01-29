import { supabase } from '../lib/supabase';

/**
 * Pet Profile Service
 * Handles pet profile CRUD operations with Supabase
 */

// Get all pet profiles for current user
export const getPetProfiles = async () => {
    try {
        const { data, error } = await supabase
            .from('pet_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to ensure dietaryRequirements is parsed
        const transformedData = (data || []).map(transformPetData);
        return { data: transformedData, error: null };
    } catch (error) {
        console.error('Get pet profiles error:', error);
        return { data: null, error: error.message };
    }
};

// Helper to transform pet data from DB format to UI format
const transformPetData = (pet) => {
    let dietaryRequirements = {};
    try {
        if (pet.dietary_notes) {
            dietaryRequirements = typeof pet.dietary_notes === 'string'
                ? JSON.parse(pet.dietary_notes)
                : pet.dietary_notes;
        }
    } catch (e) {
        console.warn('Failed to parse dietary_notes:', e);
    }

    return {
        ...pet,
        dietaryRequirements
    };
};

// Get single pet profile by ID
export const getPetProfile = async (profileId) => {
    try {
        const { data, error } = await supabase
            .from('pet_profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error) throw error;
        return { data: transformPetData(data), error: null };
    } catch (error) {
        console.error('Get pet profile error:', error);
        return { data: null, error: error.message };
    }
};

// Create new pet profile
export const createPetProfile = async (petData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('pet_profiles')
            .insert([
                {
                    user_id: user.id,
                    name: petData.name,
                    species: petData.species || 'Dog',
                    breed: petData.breed || null,
                    age: petData.age || null,
                    weight: petData.weight || null,
                    height: petData.height || null,
                    photo_url: petData.photo || null,
                    dietary_notes: JSON.stringify(petData.dietaryRequirements || {}),
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data: transformPetData(data), error: null };
    } catch (error) {
        console.error('Create pet profile error:', error);
        return { data: null, error: error.message };
    }
};

// Update pet profile
export const updatePetProfile = async (profileId, petData) => {
    try {
        const updates = {
            name: petData.name,
            species: petData.species,
            breed: petData.breed || null,
            age: petData.age || null,
            weight: petData.weight || null,
            height: petData.height || null,
            photo_url: petData.photo || null,
            dietary_notes: JSON.stringify(petData.dietaryRequirements || {}),
        };

        const { data, error } = await supabase
            .from('pet_profiles')
            .update(updates)
            .eq('id', profileId)
            .select()
            .single();

        if (error) throw error;
        return { data: transformPetData(data), error: null };
    } catch (error) {
        console.error('Update pet profile error:', error);
        return { data: null, error: error.message };
    }
};

// Delete pet profile
export const deletePetProfile = async (profileId) => {
    try {
        const { error } = await supabase
            .from('pet_profiles')
            .delete()
            .eq('id', profileId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete pet profile error:', error);
        return { error: error.message };
    }
};
