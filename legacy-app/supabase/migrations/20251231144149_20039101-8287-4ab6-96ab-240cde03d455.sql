-- Add 'pending' status value to the announcement_status enum
ALTER TYPE announcement_status ADD VALUE IF NOT EXISTS 'pending';