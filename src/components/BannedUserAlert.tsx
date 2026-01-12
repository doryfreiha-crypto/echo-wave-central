import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Warning {
  id: string;
  warning_type: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

interface BannedUserAlertProps {
  activeBan: Warning;
}

export function BannedUserAlert({ activeBan }: BannedUserAlertProps) {
  const { t } = useTranslation();
  const isPermanent = activeBan.warning_type === 'permanent_ban';

  return (
    <Alert variant="destructive" className="mb-6">
      {isPermanent ? <Ban className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      <AlertTitle>
        {isPermanent
          ? t('warnings.actionBlockedPermanent')
          : t('warnings.actionBlockedTemporary')}
      </AlertTitle>
      <AlertDescription>
        <p>{activeBan.reason}</p>
        {!isPermanent && activeBan.expires_at && (
          <p className="mt-2 text-sm">
            {t('warnings.banExpiresIn', {
              time: formatDistanceToNow(new Date(activeBan.expires_at)),
            })}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
