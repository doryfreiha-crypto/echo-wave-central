-- Add published_at column to track when announcements are approved
ALTER TABLE public.announcements 
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing active announcements to have published_at set to updated_at
UPDATE public.announcements 
SET published_at = updated_at 
WHERE status = 'active' AND published_at IS NULL;