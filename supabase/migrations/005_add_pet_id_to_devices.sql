-- Add pet_id column to devices table to support mandatory pet-feeder assignment
ALTER TABLE devices 
ADD COLUMN pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_devices_pet_id ON devices(pet_id);

-- Update existing devices if any (optional, will be null by default)
-- If you want to force an assignment for existing devices, you'd need a specific ID
-- UPDATE devices SET pet_id = 'YOUR_PET_ID_HERE' WHERE pet_id IS NULL;
