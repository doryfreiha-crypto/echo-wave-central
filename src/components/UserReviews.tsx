import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRatingStars } from '@/components/UserTrustBadge';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  review_type: string;
  created_at: string;
  reviewer: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface UserReviewsProps {
  userId: string;
  limit?: number;
}

export function UserReviews({ userId, limit = 5 }: UserReviewsProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('user_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewed_user_id', userId);
      
      setTotalCount(count || 0);

      // Fetch reviews with reviewer info
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          id,
          rating,
          review_text,
          review_type,
          created_at,
          reviewer_id
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(showAll ? 50 : limit);

      if (error) throw error;

      // Fetch reviewer profiles
      if (data && data.length > 0) {
        const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', reviewerIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        const reviewsWithProfiles = data.map(review => ({
          ...review,
          reviewer: profileMap.get(review.reviewer_id) || {
            id: review.reviewer_id,
            username: 'Unknown',
            avatar_url: null
          }
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchReviews();
    }
  }, [showAll]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          {t('trust.reviews')} ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t('trust.noReviews')}
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.reviewer.avatar_url || undefined} />
                  <AvatarFallback>
                    {review.reviewer.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.reviewer.username}</span>
                      <Badge variant="outline" className="text-xs">
                        {t(`trust.${review.review_type}`)}
                      </Badge>
                    </div>
                    <UserRatingStars rating={review.rating} size="sm" />
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.review_text}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}

            {totalCount > limit && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    {t('common.showLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    {t('trust.showAllReviews', { count: totalCount })}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}