import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type AdSize = "leaderboard" | "banner" | "rectangle" | "skyscraper";

interface AdBannerProps {
  size?: AdSize;
  className?: string;
  slot?: string;
  placement?: string;
}

interface Campaign {
  id: string;
  name: string;
  image_url: string | null;
  target_url: string;
}

const sizeStyles: Record<AdSize, { width: string; height: string; label: string }> = {
  leaderboard: { width: "w-full max-w-[728px]", height: "h-[90px]", label: "728x90" },
  banner: { width: "w-full max-w-[468px]", height: "h-[60px]", label: "468x60" },
  rectangle: { width: "w-full max-w-[300px]", height: "h-[250px]", label: "300x250" },
  skyscraper: { width: "w-[160px]", height: "h-[600px]", label: "160x600" },
};

const AdBanner = ({ size = "banner", className = "", slot, placement = "home" }: AdBannerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { width, height, label } = sizeStyles[size];
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    fetchCampaign();
  }, [size, placement]);

  useEffect(() => {
    if (campaign && !impressionTracked.current) {
      trackEvent('impression');
      impressionTracked.current = true;
    }
  }, [campaign]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('id, name, image_url, target_url')
        .eq('is_active', true)
        .eq('size', size)
        .or(`placement.eq.${placement},placement.eq.all`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setCampaign(data);
      }
    } catch (error) {
      // Silently fail - show placeholder
    }
  };

  const trackEvent = async (eventType: 'impression' | 'click') => {
    if (!campaign) return;
    
    try {
      await supabase.from('ad_metrics').insert({
        campaign_id: campaign.id,
        event_type: eventType,
        user_id: user?.id || null,
        page_url: window.location.pathname,
      });
    } catch (error) {
      // Silently fail tracking
    }
  };

  const handleClick = () => {
    if (campaign) {
      trackEvent('click');
      window.open(campaign.target_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Show actual campaign ad if available
  if (campaign && campaign.image_url) {
    return (
      <div 
        className={`${width} ${height} ${className} rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]`}
        onClick={handleClick}
        data-ad-slot={slot}
        data-campaign-id={campaign.id}
      >
        <img 
          src={campaign.image_url} 
          alt={campaign.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Placeholder when no campaign is available
  return (
    <div 
      className={`${width} ${height} ${className} bg-gradient-to-r from-muted/50 to-muted border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden`}
      data-ad-slot={slot}
    >
      <div className="text-center p-4">
        <div className="text-xs text-muted-foreground mb-1">{t("ads.advertisement", "Advertisement")}</div>
        <div className="text-lg font-semibold text-primary">{t("ads.yourAdHere", "Your Ad Here")}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
};

export default AdBanner;
