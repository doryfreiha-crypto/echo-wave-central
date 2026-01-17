-- Add latitude and longitude columns to announcements table for geolocation
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_announcements_coordinates 
ON public.announcements (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;