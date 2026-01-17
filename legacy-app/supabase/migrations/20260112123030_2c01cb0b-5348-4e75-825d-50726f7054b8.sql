-- Create ad campaigns table
CREATE TABLE public.ad_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  target_url text NOT NULL,
  size text NOT NULL DEFAULT 'banner', -- leaderboard, banner, rectangle, skyscraper
  placement text NOT NULL DEFAULT 'home', -- home, detail, sidebar
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  budget numeric DEFAULT 0,
  cost_per_click numeric DEFAULT 0,
  cost_per_impression numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create ad impressions/clicks tracking table
CREATE TABLE public.ad_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'impression' or 'click'
  user_id uuid,
  page_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_campaigns
CREATE POLICY "Admins can manage ad campaigns"
ON public.ad_campaigns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Active campaigns viewable by everyone"
ON public.ad_campaigns
FOR SELECT
USING (is_active = true AND (end_date IS NULL OR end_date > now()));

-- RLS policies for ad_metrics
CREATE POLICY "Anyone can create impressions"
ON public.ad_metrics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can view metrics"
ON public.ad_metrics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete metrics"
ON public.ad_metrics
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_ad_metrics_campaign_id ON public.ad_metrics(campaign_id);
CREATE INDEX idx_ad_metrics_created_at ON public.ad_metrics(created_at);
CREATE INDEX idx_ad_campaigns_is_active ON public.ad_campaigns(is_active);
CREATE INDEX idx_ad_campaigns_placement ON public.ad_campaigns(placement);

-- Trigger for updated_at
CREATE TRIGGER update_ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();