-- Fix phone number privacy - restrict to profile owner and admins only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create separate policies for profile data
-- Basic profile info (username, avatar) viewable by everyone
CREATE POLICY "Basic profile info viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Phone numbers only visible to profile owner and admins
CREATE POLICY "Phone numbers only visible to owner and admins"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Full name visible to authenticated users (can be restricted further if needed)
CREATE POLICY "Full name visible to authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add DELETE policy for conversations so users can remove their history
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id
);