import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Shield, Phone, Package, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserRating {
  average_rating: number;
  total_reviews: number;
  as_seller: number;
  as_buyer: number;
}

interface UserTrustBadgeProps {
  userId: string;
  phoneVerified?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserTrustBadge({ userId, phoneVerified = false, showDetails = false, size = 'md' }: UserTrustBadgeProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<UserRating | null>(null);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch rating using database function
      const { data: ratingData } = await supabase.rpc('get_user_rating', { p_user_id: userId });
      if (ratingData && typeof ratingData === 'object') {
        setRating(ratingData as unknown as UserRating);
      }

      // Fetch announcement count
      const { count } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');
      
      setAnnouncementCount(count || 0);
    } catch (error) {
      console.error('Error fetching user trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-base gap-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (loading) {
    return <div className="animate-pulse h-6 w-24 bg-muted rounded" />;
  }

  const avgRating = rating?.average_rating || 0;
  const totalReviews = rating?.total_reviews || 0;

  return (
    <div className={`flex items-center flex-wrap ${sizeClasses[size]}`}>
      {/* Star Rating */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="flex items-center gap-1 cursor-default">
            <Star className={`${iconSizes[size]} ${avgRating > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
            <span>{avgRating > 0 ? avgRating.toFixed(1) : '-'}</span>
            {showDetails && totalReviews > 0 && (
              <span className="text-muted-foreground">({totalReviews})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('trust.rating', { rating: avgRating, count: totalReviews })}</p>
          {rating && (
            <p className="text-xs text-muted-foreground">
              {t('trust.asSeller')}: {rating.as_seller} • {t('trust.asBuyer')}: {rating.as_buyer}
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Verified Phone */}
      {phoneVerified && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1 cursor-default text-green-600 border-green-200 bg-green-50">
              <Phone className={iconSizes[size]} />
              {showDetails && <span>{t('trust.verified')}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trust.phoneVerified')}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Announcement Count */}
      {showDetails && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1 cursor-default">
              <Package className={iconSizes[size]} />
              <span>{announcementCount}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trust.activeListings', { count: announcementCount })}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Trust Level Badge */}
      {totalReviews >= 10 && avgRating >= 4.5 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              <Shield className={iconSizes[size]} />
              {showDetails && <span>{t('trust.trustedSeller')}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trust.trustedSellerDesc')}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function UserRatingStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSizes[size]} ${
            star <= rating
              ? 'text-yellow-500 fill-yellow-500'
              : star - 0.5 <= rating
              ? 'text-yellow-500 fill-yellow-500/50'
              : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}