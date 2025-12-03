import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Device Service
 * Handles device registration, management, and status operations
 */

// Get all devices for current user
export const getUserDevices = async () => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get devices error:', error);
        return { data: null, error: error.message };
    }
};

// Get device by ID
export const getDeviceById = async (deviceId) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get device error:', error);
        return { data: null, error: error.message };
    }
};

// Register new device (pair device)
export const registerDevice = async (serialNumber, pairingCode, deviceName = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Hash the pairing code (in production, this should be done server-side)
        const pairingCodeHash = await hashPairingCode(pairingCode);

        const { data, error } = await supabase
            .from('devices')
            .insert([
                {
                    serial_number: serialNumber,
                    pairing_code_hash: pairingCodeHash,
                    owner_id: user.id,
                    device_name: deviceName || `Feeder ${serialNumber.slice(-4)}`,
                    status: 'OFFLINE',
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Register device error:', error);
        return { data: null, error: error.message };
    }
};

// Update device information
export const updateDevice = async (deviceId, updates) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .update(updates)
            .eq('id', deviceId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Update device error:', error);
        return { data: null, error: error.message };
    }
};

// Delete device
export const deleteDevice = async (deviceId) => {
    try {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', deviceId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete device error:', error);
        return { error: error.message };
    }
};

// Subscribe to device status changes
export const subscribeToDeviceStatus = (deviceId, callback) => {
    const subscription = supabase
        .channel(`device-${deviceId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'devices',
                filter: `id=eq.${deviceId}`,
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

// Get device sensor data
export const getDeviceSensorData = async (deviceId, sensorType = null, limit = 100) => {
    try {
        let query = supabase
            .from('device_sensors')
            .select('*')
            .eq('device_id', deviceId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (sensorType) {
            query = query.eq('sensor_type', sensorType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get sensor data error:', error);
        return { data: null, error: error.message };
    }
};

// Helper function to hash pairing code (simple implementation)
// In production, use bcrypt or similar on the server side
const hashPairingCode = async (pairingCode) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pairingCode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
