import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkEventsAndDevices() {
    console.log('Checking feeding_events table...');
    const { data: events, error: eventError } = await supabase
        .from('feeding_events')
        .select('*')
        .limit(5);

    if (eventError) {
        console.error('Error fetching events:', eventError);
    } else {
        console.log('Recent Events:', events);
        if (events && events.length > 0) {
            console.log('Found Device ID from events:', events[0].device_id);
        }
    }

    console.log('Checking devices table...');
    const { data: devices, error: deviceError } = await supabase
        .from('devices')
        .select('*');

    if (deviceError) {
        console.error('Error fetching devices:', deviceError);
    } else {
        console.log('All Devices:', devices);
    }
}

checkEventsAndDevices();
