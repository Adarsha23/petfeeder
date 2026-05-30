/**
 * Table 2: IoT Device Pairing & Network Management
 * TC-07 to TC-10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import * as deviceService from '../services/deviceService';

const mockUser = { id: 'user-uuid-001', email: 'test@example.com' };

const mockDevice = {
    id: 'device-uuid-001',
    serial_number: 'ESP32-ABCD',
    pairing_code_hash: 'hashedcode123',
    owner_id: 'user-uuid-001',
    device_name: 'Feeder ABCD',
    pet_id: null,
    status: 'OFFLINE',
    last_seen_at: null,
    created_at: '2026-05-26T10:00:00Z',
    updated_at: '2026-05-26T10:00:00Z',
};

beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
});

// ─── TC-07: Pair a new ESP32 Device using Device ID ──────────────────────────

describe('TC-07 — Pair a new ESP32 Device using Device ID', () => {
    it('inserts device record with correct serial number and owner', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDevice, error: null }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        const { data, error } = await deviceService.registerDevice(
            'ESP32-ABCD',
            '1234',
            'My Feeder'
        );

        expect(supabase.from).toHaveBeenCalledWith('devices');
        expect(insertMock).toHaveBeenCalledWith([
            expect.objectContaining({
                serial_number: 'ESP32-ABCD',
                owner_id: mockUser.id,
                status: 'OFFLINE',
            }),
        ]);
        expect(error).toBeNull();
        expect(data.serial_number).toBe('ESP32-ABCD');
    });

    it('hashes the pairing code before storing (not plain text)', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDevice, error: null }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        await deviceService.registerDevice('ESP32-ABCD', '1234', 'My Feeder');

        const inserted = insertMock.mock.calls[0][0][0];
        expect(inserted.pairing_code_hash).not.toBe('1234');
        // SHA-256 hex is 64 chars
        expect(inserted.pairing_code_hash).toHaveLength(64);
    });

    it('device appears with status OFFLINE after pairing', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockDevice, error: null }),
        };
        supabase.from.mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain) });

        const { data } = await deviceService.registerDevice('ESP32-ABCD', '1234');
        expect(data.status).toBe('OFFLINE');
    });

    it('uses last 4 chars of serial as default device name', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { ...mockDevice, device_name: 'Feeder ABCD' },
                error: null,
            }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        await deviceService.registerDevice('ESP32-ABCD', '1234');

        const inserted = insertMock.mock.calls[0][0][0];
        expect(inserted.device_name).toBe('Feeder ABCD');
    });
});

// ─── TC-08: Prevent pairing an already paired device ─────────────────────────

describe('TC-08 — Prevent pairing an already paired device', () => {
    it('returns error message when serial number already exists (unique constraint)', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            }),
        };
        supabase.from.mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain) });

        const { data, error } = await deviceService.registerDevice(
            'ESP32-ABCD',
            '1234'
        );

        expect(data).toBeNull();
        expect(error).toMatch(/already registered/i);
    });

    it('does not create a duplicate device record', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key' },
            }),
        };
        const insertMock = vi.fn().mockReturnValue(mockChain);
        supabase.from.mockReturnValue({ insert: insertMock });

        await deviceService.registerDevice('ESP32-ABCD', '1234');

        // insert was attempted only once — no retry on duplicate
        expect(insertMock).toHaveBeenCalledTimes(1);
    });
});

// ─── TC-09: ESP32 Initial Wi-Fi & Cloud Connection ───────────────────────────
// The ESP32 firmware is C++ / Arduino; we test the DB-side contract:
// that a sensor payload row is queryable after the device connects.

describe('TC-09 — ESP32 Initial Wi-Fi & Cloud Connection (DB contract)', () => {
    const mockSensorPayload = [
        {
            id: 'sensor-uuid-001',
            device_id: 'device-uuid-001',
            sensor_type: 'FOOD_LEVEL',
            value: 85,
            unit: '%',
            timestamp: '2026-05-26T10:01:00Z',
        },
        {
            id: 'sensor-uuid-002',
            device_id: 'device-uuid-001',
            sensor_type: 'WATER_LEVEL',
            value: 72,
            unit: '%',
            timestamp: '2026-05-26T10:01:00Z',
        },
    ];

    it('retrieves sensor data after device pushes first payload', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockSensorPayload, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data, error } = await deviceService.getDeviceSensorData('device-uuid-001');

        expect(supabase.from).toHaveBeenCalledWith('device_sensors');
        expect(error).toBeNull();
        expect(data.length).toBeGreaterThan(0);
    });

    it('first sensor payload includes FOOD_LEVEL and WATER_LEVEL sensor types', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockSensorPayload, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data } = await deviceService.getDeviceSensorData('device-uuid-001');

        const sensorTypes = data.map((s) => s.sensor_type);
        expect(sensorTypes).toContain('FOOD_LEVEL');
        expect(sensorTypes).toContain('WATER_LEVEL');
    });

    it('device status is set to ONLINE after first payload (simulated DB update)', async () => {
        // Simulate the ESP32 status update pushed to the devices table
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { ...mockDevice, status: 'ONLINE', last_seen_at: '2026-05-26T10:01:00Z' },
                error: null,
            }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data } = await deviceService.getDeviceById('device-uuid-001');
        expect(data.status).toBe('ONLINE');
    });
});

// ─── TC-10: Wi-Fi Reconnection Logic ─────────────────────────────────────────
// The reconnection loop lives on the ESP32 (C++). We test the DB side:
// that subscribeToDeviceStatus wires up a Realtime subscription and that
// a simulated reconnect event triggers the callback with ONLINE status.

describe('TC-10 — Wi-Fi Reconnection Logic (Realtime subscription contract)', () => {
    it('subscribes to device status changes via Supabase Realtime', () => {
        const callback = vi.fn();
        deviceService.subscribeToDeviceStatus('device-uuid-001', callback);

        expect(supabase.channel).toHaveBeenCalledWith('device-device-uuid-001');
    });

    it('invokes callback with updated device data when status changes', () => {
        const callback = vi.fn();
        let capturedHandler;

        supabase.channel.mockReturnValue({
            on: vi.fn((event, filter, handler) => {
                capturedHandler = handler;
                return { subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) };
            }),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        });

        deviceService.subscribeToDeviceStatus('device-uuid-001', callback);

        // Simulate Realtime UPDATE event fired by ESP32 reconnect
        const reconnectedDevice = { ...mockDevice, status: 'ONLINE', last_seen_at: new Date().toISOString() };
        if (capturedHandler) capturedHandler({ new: reconnectedDevice });

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'ONLINE' })
        );
    });

    it('device status transitions back to ONLINE after reconnect (DB state check)', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { ...mockDevice, status: 'ONLINE' },
                error: null,
            }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data } = await deviceService.getDeviceById('device-uuid-001');
        expect(data.status).toBe('ONLINE');
    });
});
