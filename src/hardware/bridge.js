/*
  Smart Pet Feeder - Serial Bridge
  This script runs on your laptop to connect Supabase to your Arduino.
  
  HOW TO RUN:
  1. Open your terminal in the project root.
  2. Run: npm install serialport @supabase/supabase-js
  3. Run: node src/hardware/bridge.js
*/

import { createClient } from '@supabase/supabase-js';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
// IMPORTANT: Updated to your specific port
const SERIAL_PORT_PATH = '/dev/cu.usbserial-110';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Supabase credentials missing from .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SERIAL SETUP ---
const port = new SerialPort({
    path: SERIAL_PORT_PATH,
    baudRate: 9600,
    autoOpen: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.open((err) => {
    if (err) {
        return console.log('Error opening port: ', err.message);
    }
    console.log('✅ Serial Port Opened at ' + SERIAL_PORT_PATH);
});

// --- INITIAL CHECK ---
const checkInitialCommands = async () => {
    console.log('🔍 Checking for existing PENDING commands...');
    const { data, error } = await supabase
        .from('command_queue')
        .select('*')
        .eq('status', 'PENDING');

    if (error) {
        console.error('❌ Error checking commands:', error.message);
    } else if (data && data.length > 0) {
        console.log(`💡 Found ${data.length} pending commands. Processing first one...`);
        processCommand(data[0]);
    } else {
        console.log('✅ No pending commands found in DB.');
    }
};
// stores the row id of the command being processed
let currentCommandId = null;
const processCommand = (command) => {
    console.log('🚀 Sending "F" to Arduino for command:', command.command_type);
    //send F to arduino
    port.write('F', (err) => {
        if (err) return console.log('Error on write: ', err.message);
        console.log('Wait for Arduino confirmation...');
    });
};

const commandSubscription = supabase
    .channel('command_queue_changes')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'command_queue',
            filter: `status=eq.PENDING`,
        },
        // payload is the new row inserted
        (payload) => {
            const command = payload.new;
            console.log('🔔 New Command Received:', command.command_type);
            processCommand(command);
        }
    )
    .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
            checkInitialCommands();
        }
    });

// Handle Arduino feedback
parser.on('data', async (data) => {
    console.log('🤖 Arduino:', data);

    if (data.includes("Feed Complete")) {
        console.log("✅ Feeding finished.");

        if (currentCommandId) {
            console.log(`📡 Updating Supabase command ${currentCommandId} to EXECUTED...`);
            const { error } = await supabase
                .from('command_queue')
                .update({
                    status: 'EXECUTED',
                    executed_at: new Date().toISOString()
                })
                .eq('id', currentCommandId);

            if (error) {
                console.error('❌ Error updating status:', error.message);
            } else {
                console.log('✅ Command status updated successfully.');
                currentCommandId = null;
            }
        }
    }
});

process.on('SIGINT', () => {
    port.close();
    process.exit();
});
