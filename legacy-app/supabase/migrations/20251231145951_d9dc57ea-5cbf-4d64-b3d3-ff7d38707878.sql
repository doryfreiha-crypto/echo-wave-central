-- Add rejection_reason column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN rejection_reason text;