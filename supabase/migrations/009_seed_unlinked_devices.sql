-- 1. Make owner_id nullable so we can have "Unclaimed" devices in the database
ALTER TABLE devices ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Seed some factory-valid test devices
-- Pairing Code SHA-256 Hashes:
-- '1234' -> '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
-- '5678' -> '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5'

INSERT INTO devices (id, serial_number, pairing_code_hash, device_name, status)
VALUES 
    ('bd62346a-3e65-4f8d-b7ed-cf81467d228b', 'SPF-001', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'Living Room Pro', 'OFFLINE'),
    ('59d2ea03-f11a-466d-97e3-0c4608c023d4', 'SPF-002', '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', 'Kitchen Feeder Pro', 'OFFLINE')
ON CONFLICT (serial_number) DO NOTHING;
