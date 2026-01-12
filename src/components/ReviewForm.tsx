import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useUserWarnings } from '@/hooks/useUserWarnings';
import { BannedUserAlert } from '@/components/BannedUserAlert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ReviewFormProps {
  reviewedUserId: string;
  announcementId?: string;
  reviewType: 'buyer' | 'seller';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ reviewedUserId, announcementId, reviewType, onSuccess, onCancel }: ReviewFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeBan, isBanned } = useUserWarnings();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('auth.loginRequired'));
      return;
    }

    if (rating === 0) {
      toast.error(t('trust.selectRating'));
      return;
    }

    if (user.id === reviewedUserId) {
      toast.error(t('trust.cannotReviewSelf'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('user_reviews').insert({
        reviewer_id: user.id,
        reviewed_user_id: reviewedUserId,
        announcement_id: announcementId || null,
        rating,
        review_text: reviewText.trim() || null,
        review_type: reviewType,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error(t('trust.alreadyReviewed'));
        } else {
          throw error;
        }
      } else {
        toast.success(t('trust.reviewSubmitted'));
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('trust.reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t('trust.leaveReview', { type: t(`trust.${reviewType}`) })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBanned && activeBan ? (
          <BannedUserAlert activeBan={activeBan} />
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('trust.yourRating')}</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text">{t('trust.reviewText')}</Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t('trust.reviewPlaceholder')}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reviewText.length}/1000
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || rating === 0}>
              {submitting ? t('common.loading') : t('common.submit')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  );
}