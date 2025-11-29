// Pet Profile Service - handles CRUD operations for pet profiles
// Uses localStorage for mock backend

const PET_PROFILES_KEY = 'petfeeder_pet_profiles';

// Helper to generate UUID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Get all pet profiles from localStorage
const getAllPetProfiles = () => {
    const profiles = localStorage.getItem(PET_PROFILES_KEY);
    return profiles ? JSON.parse(profiles) : [];
};

// Save all pet profiles to localStorage
const saveAllPetProfiles = (profiles) => {
    localStorage.setItem(PET_PROFILES_KEY, JSON.stringify(profiles));
};

// Create a new pet profile
export const createPetProfile = async (userId, petData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const profiles = getAllPetProfiles();

    // Check if user already has a pet profile (one pet per user/feeder)
    const existingProfile = profiles.find(p => p.userId === userId);
    if (existingProfile) {
        throw new Error('You already have a pet profile. Please edit the existing one.');
    }

    const newProfile = {
        id: generateId(),
        userId,
        name: petData.name,
        species: petData.species || 'Dog',
        breed: petData.breed || '',
        age: petData.age || 0,
        weight: petData.weight || 0,
        photo: petData.photo || null,
        dietaryRequirements: {
            portionSize: petData.dietaryRequirements?.portionSize || null,
            feedingFrequency: petData.dietaryRequirements?.feedingFrequency || null,
            restrictions: petData.dietaryRequirements?.restrictions || '',
            notes: petData.dietaryRequirements?.notes || ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    profiles.push(newProfile);
    saveAllPetProfiles(profiles);

    return newProfile;
};

// Get pet profile for a specific user
export const getPetProfile = async (userId) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const profiles = getAllPetProfiles();
    return profiles.find(p => p.userId === userId) || null;
};

// Update pet profile
export const updatePetProfile = async (petId, updates) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const profiles = getAllPetProfiles();
    const index = profiles.findIndex(p => p.id === petId);

    if (index === -1) {
        throw new Error('Pet profile not found');
    }

    profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveAllPetProfiles(profiles);
    return profiles[index];
};

// Delete pet profile
export const deletePetProfile = async (petId) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const profiles = getAllPetProfiles();
    const filteredProfiles = profiles.filter(p => p.id !== petId);

    if (profiles.length === filteredProfiles.length) {
        throw new Error('Pet profile not found');
    }

    saveAllPetProfiles(filteredProfiles);
    return true;
};

// Convert image file to base64
export const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Validate image file
export const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 2MB.');
    }

    return true;
};
