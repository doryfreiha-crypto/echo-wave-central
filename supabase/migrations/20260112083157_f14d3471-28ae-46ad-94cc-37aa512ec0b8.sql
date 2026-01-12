-- Create table for user ratings/reviews
CREATE TABLE public.user_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID NOT NULL,
    reviewed_user_id UUID NOT NULL,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type TEXT NOT NULL CHECK (review_type IN ('buyer', 'seller')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_review UNIQUE (reviewer_id, reviewed_user_id, announcement_id)
);

-- Create table for fraud reports
CREATE TABLE public.fraud_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL,
    reported_user_id UUID,
    reported_announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('scam', 'fake_photos', 'wrong_info', 'suspicious_behavior', 'spam', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user warnings (admin actions)
CREATE TABLE public.user_warnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    fraud_report_id UUID REFERENCES public.fraud_reports(id) ON DELETE SET NULL,
    warning_type TEXT NOT NULL CHECK (warning_type IN ('warning', 'temporary_ban', 'permanent_ban')),
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add phone_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.user_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON public.user_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" 
ON public.user_reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.user_reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- RLS Policies for fraud_reports
CREATE POLICY "Users can view their own reports" 
ON public.fraud_reports 
FOR SELECT 
USING (auth.uid() = reporter_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create reports" 
ON public.fraud_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can update reports" 
ON public.fraud_reports 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete reports" 
ON public.fraud_reports 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_warnings
CREATE POLICY "Users can view their own warnings" 
ON public.user_warnings 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can create warnings" 
ON public.user_warnings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update warnings" 
ON public.user_warnings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete warnings" 
ON public.user_warnings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get user average rating
CREATE OR REPLACE FUNCTION public.get_user_rating(p_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'average_rating', COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    'total_reviews', COUNT(*),
    'as_seller', COUNT(*) FILTER (WHERE review_type = 'seller'),
    'as_buyer', COUNT(*) FILTER (WHERE review_type = 'buyer')
  )
  FROM public.user_reviews
  WHERE reviewed_user_id = p_user_id
$$;

-- Create updated_at trigger for new tables
CREATE TRIGGER update_user_reviews_updated_at
BEFORE UPDATE ON public.user_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fraud_reports_updated_at
BEFORE UPDATE ON public.fraud_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();