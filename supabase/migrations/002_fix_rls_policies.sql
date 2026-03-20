

-- Devices: Only check owner_id (no shared access for now)
CREATE POLICY "Users can view their own devices"
    ON devices FOR SELECT
    USING (auth.uid() = owner_id);

-- Feeding events: Check device ownership directly
CREATE POLICY "Users can view feeding events for their devices"
    ON feeding_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = feeding_events.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- Command queue: Check device ownership directly
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

-- Notifications: Check device ownership directly
CREATE POLICY "Users can view notifications for their devices"
    ON notifications FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = notifications.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- Device sensors: Check device ownership directly
CREATE POLICY "Users can view sensor data for their devices"
    ON device_sensors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_sensors.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sensor data for their devices"
    ON device_sensors FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM devices 
            WHERE devices.id = device_sensors.device_id 
            AND devices.owner_id = auth.uid()
        )
    );

-- Device shared access: Simple policies
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
