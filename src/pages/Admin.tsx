import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Check, X, Eye } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Announcement {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  location: string | null;
  images: string[] | null;
  profiles: {
    username: string;
  };
  categories: {
    name: string;
    slug: string;
  };
}

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminRole();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!data) {
      toast.error(t('errors.unauthorized'));
      navigate('/');
      return;
    }

    setIsAdmin(true);
    fetchAllAnnouncements();
  };

  const fetchAllAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        profiles (username),
        categories (name, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(t('errors.general'));
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  const sendNotification = async (announcementId: string, status: 'approved' | 'rejected', title: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-announcement-notification', {
        body: {
          announcementId,
          status,
          announcementTitle: title,
        },
      });

      if (error) {
        console.error('Error sending notification:', error);
        // Don't show error to user - notification is secondary
      } else {
        console.log('Notification sent successfully');
      }
    } catch (err) {
      console.error('Error invoking notification function:', err);
    }
  };

  const handleApprove = async (id: string, title?: string) => {
    const announcement = announcements.find(a => a.id === id);
    const announcementTitle = title || announcement?.title || 'Announcement';

    const { error } = await supabase
      .from('announcements')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error(t('admin.approveError'));
    } else {
      toast.success(t('admin.approved'));
      // Send email notification
      sendNotification(id, 'approved', announcementTitle);
      fetchAllAnnouncements();
    }
  };

  const handleReject = async (id: string, title?: string) => {
    const announcement = announcements.find(a => a.id === id);
    const announcementTitle = title || announcement?.title || 'Announcement';

    const { error } = await supabase
      .from('announcements')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast.error(t('admin.rejectError'));
    } else {
      toast.success(t('admin.rejected'));
      // Send email notification
      sendNotification(id, 'rejected', announcementTitle);
      fetchAllAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t('errors.general'));
    } else {
      toast.success(t('admin.deleted'));
      fetchAllAnnouncements();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'sold':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const pendingAnnouncements = announcements.filter(a => a.status === 'pending');
  const allOtherAnnouncements = announcements.filter(a => a.status !== 'pending');

  if (!isAdmin || loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              {t('admin.pendingReview')}
              {pendingAnnouncements.length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingAnnouncements.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">{t('admin.allAnnouncements')}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.pendingReview')}</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAnnouncements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('admin.noPending')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.title')}</TableHead>
                        <TableHead>{t('filters.category')}</TableHead>
                        <TableHead>{t('admin.user')}</TableHead>
                        <TableHead>{t('listing.price')}</TableHead>
                        <TableHead>{t('admin.created')}</TableHead>
                        <TableHead>{t('admin.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAnnouncements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-medium">{announcement.title}</TableCell>
                          <TableCell>{t(`categories.${announcement.categories.slug}`, announcement.categories.name)}</TableCell>
                          <TableCell>{announcement.profiles.username}</TableCell>
                          <TableCell>€{announcement.price?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAnnouncement(announcement);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(announcement.id, announcement.title)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(announcement.id, announcement.title)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.allAnnouncements')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.title')}</TableHead>
                      <TableHead>{t('filters.category')}</TableHead>
                      <TableHead>{t('admin.user')}</TableHead>
                      <TableHead>{t('listing.price')}</TableHead>
                      <TableHead>{t('admin.status')}</TableHead>
                      <TableHead>{t('admin.created')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell className="font-medium">{announcement.title}</TableCell>
                        <TableCell>{t(`categories.${announcement.categories.slug}`, announcement.categories.name)}</TableCell>
                        <TableCell>{announcement.profiles.username}</TableCell>
                        <TableCell>€{announcement.price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(announcement.status)}>
                            {t(`admin.statuses.${announcement.status}`, announcement.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {announcement.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(announcement.id, announcement.title)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(announcement.id, announcement.title)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('admin.deleteConfirmTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('admin.deleteConfirmDescription')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin.previewAnnouncement')}</DialogTitle>
              <DialogDescription>
                {t('admin.previewDescription')}
              </DialogDescription>
            </DialogHeader>
            {selectedAnnouncement && (
              <div className="space-y-4">
                {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAnnouncement.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${selectedAnnouncement.title} ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedAnnouncement.title}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">
                    €{selectedAnnouncement.price?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">{t('listing.description')}</h4>
                  <p className="mt-1">{selectedAnnouncement.description}</p>
                </div>
                {selectedAnnouncement.location && (
                  <div>
                    <h4 className="font-medium text-muted-foreground">{t('listing.location')}</h4>
                    <p className="mt-1">{selectedAnnouncement.location}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedAnnouncement.id, selectedAnnouncement.title);
                      setPreviewOpen(false);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {t('admin.approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReject(selectedAnnouncement.id, selectedAnnouncement.title);
                      setPreviewOpen(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('admin.reject')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}