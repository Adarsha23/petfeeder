-- COMPLETE FIX FOR RLS POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- This will fix all INSERT/UPDATE/DELETE policy issues

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================

-- Drop devices policies
DROP POLICY IF EXISTS "Users can view their own devices" ON devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON devices;

-- Drop pet_profiles policies
DROP POLICY IF EXISTS "Users can view their own pet profiles" ON pet_profiles;
DROP POLICY IF EXISTS "Users can insert their own pet profiles" ON pet_profiles;
DROP POLICY IF EXISTS "Users can update their own pet profiles" ON pet_profiles;
DROP POLICY IF EXISTS "Users can delete their own pet profiles" ON pet_profiles;

-- Drop feeding_events policies
DROP POLICY IF EXISTS "Users can view feeding events for their devices" ON feeding_events;
DROP POLICY IF EXISTS "Users can insert feeding events for their devices" ON feeding_events;

-- Drop command_queue policies
DROP POLICY IF EXISTS "Users can view commands for their devices" ON command_queue;
DROP POLICY IF EXISTS "Users can insert commands for their devices" ON command_queue;
DROP POLICY IF EXISTS "Users can update commands for their devices" ON command_queue;
DROP POLICY IF EXISTS "Users can delete commands for their devices" ON command_queue;

-- Drop notifications policies
DROP POLICY IF EXISTS "Users can view notifications for their devices" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;

-- Drop device_sensors policies
DROP POLICY IF EXISTS "Users can view sensor data for their devices" ON device_sensors;
DROP POLICY IF EXISTS "Users can insert sensor data for their devices" ON device_sensors;

-- Drop device_shared_access policies
DROP POLICY IF EXISTS "Users can view shared access for their devices" ON device_shared_access;
DROP POLICY IF EXISTS "Device owners can manage shared access" ON device_shared_access;

-- ============================================
-- STEP 2: Add missing species column
-- ============================================

ALTER TABLE pet_profiles 
ADD COLUMN IF NOT EXISTS species VARCHAR(50) DEFAULT 'Dog' 
CHECK (species IN ('Dog', 'Cat'));

-- ============================================
-- STEP 3: Create SIMPLE policies (no recursion)
-- ============================================

-- DEVICES POLICIES
CREATE POLICY "Users can view their own devices"
    ON devices FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own devices"
    ON devices FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own devices"
    ON devices FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own devices"
    ON devices FOR DELETE
    USING (auth.uid() = owner_id);

-- PET PROFILES POLICIES
CREATE POLICY "Users can view their own pet profiles"
    ON pet_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pet profiles"
    ON pet_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pet profiles"
    ON pet_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pet profiles"
    ON pet_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- FEEDING EVENTS POLICIES
CREATE POLICY "Users can view feeding events for their devices"
    ON feeding_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = feeding_events.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert feeding events for their devices"
    ON feeding_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = feeding_events.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- COMMAND QUEUE POLICIES
CREATE POLICY "Users can view commands for their devices"
    ON command_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = command_queue.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert commands for their devices"
    ON command_queue FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = command_queue.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update commands for their devices"
    ON command_queue FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = command_queue.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- DEVICE SENSORS POLICIES
CREATE POLICY "Users can view sensor data for their devices"
    ON device_sensors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_sensors.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Devices can insert sensor data"
    ON device_sensors FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_sensors.device_id
        )
    );

-- DEVICE SHARED ACCESS POLICIES
CREATE POLICY "Users can view shared access for their devices"
    ON device_shared_access FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_shared_access.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Device owners can manage shared access"
    ON device_shared_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_shared_access.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- This should return all the policies we just created
