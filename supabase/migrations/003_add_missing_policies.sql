-- Add missing columns and fix RLS policies
-- Run this in Supabase SQL Editor

-- 1. Add missing 'species' column to pet_profiles table
ALTER TABLE pet_profiles 
ADD COLUMN IF NOT EXISTS species VARCHAR(50) DEFAULT 'Dog' CHECK (species IN ('Dog', 'Cat'));

-- 2. Add missing RLS INSERT policies

-- Pet profiles INSERT policy
CREATE POLICY "Users can insert their own pet profiles"
    ON pet_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Devices INSERT policy  
CREATE POLICY "Users can insert their own devices"
    ON devices FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Feeding events INSERT policy
CREATE POLICY "Users can insert feeding events for their devices"
    ON feeding_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = feeding_events.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- Notifications INSERT policy
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);  -- Allow system to create notifications

-- Notifications UPDATE policy
CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Notifications DELETE policy
CREATE POLICY "Users can delete their notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);
