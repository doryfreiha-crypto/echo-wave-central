import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserTrustBadge } from '@/components/UserTrustBadge';
import { ReportButton } from '@/components/ReportButton';
import { MessageSquare, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SellerCardProps {
  seller: {
    id: string;
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    phone_verified?: boolean;
  };
  showPhone?: boolean;
  onContact?: () => void;
  isOwnListing?: boolean;
}

export function SellerCard({ seller, showPhone = false, onContact, isOwnListing = false }: SellerCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/20">
              <AvatarImage src={seller.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {seller.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link 
                to={`/user/${seller.id}`} 
                className="font-semibold hover:text-primary transition-colors"
              >
                {seller.full_name || seller.username}
              </Link>
              <p className="text-sm text-muted-foreground">@{seller.username}</p>
            </div>
          </div>
          
          {!isOwnListing && (
            <ReportButton userId={seller.id} variant="icon" />
          )}
        </div>

        <div className="mt-4">
          <UserTrustBadge 
            userId={seller.id} 
            phoneVerified={seller.phone_verified} 
            showDetails 
          />
        </div>

        {showPhone && seller.phone && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('listing.phone')}</p>
            <p className="font-medium">{seller.phone}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {!isOwnListing && onContact && (
            <Button className="flex-1" onClick={onContact}>
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('listing.contactSeller')}
            </Button>
          )}
          <Button variant="outline" asChild className={!isOwnListing && onContact ? '' : 'flex-1'}>
            <Link to={`/user/${seller.id}`}>
              <User className="w-4 h-4 mr-2" />
              {t('trust.viewProfile')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}