-- Add attributes column to announcements table for category-specific fields
ALTER TABLE public.announcements 
ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;