import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Flag, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type ReportCategory = 'scam' | 'fake_photos' | 'wrong_info' | 'suspicious_behavior' | 'spam' | 'other';

interface ReportButtonProps {
  userId?: string;
  announcementId?: string;
  variant?: 'icon' | 'button' | 'link';
}

export function ReportButton({ userId, announcementId, variant = 'button' }: ReportButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('scam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: { value: ReportCategory; label: string; description: string }[] = [
    { value: 'scam', label: t('report.scam'), description: t('report.scamDesc') },
    { value: 'fake_photos', label: t('report.fakePhotos'), description: t('report.fakePhotosDesc') },
    { value: 'wrong_info', label: t('report.wrongInfo'), description: t('report.wrongInfoDesc') },
    { value: 'suspicious_behavior', label: t('report.suspicious'), description: t('report.suspiciousDesc') },
    { value: 'spam', label: t('report.spam'), description: t('report.spamDesc') },
    { value: 'other', label: t('report.other'), description: t('report.otherDesc') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth');
      return;
    }

    if (!description.trim()) {
      toast.error(t('report.descriptionRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('fraud_reports').insert({
        reporter_id: user.id,
        reported_user_id: userId || null,
        reported_announcement_id: announcementId || null,
        category,
        description: description.trim(),
      });

      if (error) throw error;

      toast.success(t('report.submitted'));
      setOpen(false);
      setCategory('scam');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(t('report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpen = () => {
    if (!user) {
      toast.error(t('auth.loginRequired'));
      navigate('/auth');
      return;
    }
    setOpen(true);
  };

  const triggerButton = variant === 'icon' ? (
    <Button variant="ghost" size="icon" onClick={handleOpen} className="text-destructive hover:text-destructive">
      <Flag className="w-4 h-4" />
    </Button>
  ) : variant === 'link' ? (
    <button onClick={handleOpen} className="text-sm text-destructive hover:underline flex items-center gap-1">
      <Flag className="w-3 h-3" />
      {t('report.report')}
    </button>
  ) : (
    <Button variant="outline" onClick={handleOpen} className="text-destructive border-destructive/30 hover:bg-destructive/10">
      <Flag className="w-4 h-4 mr-2" />
      {t('report.report')}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {t('report.title')}
          </DialogTitle>
          <DialogDescription>
            {t('report.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>{t('report.category')}</Label>
            <RadioGroup value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
              {categories.map((cat) => (
                <div key={cat.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={cat.value} id={cat.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={cat.value} className="font-medium cursor-pointer">
                      {cat.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('report.details')} *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.detailsPlaceholder')}
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? t('common.loading') : t('report.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}