import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    console.log('Attempting test insert into command_queue...');

    // We need a valid device_id. Let's find one first.
    const { data: devices } = await supabase.from('devices').select('id').limit(1);
    if (!devices || devices.length === 0) {
        console.error('No devices found to test with.');
        return;
    }
    const deviceId = devices[0].id;

    const { data, error } = await supabase
        .from('command_queue')
        .insert([
            {
                device_id: deviceId,
                command_type: 'FEED',
                status: 'PENDING',
                payload: { target_grams: 50 },
                idempotency_token: `test-${Date.now()}`
            }
        ])
        .select();

    if (error) {
        console.error('Error inserting command:', error);
    } else {
        console.log('Successfully inserted command:', data);
    }
}

testInsert();
