-- Setup Supabase Storage for Pet Profiles
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-profiles', 'pet-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- 3. Set up RLS Policies

-- Allow anyone to view the photos (since it's a public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pet-profiles' );

-- Allow authenticated users to upload to their own folder
-- We assume the folder name starts with the user's ID
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( 
    bucket_id = 'pet-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text 
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( 
    bucket_id = 'pet-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text 
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
    bucket_id = 'pet-profiles' 
    AND (storage.foldername(name))[1] = auth.uid()::text 
);
