-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Supabase Auth creates auth.users table automatically
-- We reference auth.users.id in our tables

-- Devices table - stores feeder hardware units
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    pairing_code_hash VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR')),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    calibration_data JSONB DEFAULT '{}',
    firmware_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_devices_owner_id ON devices(owner_id);
CREATE INDEX idx_devices_serial_number ON devices(serial_number);
CREATE INDEX idx_devices_status ON devices(status);

-- Pet profiles table
CREATE TABLE pet_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    weight DECIMAL(5, 2), -- kg
    height DECIMAL(5, 2), -- cm
    photo_url TEXT,
    dietary_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pet_profiles_user_id ON pet_profiles(user_id);

-- Feeding events table - log of all feeding attempts
CREATE TABLE feeding_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL,
    target_grams DECIMAL(6, 2) NOT NULL,
    actual_grams DECIMAL(6, 2),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'PARTIAL', 'FAILED')),
    anomalies JSONB DEFAULT '[]',
    duration_seconds INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_feeding_events_device_id ON feeding_events(device_id);
CREATE INDEX idx_feeding_events_user_id ON feeding_events(user_id);
CREATE INDEX idx_feeding_events_timestamp ON feeding_events(timestamp DESC);
CREATE INDEX idx_feeding_events_status ON feeding_events(status);

-- Command queue table - for offline command queuing
CREATE TABLE command_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    command_type VARCHAR(20) NOT NULL CHECK (command_type IN ('FEED', 'PAUSE', 'RESUME', 'CALIBRATE', 'UPDATE_CONFIG')),
    payload JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'EXECUTED', 'FAILED', 'CANCELLED')),
    idempotency_token VARCHAR(64) UNIQUE NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_command_queue_device_status ON command_queue(device_id, status) WHERE status = 'PENDING';
CREATE INDEX idx_command_queue_idempotency ON command_queue(idempotency_token);
CREATE INDEX idx_command_queue_created_at ON command_queue(created_at DESC);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('FEED_COMPLETE', 'FEED_FAILED', 'LOW_FOOD', 'LOW_WATER', 'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'CALIBRATION_NEEDED')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Device sensors table - for water level, food level, etc
CREATE TABLE device_sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    sensor_type VARCHAR(20) NOT NULL CHECK (sensor_type IN ('FOOD_LEVEL', 'WATER_LEVEL', 'TEMPERATURE', 'HUMIDITY')),
    value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_device_sensors_device_id ON device_sensors(device_id);
CREATE INDEX idx_device_sensors_timestamp ON device_sensors(timestamp DESC);
CREATE INDEX idx_device_sensors_type ON device_sensors(device_id, sensor_type, timestamp DESC);

-- Device shared access table - for multi-caregiver support
CREATE TABLE device_shared_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'VIEWER' CHECK (role IN ('OWNER', 'ADMIN', 'CAREGIVER', 'VIEWER')),
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, user_id)
);

CREATE INDEX idx_device_shared_access_user_id ON device_shared_access(user_id);
CREATE INDEX idx_device_shared_access_device_id ON device_shared_access(device_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_profiles_updated_at BEFORE UPDATE ON pet_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create notifications when feeding completes
CREATE OR REPLACE FUNCTION notify_feed_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'SUCCESS' AND OLD.status != 'SUCCESS' THEN
        INSERT INTO notifications (user_id, device_id, type, title, message, metadata)
        VALUES (
            NEW.user_id,
            NEW.device_id,
            'FEED_COMPLETE',
            'Feeding Complete',
            'Successfully dispensed ' || NEW.actual_grams || 'g of food',
            jsonb_build_object('feeding_event_id', NEW.id, 'actual_grams', NEW.actual_grams)
        );
    ELSIF NEW.status = 'FAILED' AND OLD.status != 'FAILED' THEN
        INSERT INTO notifications (user_id, device_id, type, title, message, metadata)
        VALUES (
            NEW.user_id,
            NEW.device_id,
            'FEED_FAILED',
            'Feeding Failed',
            'Failed to dispense food. Please check the device.',
            jsonb_build_object('feeding_event_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_feed_completion
    AFTER UPDATE ON feeding_events
    FOR EACH ROW
    EXECUTE FUNCTION notify_feed_completion();

-- Function to update device last_seen_at when command is executed
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices
    SET last_seen_at = NOW(),
        status = 'ONLINE'
    WHERE id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_last_seen
    AFTER UPDATE ON command_queue
    FOR EACH ROW
    WHEN (NEW.status = 'EXECUTED')
    EXECUTE FUNCTION update_device_last_seen();

-- Enable row level security on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_shared_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for devices
CREATE POLICY "Users can view their own devices"
    ON devices FOR SELECT
    USING (auth.uid() = owner_id OR auth.uid() IN (
        SELECT user_id FROM device_shared_access WHERE device_id = devices.id
    ));

CREATE POLICY "Users can insert their own devices"
    ON devices FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own devices"
    ON devices FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own devices"
    ON devices FOR DELETE
    USING (auth.uid() = owner_id);

-- RLS policies for pet profiles
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

-- RLS policies for feeding events
CREATE POLICY "Users can view feeding events for their devices"
    ON feeding_events FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT owner_id FROM devices WHERE id = feeding_events.device_id
    ));

CREATE POLICY "Users can insert feeding events for their devices"
    ON feeding_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS policies for command queue
CREATE POLICY "Users can view commands for their devices"
    ON command_queue FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT owner_id FROM devices WHERE id = command_queue.device_id
    ));

CREATE POLICY "Users can insert commands for their devices"
    ON command_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commands"
    ON command_queue FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- RLS policies for device sensors
CREATE POLICY "Users can view sensor data for their devices"
    ON device_sensors FOR SELECT
    USING (auth.uid() IN (
        SELECT owner_id FROM devices WHERE id = device_sensors.device_id
    ));

-- RLS policies for device shared access
CREATE POLICY "Users can view shared access for their devices"
    ON device_shared_access FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT owner_id FROM devices WHERE id = device_shared_access.device_id
    ));

CREATE POLICY "Device owners can manage shared access"
    ON device_shared_access FOR ALL
    USING (auth.uid() IN (
        SELECT owner_id FROM devices WHERE id = device_shared_access.device_id
    ));

-- View for feeding statistics
CREATE OR REPLACE VIEW feeding_statistics AS
SELECT
    d.id AS device_id,
    d.device_name,
    d.owner_id,
    COUNT(fe.id) AS total_feedings,
    SUM(fe.actual_grams) AS total_grams_dispensed,
    AVG(fe.actual_grams) AS avg_grams_per_feeding,
    COUNT(CASE WHEN fe.status = 'SUCCESS' THEN 1 END) AS successful_feedings,
    COUNT(CASE WHEN fe.status = 'FAILED' THEN 1 END) AS failed_feedings,
    MAX(fe.timestamp) AS last_feeding_time
FROM devices d
LEFT JOIN feeding_events fe ON d.id = fe.device_id
GROUP BY d.id, d.device_name, d.owner_id;

-- View for daily feeding summary
CREATE OR REPLACE VIEW daily_feeding_summary AS
SELECT
    device_id,
    user_id,
    DATE(timestamp) AS feeding_date,
    COUNT(*) AS feeding_count,
    SUM(actual_grams) AS total_grams,
    AVG(actual_grams) AS avg_grams,
    MIN(timestamp) AS first_feeding,
    MAX(timestamp) AS last_feeding
FROM feeding_events
WHERE status = 'SUCCESS'
GROUP BY device_id, user_id, DATE(timestamp)
ORDER BY feeding_date DESC;
