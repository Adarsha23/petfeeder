import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCommands() {
    console.log('Checking command_queue table...');
    const { data, error } = await supabase
        .from('command_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching commands:', error);
    } else {
        console.log('Recent Commands:', data);
    }
}

checkCommands();
