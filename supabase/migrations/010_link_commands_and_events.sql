-- 0. Allow WATER_FEED command type and TRAY_WEIGHT sensor type
ALTER TABLE command_queue DROP CONSTRAINT IF EXISTS command_queue_command_type_check;
ALTER TABLE command_queue ADD CONSTRAINT command_queue_command_type_check 
    CHECK (command_type IN ('FEED', 'WATER_FEED', 'PAUSE', 'RESUME', 'CALIBRATE', 'UPDATE_CONFIG'));

ALTER TABLE device_sensors DROP CONSTRAINT IF EXISTS device_sensors_sensor_type_check;
ALTER TABLE device_sensors ADD CONSTRAINT device_sensors_sensor_type_check 
    CHECK (sensor_type IN ('FOOD_LEVEL', 'WATER_LEVEL', 'TRAY_WEIGHT', 'TEMPERATURE', 'HUMIDITY'));


ALTER TABLE command_queue ADD COLUMN IF NOT EXISTS result JSONB;

-- 2. Create a function to automatically update feeding_events when a command is EXECUTED
CREATE OR REPLACE FUNCTION handle_command_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'EXECUTED'
    IF NEW.status = 'EXECUTED' AND (NEW.command_type = 'FEED' OR NEW.command_type = 'WATER_FEED') THEN
        -- If we have a linked feeding_event_id in the payload
        IF NEW.payload ? 'feeding_event_id' THEN
            UPDATE feeding_events
            SET 
                status = 'SUCCESS',
                actual_grams = (NEW.result->>'actual_grams')::numeric,
                timestamp = NOW()
            WHERE id = (NEW.payload->>'feeding_event_id')::uuid;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_command_executed ON command_queue;
CREATE TRIGGER on_command_executed
AFTER UPDATE ON command_queue
FOR EACH ROW
EXECUTE FUNCTION handle_command_completion();
