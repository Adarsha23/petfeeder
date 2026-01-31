import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanPending() {
    console.log('🧹 Cleaning up old PENDING commands...');
    const { data, error } = await supabase
        .from('command_queue')
        .update({ status: 'CANCELLED', error_message: 'Cleanup reset' })
        .eq('status', 'PENDING');

    if (error) {
        console.error('Error cleaning commands:', error.message);
    } else {
        console.log('✅ Old commands cancelled. Ready for a fresh start!');
    }
}

cleanPending();
