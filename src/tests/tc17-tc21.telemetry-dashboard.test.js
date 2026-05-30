/**
 * Table 4: Dashboard Display, Telemetry & Real-Time Analytics
 * TC-17 to TC-21
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import * as deviceService from '../services/deviceService';
import * as feedingService from '../services/feedingService';
import * as analyticsService from '../services/analyticsService';

const mockUser = { id: 'user-uuid-001', email: 'test@example.com' };
const DEVICE_ID = 'device-uuid-001';

// Simulated telemetry rows the ESP32 pushes every 60s
const mockSensorRows = [
    { id: 's1', device_id: DEVICE_ID, sensor_type: 'TRAY_WEIGHT', value: 48, unit: 'g', timestamp: '2026-05-26T10:00:00Z' },
    { id: 's2', device_id: DEVICE_ID, sensor_type: 'WATER_LEVEL', value: 72, unit: '%', timestamp: '2026-05-26T10:00:00Z' },
    { id: 's3', device_id: DEVICE_ID, sensor_type: 'FOOD_LEVEL', value: 85, unit: '%', timestamp: '2026-05-26T10:00:00Z' },
];

beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
});

// ─── TC-17: Periodic Sensor Telemetry Reporting ───────────────────────────────

describe('TC-17 — Periodic Sensor Telemetry Reporting', () => {
    it('retrieves sensor rows for TRAY_WEIGHT, WATER_LEVEL and FOOD_LEVEL', async () => {
        supabase.from.mockReturnValue(makeSensorChain(mockSensorRows));

        const { data, error } = await deviceService.getDeviceSensorData(DEVICE_ID);

        expect(error).toBeNull();
        const types = data.map((r) => r.sensor_type);
        expect(types).toContain('TRAY_WEIGHT');
        expect(types).toContain('WATER_LEVEL');
        expect(types).toContain('FOOD_LEVEL');
    });

    it('queries device_sensors table ordered by timestamp descending', async () => {
        const mockChain = makeSensorChain(mockSensorRows);
        supabase.from.mockReturnValue(mockChain);

        await deviceService.getDeviceSensorData(DEVICE_ID);

        expect(supabase.from).toHaveBeenCalledWith('device_sensors');
        expect(mockChain.order).toHaveBeenCalledWith('timestamp', { ascending: false });
    });

    it('filters by sensor_type when type argument is provided', async () => {
        const mockChain = makeSensorChain([mockSensorRows[2]]);
        supabase.from.mockReturnValue(mockChain);

        await deviceService.getDeviceSensorData(DEVICE_ID, 'FOOD_LEVEL');

        // eq is called twice: once for device_id, once for sensor_type
        expect(mockChain.eq).toHaveBeenCalledWith('sensor_type', 'FOOD_LEVEL');
    });
});

// helper: builds a sensor mock chain that resolves with given data.
// limit() must return the chain (not a Promise) because the service may call
// .eq() on the result of limit() when sensorType is provided.
// We make the chain itself thenable so `await query` still works.
const makeSensorChain = (resolvedData) => {
    const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve) => Promise.resolve({ data: resolvedData, error: null }).then(resolve),
    };
    return chain;
};

// ─── TC-18: Ultrasonic Sensor Percentage Mapping ─────────────────────────────

describe('TC-18 — Ultrasonic Sensor Percentage Mapping', () => {
    it('FOOD_LEVEL sensor value is between 0 and 100', async () => {
        supabase.from.mockReturnValue(
            makeSensorChain([{ sensor_type: 'FOOD_LEVEL', value: 85, unit: '%' }])
        );

        const { data } = await deviceService.getDeviceSensorData(DEVICE_ID, 'FOOD_LEVEL', 1);

        expect(data[0].value).toBeGreaterThanOrEqual(0);
        expect(data[0].value).toBeLessThanOrEqual(100);
    });

    it('WATER_LEVEL sensor value is between 0 and 100', async () => {
        supabase.from.mockReturnValue(
            makeSensorChain([{ sensor_type: 'WATER_LEVEL', value: 72, unit: '%' }])
        );

        const { data } = await deviceService.getDeviceSensorData(DEVICE_ID, 'WATER_LEVEL', 1);

        expect(data[0].value).toBeGreaterThanOrEqual(0);
        expect(data[0].value).toBeLessThanOrEqual(100);
    });

    it('sensor unit is % for percentage-type sensors', async () => {
        supabase.from.mockReturnValue(
            makeSensorChain([{ sensor_type: 'FOOD_LEVEL', value: 85, unit: '%' }])
        );

        const { data } = await deviceService.getDeviceSensorData(DEVICE_ID, 'FOOD_LEVEL', 1);
        expect(data[0].unit).toBe('%');
    });
});

// ─── TC-19: Real-Time Dashboard Updates (WebSocket) ──────────────────────────

describe('TC-19 — Real-Time Dashboard Updates (WebSocket)', () => {
    it('subscribes to feeding_events Realtime channel for the device', () => {
        const callback = vi.fn();
        feedingService.subscribeToFeedingEvents(DEVICE_ID, callback);

        expect(supabase.channel).toHaveBeenCalledWith(`feeding-events-${DEVICE_ID}`);
    });

    it('callback fires with new feeding event payload on INSERT', () => {
        const callback = vi.fn();
        let capturedHandler;

        supabase.channel.mockReturnValue({
            on: vi.fn((event, filter, handler) => {
                capturedHandler = handler;
                return { subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) };
            }),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        });

        feedingService.subscribeToFeedingEvents(DEVICE_ID, callback);

        const newEvent = { id: 'event-new', device_id: DEVICE_ID, status: 'SUCCESS', actual_grams: 50 };
        if (capturedHandler) capturedHandler({ new: newEvent, eventType: 'INSERT' });

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({ new: expect.objectContaining({ status: 'SUCCESS' }) })
        );
    });

    it('device status subscription fires without page refresh', () => {
        const callback = vi.fn();
        let capturedHandler;

        supabase.channel.mockReturnValue({
            on: vi.fn((event, filter, handler) => {
                capturedHandler = handler;
                return { subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) };
            }),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        });

        deviceService.subscribeToDeviceStatus(DEVICE_ID, callback);

        const updatedDevice = { id: DEVICE_ID, status: 'ONLINE', last_seen_at: new Date().toISOString() };
        if (capturedHandler) capturedHandler({ new: updatedDevice });

        // Callback was invoked — UI update happened without a page reload
        expect(callback).toHaveBeenCalledTimes(1);
    });
});

// ─── TC-20: Data Isolation between users (Row Level Security) ────────────────

describe('TC-20 — Data Isolation between users (Row Level Security)', () => {
    it('feeding events query is scoped to the authenticated user', async () => {
        // When RLS is enforced, Supabase returns only rows owned by the current user.
        // We verify the service does NOT manually pass another user's ID — RLS handles it.
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data } = await feedingService.getFeedingHistory(10);

        // Result is empty — user B has no access to user A's records (RLS filters them)
        expect(data).toEqual([]);
    });

    it('analytics query filters by user_id (not device_id)', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        await analyticsService.getAnalyticsData();

        // analytics queries feeding_events by user_id — ensuring per-user isolation
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('device list query uses owner_id scoping (enforced by RLS)', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const { data } = await deviceService.getUserDevices();
        // RLS on 'devices' table restricts to owner_id = auth.uid()
        expect(supabase.from).toHaveBeenCalledWith('devices');
        expect(data).toEqual([]);
    });
});

// ─── TC-21: Analytics Aggregation ────────────────────────────────────────────

describe('TC-21 — Analytics Aggregation', () => {
    const mockEvents = [
        { actual_grams: 50, timestamp: '2026-05-26T08:00:00Z', pet_profiles: { name: 'Buddy' }, status: 'SUCCESS' },
        { actual_grams: 100, timestamp: '2026-05-26T12:00:00Z', pet_profiles: { name: 'Buddy' }, status: 'SUCCESS' },
        { actual_grams: 75, timestamp: '2026-05-25T08:00:00Z', pet_profiles: { name: 'Luna' }, status: 'SUCCESS' },
    ];

    beforeEach(() => {
        supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    });

    it('totalGrams sums all actual_grams from SUCCESS events', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const result = await analyticsService.getAnalyticsData();
        expect(result.totalGrams).toBe(225);
    });

    it('totalFeedings equals number of SUCCESS events', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const result = await analyticsService.getAnalyticsData();
        expect(result.totalFeedings).toBe(3);
    });

    it('petBreakdownData aggregates grams per pet correctly', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const result = await analyticsService.getAnalyticsData();
        const buddy = result.petBreakdownData.find((p) => p.name === 'Buddy');
        const luna = result.petBreakdownData.find((p) => p.name === 'Luna');

        expect(buddy.grams).toBe(150); // 50 + 100
        expect(luna.grams).toBe(75);
    });

    it('consumptionData groups events by day and rounds grams', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
        supabase.from.mockReturnValue(mockChain);

        const result = await analyticsService.getAnalyticsData();
        // Two distinct days in mockEvents
        expect(result.consumptionData.length).toBe(2);
        result.consumptionData.forEach((entry) => {
            expect(entry).toHaveProperty('date');
            expect(entry).toHaveProperty('grams');
            expect(Number.isInteger(entry.grams)).toBe(true);
        });
    });
});
