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
import { ArrowLeft, Trash2, Check, X, Eye, Users, Crown, Star, User } from 'lucide-react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type SubscriptionTier = Database['public']['Enums']['subscription_tier'];

interface UserWithSubscription {
  id: string;
  username: string;
  full_name: string | null;
  created_at: string;
  subscription: {
    tier: SubscriptionTier;
    updated_at: string;
  } | null;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  published_at: string | null;
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingAnnouncement, setRejectingAnnouncement] = useState<{ id: string; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [usersWithSubscriptions, setUsersWithSubscriptions] = useState<UserWithSubscription[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
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
    fetchUsersWithSubscriptions();
  };

  const fetchUsersWithSubscriptions = async () => {
    setLoadingUsers(true);
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error(t('errors.general'));
      setLoadingUsers(false);
      return;
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier, updated_at');

    if (subscriptionsError) {
      toast.error(t('errors.general'));
      setLoadingUsers(false);
      return;
    }

    // Combine the data
    const usersData: UserWithSubscription[] = (profiles || []).map(profile => {
      const subscription = subscriptions?.find(s => s.user_id === profile.id);
      return {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        created_at: profile.created_at,
        subscription: subscription ? {
          tier: subscription.tier,
          updated_at: subscription.updated_at,
        } : null,
      };
    });

    setUsersWithSubscriptions(usersData);
    setLoadingUsers(false);
  };

  const handleUpdateTier = async (userId: string, newTier: SubscriptionTier) => {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ tier: newTier, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      // If no subscription exists, create one
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({ user_id: userId, tier: newTier });

      if (insertError) {
        toast.error(t('errors.general'));
        return;
      }
    }

    toast.success(t('admin.tierUpdated', { tier: newTier }));
    fetchUsersWithSubscriptions();
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'premium':
        return <Crown className="w-4 h-4 text-purple-500" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier): "default" | "secondary" | "destructive" | "outline" => {
    switch (tier) {
      case 'premium':
        return 'default';
      case 'gold':
        return 'secondary';
      default:
        return 'outline';
    }
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

  const sendNotification = async (announcementId: string, status: 'approved' | 'rejected', title: string, reason?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-announcement-notification', {
        body: {
          announcementId,
          status,
          announcementTitle: title,
          rejectionReason: reason,
        },
      });

      if (error) {
        console.error('Error sending notification:', error);
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
      .update({ 
        status: 'active', 
        rejection_reason: null,
        published_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error(t('admin.approveError'));
    } else {
      toast.success(t('admin.approved'));
      sendNotification(id, 'approved', announcementTitle);
      fetchAllAnnouncements();
    }
  };

  const openRejectDialog = (id: string, title: string) => {
    setRejectingAnnouncement({ id, title });
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectWithReason = async () => {
    if (!rejectingAnnouncement) return;

    const { id, title } = rejectingAnnouncement;

    const { error } = await supabase
      .from('announcements')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason.trim() || null
      })
      .eq('id', id);

    if (error) {
      toast.error(t('admin.rejectError'));
    } else {
      toast.success(t('admin.rejected'));
      sendNotification(id, 'rejected', title, rejectionReason.trim() || undefined);
      fetchAllAnnouncements();
    }

    setRejectDialogOpen(false);
    setRejectingAnnouncement(null);
    setRejectionReason('');
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
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('admin.userSubscriptions', 'User Subscriptions')}
            </TabsTrigger>
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
                                onClick={() => openRejectDialog(announcement.id, announcement.title)}
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
                      <TableHead>{t('admin.submitted')}</TableHead>
                      <TableHead>{t('admin.published')}</TableHead>
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
                          {announcement.published_at 
                            ? new Date(announcement.published_at).toLocaleDateString()
                            : '-'
                          }
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
                                  onClick={() => openRejectDialog(announcement.id, announcement.title)}
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

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('admin.userSubscriptions', 'User Subscriptions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-muted-foreground text-center py-8">{t('common.loading')}</p>
                ) : usersWithSubscriptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('admin.noUsers', 'No users found')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.username', 'Username')}</TableHead>
                        <TableHead>{t('admin.fullName', 'Full Name')}</TableHead>
                        <TableHead>{t('admin.currentTier', 'Current Tier')}</TableHead>
                        <TableHead>{t('admin.memberSince', 'Member Since')}</TableHead>
                        <TableHead>{t('admin.changeTier', 'Change Tier')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithSubscriptions.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-medium">{userItem.username}</TableCell>
                          <TableCell>{userItem.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={getTierBadgeVariant(userItem.subscription?.tier || 'basic')}
                              className="flex items-center gap-1 w-fit"
                            >
                              {getTierIcon(userItem.subscription?.tier || 'basic')}
                              {userItem.subscription?.tier || 'basic'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(userItem.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={userItem.subscription?.tier || 'basic'}
                              onValueChange={(value) => handleUpdateTier(userItem.id, value as SubscriptionTier)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    Basic
                                  </div>
                                </SelectItem>
                                <SelectItem value="gold">
                                  <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Gold
                                  </div>
                                </SelectItem>
                                <SelectItem value="premium">
                                  <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-purple-500" />
                                    Premium
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                      setPreviewOpen(false);
                      openRejectDialog(selectedAnnouncement.id, selectedAnnouncement.title);
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

        {/* Rejection Reason Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.rejectAnnouncement')}</DialogTitle>
              <DialogDescription>
                {t('admin.rejectReasonDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">{t('admin.rejectionReason')}</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={t('admin.rejectionReasonPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleRejectWithReason}>
                {t('admin.reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}