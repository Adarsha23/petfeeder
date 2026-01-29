-- Create feeding_schedules table with refined structure
DROP TABLE IF EXISTS public.feeding_schedules;

CREATE TABLE public.feeding_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    pet_id UUID NOT NULL REFERENCES public.pet_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Feeding Plan',
    feeding_times JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {time: string, portion_grams: number}
    days_of_week INTEGER[] NOT NULL, -- 0-6 where 0 is Sunday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS feeding_schedules_user_id_idx ON public.feeding_schedules(user_id);
CREATE INDEX IF NOT EXISTS feeding_schedules_device_id_idx ON public.feeding_schedules(device_id);
CREATE INDEX IF NOT EXISTS feeding_schedules_pet_id_idx ON public.feeding_schedules(pet_id);

-- Enable RLS
ALTER TABLE public.feeding_schedules ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Users can view their own feeding schedules"
    ON public.feeding_schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feeding schedules"
    ON public.feeding_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeding schedules"
    ON public.feeding_schedules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeding schedules"
    ON public.feeding_schedules FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feeding_schedules_updated_at
    BEFORE UPDATE ON public.feeding_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
