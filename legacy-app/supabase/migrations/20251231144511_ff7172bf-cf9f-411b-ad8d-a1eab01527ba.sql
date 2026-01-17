-- Update the default status to 'pending' for new announcements
ALTER TABLE public.announcements ALTER COLUMN status SET DEFAULT 'pending';

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;

-- Create new SELECT policy: public sees only 'active', owners and admins see all
CREATE POLICY "Active announcements are viewable by everyone"
ON public.announcements
FOR SELECT
USING (
  status = 'active'
  OR auth.uid() = user_id
  OR has_role(auth.uid(), 'admin')
);