import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Ban, ShieldAlert, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Warning {
  id: string;
  warning_type: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

interface UserWarningsDisplayProps {
  warnings: Warning[];
  showAll?: boolean;
}

export function UserWarningsDisplay({ warnings, showAll = false }: UserWarningsDisplayProps) {
  const { t } = useTranslation();

  if (warnings.length === 0) return null;

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'permanent_ban':
        return <Ban className="h-4 w-4" />;
      case 'temporary_ban':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'permanent_ban':
        return 'bg-destructive text-destructive-foreground';
      case 'temporary_ban':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const getWarningLabel = (type: string) => {
    switch (type) {
      case 'permanent_ban':
        return t('warnings.permanentBan');
      case 'temporary_ban':
        return t('warnings.temporaryBan');
      default:
        return t('warnings.warning');
    }
  };

  const isActive = (warning: Warning) => {
    if (warning.warning_type === 'permanent_ban') return true;
    if (warning.warning_type === 'temporary_ban' && warning.expires_at) {
      return new Date(warning.expires_at) > new Date();
    }
    return warning.warning_type === 'warning';
  };

  const activeWarnings = warnings.filter(isActive);
  const displayWarnings = showAll ? warnings : activeWarnings;

  if (displayWarnings.length === 0) return null;

  // Check for active ban
  const activeBan = activeWarnings.find(
    (w) => w.warning_type === 'permanent_ban' || w.warning_type === 'temporary_ban'
  );

  return (
    <div className="space-y-4">
      {activeBan && (
        <Alert variant="destructive" className="border-destructive/50">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {activeBan.warning_type === 'permanent_ban'
              ? t('warnings.accountPermanentlyBanned')
              : t('warnings.accountTemporarilyBanned')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{activeBan.reason}</p>
            {activeBan.warning_type === 'temporary_ban' && activeBan.expires_at && (
              <p className="text-sm opacity-80">
                {t('warnings.banExpiresIn', {
                  time: formatDistanceToNow(new Date(activeBan.expires_at)),
                })}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {displayWarnings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {t('warnings.accountWarnings', { count: displayWarnings.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayWarnings.map((warning) => (
              <div
                key={warning.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Badge className={`flex-shrink-0 ${getWarningColor(warning.warning_type)}`}>
                  {getWarningIcon(warning.warning_type)}
                  <span className="ml-1">{getWarningLabel(warning.warning_type)}</span>
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{warning.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                    {warning.warning_type === 'temporary_ban' && warning.expires_at && (
                      <>
                        {' · '}
                        {new Date(warning.expires_at) > new Date()
                          ? t('warnings.expiresIn', {
                              time: formatDistanceToNow(new Date(warning.expires_at)),
                            })
                          : t('warnings.expired')}
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
