import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, User, Settings, Activity, Camera, Save, 
  Package, Heart, MessageSquare, Eye, Calendar, MapPin, LogOut, Crown
} from 'lucide-react';
import { useSubscriptionLimits, getTierDisplayName, getTierColor } from '@/hooks/useSubscriptionLimits';
import { z } from 'zod';

const profileSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username too long'),
  full_name: z.string().trim().max(100, 'Name too long').optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Phone too long').optional().or(z.literal('')),
});

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  price: number;
  status: string;
  views_count: number;
  created_at: string;
  images: string[];
}

interface ActivityStats {
  totalListings: number;
  activeListings: number;
  totalFavorites: number;
  totalMessages: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscriptionInfo = useSubscriptionLimits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
  });
  
  const [myListings, setMyListings] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalListings: 0,
    activeListings: 0,
    totalFavorites: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchActivity();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    if (!user) return;

    try {
      // Fetch user's listings
      const { data: listings, error: listingsError } = await supabase
        .from('announcements')
        .select('id, title, price, status, views_count, created_at, images')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (listingsError) throw listingsError;
      setMyListings(listings || []);

      // Count all listings
      const { count: totalListings } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count active listings
      const { count: activeListings } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Count favorites
      const { count: totalFavorites } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count conversations (as buyer or seller)
      const { count: buyerConvs } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id);

      const { count: sellerConvs } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);

      setStats({
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        totalFavorites: totalFavorites || 0,
        totalMessages: (buyerConvs || 0) + (sellerConvs || 0),
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const validation = profileSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: validation.data.username,
          full_name: validation.data.full_name || null,
          phone: validation.data.phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('announcements')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated successfully');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h1>
                <p className="text-muted-foreground">@{profile?.username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                  </span>
                  <Badge className={getTierColor(subscriptionInfo.tier)}>
                    <Crown className="w-3 h-3 mr-1" />
                    {getTierDisplayName(subscriptionInfo.tier)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {subscriptionInfo.remainingAnnouncements} of {subscriptionInfo.limits.max_announcements} announcements remaining this month • 
                  Max {subscriptionInfo.limits.max_images} images per listing
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold text-primary">{stats.totalListings}</div>
                  <div className="text-xs text-muted-foreground">Listings</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold text-green-500">{stats.activeListings}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold text-red-500">{stats.totalFavorites}</div>
                  <div className="text-xs text-muted-foreground">Favorites</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold text-blue-500">{stats.totalMessages}</div>
                  <div className="text-xs text-muted-foreground">Chats</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest listings and activity</CardDescription>
              </CardHeader>
              <CardContent>
                {myListings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No listings yet</p>
                    <Button asChild className="mt-4">
                      <Link to="/create">Create your first listing</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myListings.map((listing) => (
                      <Link
                        key={listing.id}
                        to={`/announcement/${listing.id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{listing.title}</h4>
                          <p className="text-sm text-primary font-semibold">€{listing.price}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={getStatusColor(listing.status)}>
                            {listing.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views_count}
                          </span>
                        </div>
                      </Link>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-center">
                      <Button variant="outline" asChild>
                        <Link to="/my-listings">View All Listings</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <Card className="hover:border-primary/50 transition-colors">
                <Link to="/my-listings" className="block p-6 text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">My Listings</h4>
                  <p className="text-sm text-muted-foreground">{stats.totalListings} total</p>
                </Link>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <Link to="/favorites" className="block p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <h4 className="font-medium">Favorites</h4>
                  <p className="text-sm text-muted-foreground">{stats.totalFavorites} saved</p>
                </Link>
              </Card>
              <Card className="hover:border-primary/50 transition-colors">
                <Link to="/messages" className="block p-6 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Messages</h4>
                  <p className="text-sm text-muted-foreground">{stats.totalMessages} conversations</p>
                </Link>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">Update your password</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        if (user?.email) {
                          const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                            redirectTo: `${window.location.origin}/auth`,
                          });
                          if (error) {
                            toast.error('Failed to send reset email');
                          } else {
                            toast.success('Password reset email sent');
                          }
                        }
                      }}
                    >
                      Send Reset Email
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => toast.error('Please contact support to delete your account')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
