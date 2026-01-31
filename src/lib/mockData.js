import { supabase } from './supabase';

export const injectMockData = async () => {
    try {
        console.log("Starting mock data injection...");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        // 1. Ensure Device
        let { data: devices } = await supabase.from('devices').select('id');
        if (!devices || devices.length === 0) {
            console.log("Creating mock device...");
            const { data: dev, error } = await supabase.from('devices').insert({
                serial_number: `MOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                pairing_code_hash: 'mock',
                owner_id: user.id,
                device_name: 'Main Feeder',
                status: 'ONLINE'
            }).select().single();
            if (error) throw error;
            devices = [dev];
        }

        // 2. Ensure Pet
        let { data: pets } = await supabase.from('pet_profiles').select('id');
        if (!pets || pets.length === 0) {
            console.log("Creating mock pet...");
            const { data: pet, error } = await supabase.from('pet_profiles').insert({
                user_id: user.id,
                name: 'Buddy',
                weight: 12.5,
                age: 3
            }).select().single();
            if (error) throw error;
            pets = [pet];
        }

        // 3. Generate Events
        const events = [];
        const now = new Date();
        for (let i = 0; i < 50; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - Math.floor(Math.random() * 7)); // past 7 days
            d.setHours(Math.random() * 24);

            const target = 50 + Math.floor(Math.random() * 50); // 50-100g
            const actual = target - Math.floor(Math.random() * 5); // almost perfect

            events.push({
                device_id: devices[0].id,
                user_id: user.id,
                pet_id: pets[Math.floor(Math.random() * pets.length)].id,
                target_grams: target,
                actual_grams: actual,
                status: 'SUCCESS',
                timestamp: d.toISOString()
            });
        }

        const { error } = await supabase.from('feeding_events').insert(events);
        if (error) throw error;

        console.log("Injected 50 events.");
        return { success: true };
    } catch (error) {
        console.error("Mock injection failed:", error);
        return { success: false, error: error.message };
    }
};
