-- Add DELETE policy for messages table
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Update get_monthly_announcement_count to only allow querying own data or admin
CREATE OR REPLACE FUNCTION public.get_monthly_announcement_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = p_user_id OR has_role(auth.uid(), 'admin') THEN
      (SELECT COUNT(*)::INTEGER
      FROM public.announcements
      WHERE user_id = p_user_id
        AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
        AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month')
    ELSE 0
  END;
$$;