import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export type SubscriptionTier = 'basic' | 'gold' | 'premium';

export interface TierLimits {
  max_announcements: number;
  max_images: number;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  limits: TierLimits;
  monthlyCount: number;
  canCreate: boolean;
  remainingAnnouncements: number;
  isLoading: boolean;
}

const DEFAULT_LIMITS: Record<SubscriptionTier, TierLimits> = {
  basic: { max_announcements: 5, max_images: 3 },
  gold: { max_announcements: 15, max_images: 6 },
  premium: { max_announcements: 30, max_images: 10 },
};

export function useSubscriptionLimits(): SubscriptionInfo {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('basic');
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSubscriptionInfo = async () => {
      setIsLoading(true);
      try {
        // Fetch user subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no subscription exists, create one with basic tier
        if (!subscription) {
          await supabase
            .from('user_subscriptions')
            .insert({ user_id: user.id, tier: 'basic' });
          setTier('basic');
        } else {
          setTier(subscription.tier as SubscriptionTier);
        }

        // Fetch monthly announcement count using the database function
        const { data: countResult } = await supabase
          .rpc('get_monthly_announcement_count', { p_user_id: user.id });

        setMonthlyCount(countResult || 0);
      } catch (error) {
        console.error('Error fetching subscription info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionInfo();
  }, [user]);

  const limits = DEFAULT_LIMITS[tier];
  const remainingAnnouncements = Math.max(0, limits.max_announcements - monthlyCount);
  const canCreate = remainingAnnouncements > 0;

  return {
    tier,
    limits,
    monthlyCount,
    canCreate,
    remainingAnnouncements,
    isLoading,
  };
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    basic: 'Basic',
    gold: 'Gold',
    premium: 'Premium',
  };
  return names[tier];
}

export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    basic: 'bg-muted text-muted-foreground',
    gold: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    premium: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  };
  return colors[tier];
}
