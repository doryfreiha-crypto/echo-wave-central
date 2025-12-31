import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Announcement {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string | null;
  images: string[];
  status: string;
  rejection_reason: string | null;
  created_at: string;
  categories: {
    name: string;
  };
}

export default function MyListings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyAnnouncements();
  }, [user, navigate]);

  const fetchMyAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, categories(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Listing deleted successfully');
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete listing');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {t('myListings.pending')}
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('myListings.active')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {t('myListings.rejected')}
          </Badge>
        );
      case 'sold':
        return <Badge variant="secondary">{t('myListings.sold')}</Badge>;
      default:
        return <Badge variant="outline">{t('myListings.archived')}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('myListings.title')}</h1>
        </div>

        {announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">{t('myListings.noListings')}</p>
            <Button onClick={() => navigate('/create')}>{t('myListings.createFirst')}</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                {announcement.images && announcement.images.length > 0 && (
                  <img
                    src={announcement.images[0]}
                    alt={announcement.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{announcement.title}</h3>
                    {getStatusBadge(announcement.status)}
                  </div>
                  {announcement.status === 'pending' && (
                    <p className="text-xs text-muted-foreground mb-2 bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                      {t('myListings.pendingMessage')}
                    </p>
                  )}
                  {announcement.status === 'rejected' && (
                    <div className="text-xs mb-2 bg-red-50 dark:bg-red-950 p-2 rounded space-y-1">
                      <p className="text-destructive font-medium">{t('myListings.rejectedMessage')}</p>
                      {announcement.rejection_reason && (
                        <p className="text-red-600 dark:text-red-400">
                          <span className="font-medium">{t('myListings.reason')}:</span> {announcement.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {announcement.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-lg font-bold text-primary">
                      ${announcement.price?.toFixed(2) || '0.00'}
                    </p>
                    <Badge variant="outline">{announcement.categories.name}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/edit-announcement/${announcement.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this listing? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
