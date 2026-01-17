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
import { getCategoryFields } from '@/lib/categoryFields';
import { ArrowLeft, Trash2, Check, X, Eye, Users, Crown, Star, User, Flag, AlertTriangle, Shield, Ban, Megaphone } from 'lucide-react';
import { AdCampaignManager } from '@/components/admin/AdCampaignManager';
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
  announcementCount: number;
  monthlyCount: number;
}

const TIER_LIMITS: Record<SubscriptionTier, { announcements: number; images: number }> = {
  basic: { announcements: 5, images: 3 },
  gold: { announcements: 15, images: 6 },
  premium: { announcements: 30, images: 10 },
};

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
  attributes: Record<string, any> | null;
  views_count: number;
  profiles: {
    username: string;
    full_name: string | null;
  };
  categories: {
    name: string;
    slug: string;
  };
}

interface FraudReport {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_announcement_id: string | null;
  category: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter?: {
    username: string;
  };
  reported_user?: {
    username: string;
  };
  reported_announcement?: {
    title: string;
  };
}

interface UserWarning {
  id: string;
  user_id: string;
  warning_type: 'warning' | 'temporary_ban' | 'permanent_ban';
  reason: string;
  expires_at: string | null;
  created_at: string;
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
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningUserId, setWarningUserId] = useState<string | null>(null);
  const [warningType, setWarningType] = useState<'warning' | 'temporary_ban' | 'permanent_ban'>('warning');
  const [warningReason, setWarningReason] = useState('');
  const [warningExpiry, setWarningExpiry] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
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
    fetchFraudReports();
  };

  const fetchFraudReports = async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('fraud_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data
      if (data && data.length > 0) {
        const reporterIds = [...new Set(data.map(r => r.reporter_id).filter(Boolean))];
        const reportedUserIds = [...new Set(data.map(r => r.reported_user_id).filter(Boolean))] as string[];
        const announcementIds = [...new Set(data.map(r => r.reported_announcement_id).filter(Boolean))] as string[];

        const [reporterProfiles, reportedProfiles, announcements] = await Promise.all([
          supabase.from('profiles').select('id, username').in('id', reporterIds),
          reportedUserIds.length > 0 ? supabase.from('profiles').select('id, username').in('id', reportedUserIds) : { data: [] },
          announcementIds.length > 0 ? supabase.from('announcements').select('id, title').in('id', announcementIds) : { data: [] },
        ]);

        const reporterMap = new Map((reporterProfiles.data || []).map(p => [p.id, p]));
        const reportedMap = new Map((reportedProfiles.data || []).map(p => [p.id, p]));
        const announcementMap = new Map((announcements.data || []).map(a => [a.id, a]));

        const enrichedReports = data.map(report => ({
          ...report,
          status: report.status as FraudReport['status'],
          reporter: reporterMap.get(report.reporter_id),
          reported_user: report.reported_user_id ? reportedMap.get(report.reported_user_id) : undefined,
          reported_announcement: report.reported_announcement_id ? announcementMap.get(report.reported_announcement_id) : undefined,
        }));

        setFraudReports(enrichedReports);
      } else {
        setFraudReports([]);
      }
    } catch (error) {
      console.error('Error fetching fraud reports:', error);
      toast.error(t('errors.general'));
    } finally {
      setLoadingReports(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: FraudReport['status'], notes?: string) => {
    try {
      const updateData: any = { 
        status,
        admin_notes: notes || null,
      };

      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('fraud_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast.success(t('admin.reportUpdated'));
      fetchFraudReports();
      setReportDetailOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(t('errors.general'));
    }
  };

  const handleIssueWarning = async () => {
    if (!warningUserId || !warningReason.trim()) {
      toast.error(t('admin.warningReasonRequired'));
      return;
    }

    try {
      const { error } = await supabase.from('user_warnings').insert({
        user_id: warningUserId,
        issued_by: user?.id,
        fraud_report_id: selectedReport?.id || null,
        warning_type: warningType,
        reason: warningReason.trim(),
        expires_at: warningExpiry ? new Date(warningExpiry).toISOString() : null,
      });

      if (error) throw error;

      toast.success(t('admin.warningIssued'));
      setWarningDialogOpen(false);
      setWarningUserId(null);
      setWarningType('warning');
      setWarningReason('');
      setWarningExpiry('');
    } catch (error) {
      console.error('Error issuing warning:', error);
      toast.error(t('errors.general'));
    }
  };

  const openWarningDialog = (userId: string) => {
    setWarningUserId(userId);
    setWarningDialogOpen(true);
  };

  const getReportStatusBadge = (status: FraudReport['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t('admin.reportPending')}</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-500">{t('admin.reportReviewing')}</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">{t('admin.reportResolved')}</Badge>;
      case 'dismissed':
        return <Badge variant="outline">{t('admin.reportDismissed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      scam: t('report.scam'),
      fake_photos: t('report.fakePhotos'),
      wrong_info: t('report.wrongInfo'),
      suspicious_behavior: t('report.suspicious'),
      spam: t('report.spam'),
      other: t('report.other'),
    };
    return labels[category] || category;
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

    // Fetch all announcements to count per user
    const { data: allAnnouncements, error: announcementsError } = await supabase
      .from('announcements')
      .select('user_id, created_at');

    if (announcementsError) {
      toast.error(t('errors.general'));
      setLoadingUsers(false);
      return;
    }

    // Calculate current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Combine the data
    const usersData: UserWithSubscription[] = (profiles || []).map(profile => {
      const subscription = subscriptions?.find(s => s.user_id === profile.id);
      const userAnnouncements = allAnnouncements?.filter(a => a.user_id === profile.id) || [];
      const monthlyAnnouncements = userAnnouncements.filter(a => new Date(a.created_at) >= monthStart);
      
      return {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        created_at: profile.created_at,
        subscription: subscription ? {
          tier: subscription.tier,
          updated_at: subscription.updated_at,
        } : null,
        announcementCount: userAnnouncements.length,
        monthlyCount: monthlyAnnouncements.length,
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
        profiles (username, full_name),
        categories (name, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(t('errors.general'));
    } else {
      setAnnouncements((data || []).map(item => ({
        ...item,
        attributes: (item.attributes as Record<string, any>) || null
      })));
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
        if (import.meta.env.DEV) {
          console.error('Error sending notification:', error);
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error invoking notification function:', err);
      }
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
            <TabsTrigger value="reports" className="relative flex items-center gap-2">
              <Flag className="w-4 h-4" />
              {t('admin.fraudReports', 'Fraud Reports')}
              {fraudReports.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {fraudReports.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {t('admin.adCampaigns', 'Ad Campaigns')}
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
            {/* Tier Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.totalUsers', 'Total Users')}</p>
                      <p className="text-3xl font-bold">{usersWithSubscriptions.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Basic</p>
                      <p className="text-3xl font-bold">
                        {usersWithSubscriptions.filter(u => !u.subscription?.tier || u.subscription.tier === 'basic').length}
                      </p>
                    </div>
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gold</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {usersWithSubscriptions.filter(u => u.subscription?.tier === 'gold').length}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200 dark:border-purple-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Premium</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {usersWithSubscriptions.filter(u => u.subscription?.tier === 'premium').length}
                      </p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

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
                        <TableHead>{t('admin.totalAnnouncements', 'Total Listings')}</TableHead>
                        <TableHead>{t('admin.monthlyUsage', 'Monthly Usage')}</TableHead>
                        <TableHead>{t('admin.memberSince', 'Member Since')}</TableHead>
                        <TableHead>{t('admin.changeTier', 'Change Tier')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithSubscriptions.map((userItem) => {
                        const tier = userItem.subscription?.tier || 'basic';
                        const limits = TIER_LIMITS[tier];
                        const usagePercent = (userItem.monthlyCount / limits.announcements) * 100;
                        
                        return (
                          <TableRow key={userItem.id}>
                            <TableCell className="font-medium">{userItem.username}</TableCell>
                            <TableCell>{userItem.full_name || '-'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={getTierBadgeVariant(tier)}
                                className="flex items-center gap-1 w-fit"
                              >
                                {getTierIcon(tier)}
                                {tier}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{userItem.announcementCount}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${usagePercent >= 100 ? 'text-destructive' : usagePercent >= 80 ? 'text-yellow-600' : ''}`}>
                                    {userItem.monthlyCount}/{limits.announcements}
                                  </span>
                                  <span className="text-xs text-muted-foreground">this month</span>
                                </div>
                                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${usagePercent >= 100 ? 'bg-destructive' : usagePercent >= 80 ? 'bg-yellow-500' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={tier}
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
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fraud Reports Tab */}
          <TabsContent value="reports">
            {/* Report Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.pendingReports', 'Pending')}</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        {fraudReports.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.reviewingReports', 'Reviewing')}</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {fraudReports.filter(r => r.status === 'reviewing').length}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.resolvedReports', 'Resolved')}</p>
                      <p className="text-3xl font-bold text-green-600">
                        {fraudReports.filter(r => r.status === 'resolved').length}
                      </p>
                    </div>
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.totalReports', 'Total Reports')}</p>
                      <p className="text-3xl font-bold">{fraudReports.length}</p>
                    </div>
                    <Flag className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  {t('admin.fraudReports', 'Fraud Reports')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <p className="text-muted-foreground text-center py-8">{t('common.loading')}</p>
                ) : fraudReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('admin.noReports', 'No fraud reports')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.reportCategory', 'Category')}</TableHead>
                        <TableHead>{t('admin.reportedUser', 'Reported User')}</TableHead>
                        <TableHead>{t('admin.reportedItem', 'Reported Item')}</TableHead>
                        <TableHead>{t('admin.reportedBy', 'Reported By')}</TableHead>
                        <TableHead>{t('admin.status', 'Status')}</TableHead>
                        <TableHead>{t('admin.created', 'Created')}</TableHead>
                        <TableHead>{t('admin.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fraudReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              {getCategoryLabel(report.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {report.reported_user?.username || '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {report.reported_announcement?.title || '-'}
                          </TableCell>
                          <TableCell>{report.reporter?.username || 'Unknown'}</TableCell>
                          <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminNotes(report.admin_notes || '');
                                  setReportDetailOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {report.status === 'pending' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateReportStatus(report.id, 'reviewing')}
                                >
                                  {t('admin.startReview', 'Review')}
                                </Button>
                              )}
                              {report.reported_user_id && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openWarningDialog(report.reported_user_id!)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
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

          {/* Ad Campaigns Tab */}
          <TabsContent value="ads">
            <AdCampaignManager />
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
                {/* Images */}
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

                {/* Title & Price */}
                <div>
                  <h3 className="text-xl font-semibold">{selectedAnnouncement.title}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">
                    €{selectedAnnouncement.price?.toFixed(2) || '0.00'}
                  </p>
                </div>

                {/* Meta info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('filters.category')}</p>
                    <p className="font-medium mt-1">{t(`categories.${selectedAnnouncement.categories.slug}`, selectedAnnouncement.categories.name)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('admin.user')}</p>
                    <p className="font-medium mt-1">
                      {selectedAnnouncement.profiles.full_name || selectedAnnouncement.profiles.username}
                      <span className="text-muted-foreground text-xs ml-1">(@{selectedAnnouncement.profiles.username})</span>
                    </p>
                  </div>
                  {selectedAnnouncement.location && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('listing.location')}</p>
                      <p className="font-medium mt-1">{selectedAnnouncement.location}</p>
                    </div>
                  )}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('admin.created')}</p>
                    <p className="font-medium mt-1">{new Date(selectedAnnouncement.created_at).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('admin.status')}</p>
                    <Badge variant={getStatusBadgeVariant(selectedAnnouncement.status)} className="mt-1">
                      {t(`admin.statuses.${selectedAnnouncement.status}`, selectedAnnouncement.status)}
                    </Badge>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('listing.views', 'Views')}</p>
                    <p className="font-medium mt-1">{selectedAnnouncement.views_count}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">{t('listing.description')}</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedAnnouncement.description}</p>
                </div>

                {/* Category-specific attributes */}
                {selectedAnnouncement.attributes && Object.keys(selectedAnnouncement.attributes).length > 0 && (
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-2">{t('listing.details', 'Details')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(() => {
                        const categoryName = selectedAnnouncement.categories?.name || '';
                        const fieldDefs = getCategoryFields(categoryName);
                        const fieldMap = new Map(fieldDefs.map(f => [f.name, f.label]));
                        
                        return Object.entries(selectedAnnouncement.attributes).map(([key, value]) => {
                          if (value === null || value === undefined || value === '') return null;
                          const label = fieldMap.get(key) || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return (
                            <div key={key} className="bg-muted/50 rounded-lg p-2">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                              <p className="font-medium text-sm mt-0.5">{String(value)}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t">
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

        {/* Report Detail Dialog */}
        <Dialog open={reportDetailOpen} onOpenChange={setReportDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-destructive" />
                {t('admin.reportDetails', 'Report Details')}
              </DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase">{t('admin.reportCategory', 'Category')}</p>
                    <p className="font-medium mt-1">{getCategoryLabel(selectedReport.category)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase">{t('admin.status', 'Status')}</p>
                    <div className="mt-1">{getReportStatusBadge(selectedReport.status)}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase">{t('admin.reportedBy', 'Reported By')}</p>
                    <p className="font-medium mt-1">{selectedReport.reporter?.username || 'Unknown'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground uppercase">{t('admin.created', 'Created')}</p>
                    <p className="font-medium mt-1">{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                  {selectedReport.reported_user && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">{t('admin.reportedUser', 'Reported User')}</p>
                      <p className="font-medium mt-1">{selectedReport.reported_user.username}</p>
                    </div>
                  )}
                  {selectedReport.reported_announcement && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">{t('admin.reportedItem', 'Reported Item')}</p>
                      <p className="font-medium mt-1 truncate">{selectedReport.reported_announcement.title}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">{t('admin.reportDescription', 'Description')}</Label>
                  <p className="mt-1 text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">{t('admin.adminNotes', 'Admin Notes')}</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={t('admin.adminNotesPlaceholder', 'Add notes about this report...')}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedReport.status !== 'resolved' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateReportStatus(selectedReport.id, 'resolved', adminNotes)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('admin.resolveReport', 'Resolve')}
                    </Button>
                  )}
                  {selectedReport.status !== 'dismissed' && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateReportStatus(selectedReport.id, 'dismissed', adminNotes)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('admin.dismissReport', 'Dismiss')}
                    </Button>
                  )}
                  {selectedReport.reported_user_id && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setReportDetailOpen(false);
                        openWarningDialog(selectedReport.reported_user_id!);
                      }}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {t('admin.issueWarning', 'Warn/Ban')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Warning/Ban Dialog */}
        <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Shield className="w-5 h-5" />
                {t('admin.issueWarningTitle', 'Issue Warning or Ban')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.issueWarningDescription', 'Take action against this user for policy violations.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('admin.actionType', 'Action Type')}</Label>
                <Select value={warningType} onValueChange={(v) => setWarningType(v as typeof warningType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        {t('admin.warningOnly', 'Warning Only')}
                      </div>
                    </SelectItem>
                    <SelectItem value="temporary_ban">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-orange-500" />
                        {t('admin.temporaryBan', 'Temporary Ban')}
                      </div>
                    </SelectItem>
                    <SelectItem value="permanent_ban">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-500" />
                        {t('admin.permanentBan', 'Permanent Ban')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {warningType === 'temporary_ban' && (
                <div className="space-y-2">
                  <Label htmlFor="warning-expiry">{t('admin.banExpiry', 'Ban Expiry Date')}</Label>
                  <input
                    type="datetime-local"
                    id="warning-expiry"
                    value={warningExpiry}
                    onChange={(e) => setWarningExpiry(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="warning-reason">{t('admin.warningReason', 'Reason')} *</Label>
                <Textarea
                  id="warning-reason"
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder={t('admin.warningReasonPlaceholder', 'Explain the reason for this action...')}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWarningDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleIssueWarning}>
                {t('admin.confirmAction', 'Confirm Action')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}