import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserTrustBadge } from '@/components/UserTrustBadge';
import { UserReviews } from '@/components/UserReviews';
import { ReviewForm } from '@/components/ReviewForm';
import { ReportButton } from '@/components/ReportButton';
import { ArrowLeft, Megaphone, Calendar, Package, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_verified: boolean;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  created_at: string;
}

export default function UserProfile() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserAnnouncements();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, phone_verified, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnnouncements = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, price, images, location, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching user announcements:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t('trust.userNotFound')}</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-2">
                <Megaphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Echo Wave Central</span>
            </Link>
            
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  
                  {!isOwnProfile && (
                    <ReportButton userId={profile.id} variant="icon" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {t('trust.memberSince', { 
                    date: new Date(profile.created_at).toLocaleDateString() 
                  })}
                </div>

                <div className="mt-4">
                  <UserTrustBadge 
                    userId={profile.id} 
                    phoneVerified={profile.phone_verified}
                    showDetails
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('trust.activeListings', { count: announcements.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('trust.noListings')}
                </p>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <Link
                      key={ann.id}
                      to={`/announcement/${ann.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {ann.images?.[0] ? (
                          <img
                            src={ann.images[0]}
                            alt={ann.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{ann.title}</h4>
                        <p className="text-sm text-primary font-semibold">€{ann.price}</p>
                        <p className="text-xs text-muted-foreground">{ann.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="space-y-6">
            <UserReviews userId={profile.id} />

            {/* Leave Review Button */}
            {user && !isOwnProfile && !showReviewForm && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowReviewForm(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('trust.leaveReview', { type: '' })}
              </Button>
            )}

            {/* Review Form */}
            {showReviewForm && user && (
              <ReviewForm
                reviewedUserId={profile.id}
                reviewType="seller"
                onSuccess={() => {
                  setShowReviewForm(false);
                  window.location.reload();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}