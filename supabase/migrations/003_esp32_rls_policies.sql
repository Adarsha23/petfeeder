-- =====================================================
-- ESP32 Device Access Policies
-- =====================================================
-- The ESP32 uses the Supabase anon key WITHOUT a user session.
-- So auth.uid() is NULL for ESP32 requests.
-- We need policies that allow the anon role to:
--   1. INSERT sensor data (FOOD_LEVEL, WATER_LEVEL)
--   2. SELECT pending commands from command_queue
--   3. UPDATE command status (PENDING -> EXECUTED)

-- =====================================================
-- device_sensors: Allow ESP32 (anon) to INSERT sensor data
-- =====================================================
-- Drop existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert sensor data for their devices" ON device_sensors;
DROP POLICY IF EXISTS "ESP32 can insert sensor data" ON device_sensors;

-- Recreate: Authenticated users can insert (from frontend if needed)
CREATE POLICY "Authenticated users can insert sensor data"
    ON device_sensors FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM devices
            WHERE devices.id = device_sensors.device_id
            AND devices.owner_id = auth.uid()
        )
    );

-- NEW: Allow anon role (ESP32) to insert sensor data for any registered device
CREATE POLICY "ESP32 can insert sensor data"
    ON device_sensors FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices
            WHERE devices.id = device_sensors.device_id
        )
    );

-- =====================================================
-- command_queue: Allow ESP32 (anon) to read PENDING commands
-- =====================================================
DROP POLICY IF EXISTS "ESP32 can read pending commands" ON command_queue;

CREATE POLICY "ESP32 can read pending commands"
    ON command_queue FOR SELECT
    USING (
        status = 'PENDING'
        OR auth.uid() IS NOT NULL
    );

-- =====================================================
-- command_queue: Allow ESP32 (anon) to update command status
-- =====================================================
DROP POLICY IF EXISTS "ESP32 can update command status" ON command_queue;

CREATE POLICY "ESP32 can update command status"
    ON command_queue FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- feeding_schedules: Ensure UPDATE policy exists
-- =====================================================
DROP POLICY IF EXISTS "Users can update their own schedules" ON feeding_schedules;

CREATE POLICY "Users can update their own schedules"
    ON feeding_schedules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM devices
            WHERE devices.id = feeding_schedules.device_id
            AND devices.owner_id = auth.uid()
        )
    );
