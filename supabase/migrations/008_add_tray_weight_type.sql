-- Add TRAY_WEIGHT to allowed sensor types
ALTER TABLE device_sensors DROP CONSTRAINT IF EXISTS device_sensors_sensor_type_check;

ALTER TABLE device_sensors ADD CONSTRAINT device_sensors_sensor_type_check 
CHECK (sensor_type IN ('FOOD_LEVEL', 'WATER_LEVEL', 'TEMPERATURE', 'HUMIDITY', 'TRAY_WEIGHT'));
