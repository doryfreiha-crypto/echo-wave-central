import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, MousePointer, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AdCampaign {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  target_url: string;
  size: string;
  placement: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  budget: number;
  cost_per_click: number;
  cost_per_impression: number;
  created_at: string;
  impressions?: number;
  clicks?: number;
}

interface CampaignMetrics {
  campaign_id: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

const defaultCampaign = {
  name: '',
  description: '',
  image_url: '',
  target_url: '',
  size: 'banner',
  placement: 'home',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  is_active: true,
  budget: 0,
  cost_per_click: 0,
  cost_per_impression: 0,
};

export function AdCampaignManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [metrics, setMetrics] = useState<Record<string, CampaignMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [formData, setFormData] = useState(defaultCampaign);
  const [totalStats, setTotalStats] = useState({ impressions: 0, clicks: 0, spend: 0 });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Fetch metrics for all campaigns
      const { data: metricsData, error: metricsError } = await supabase
        .from('ad_metrics')
        .select('campaign_id, event_type');

      if (metricsError) throw metricsError;

      // Aggregate metrics
      const metricsMap: Record<string, CampaignMetrics> = {};
      let totalImpressions = 0;
      let totalClicks = 0;

      campaignsData?.forEach(campaign => {
        const campaignMetrics = metricsData?.filter(m => m.campaign_id === campaign.id) || [];
        const impressions = campaignMetrics.filter(m => m.event_type === 'impression').length;
        const clicks = campaignMetrics.filter(m => m.event_type === 'click').length;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const spend = (impressions * (campaign.cost_per_impression || 0)) + (clicks * (campaign.cost_per_click || 0));

        metricsMap[campaign.id] = { campaign_id: campaign.id, impressions, clicks, ctr, spend };
        totalImpressions += impressions;
        totalClicks += clicks;
      });

      const totalSpend = Object.values(metricsMap).reduce((sum, m) => sum + m.spend, 0);
      setTotalStats({ impressions: totalImpressions, clicks: totalClicks, spend: totalSpend });
      setMetrics(metricsMap);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load ad campaigns');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const campaignData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        created_by: user.id,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('ad_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast.success('Campaign updated successfully');
      } else {
        const { error } = await supabase
          .from('ad_campaigns')
          .insert(campaignData);

        if (error) throw error;
        toast.success('Campaign created successfully');
      }

      setDialogOpen(false);
      setEditingCampaign(null);
      setFormData(defaultCampaign);
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const handleEdit = (campaign: AdCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      image_url: campaign.image_url || '',
      target_url: campaign.target_url,
      size: campaign.size,
      placement: campaign.placement,
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      is_active: campaign.is_active,
      budget: campaign.budget,
      cost_per_click: campaign.cost_per_click,
      cost_per_impression: campaign.cost_per_impression,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const toggleActive = async (campaign: AdCampaign) => {
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id);

      if (error) throw error;
      toast.success(`Campaign ${campaign.is_active ? 'paused' : 'activated'}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const openNewCampaign = () => {
    setEditingCampaign(null);
    setFormData(defaultCampaign);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{totalStats.impressions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{totalStats.clicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">€{totalStats.spend.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ad Campaigns</CardTitle>
            <CardDescription>Manage your advertising campaigns and track performance</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewCampaign}>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Campaign Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Summer Sale Campaign"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target URL *</Label>
                    <Input
                      value={formData.target_url}
                      onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                      placeholder="https://example.com/offer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Campaign description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ad Size</Label>
                    <Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leaderboard">Leaderboard (728x90)</SelectItem>
                        <SelectItem value="banner">Banner (468x60)</SelectItem>
                        <SelectItem value="rectangle">Rectangle (300x250)</SelectItem>
                        <SelectItem value="skyscraper">Skyscraper (160x600)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Placement</Label>
                    <Select value={formData.placement} onValueChange={(v) => setFormData({ ...formData, placement: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home Page</SelectItem>
                        <SelectItem value="detail">Announcement Detail</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="all">All Placements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Budget (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Click (€)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.cost_per_click}
                      onChange={(e) => setFormData({ ...formData, cost_per_click: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Impression (€)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.cost_per_impression}
                      onChange={(e) => setFormData({ ...formData, cost_per_impression: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Campaign Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.target_url}>
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns yet. Create your first campaign to start advertising.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const campaignMetrics = metrics[campaign.id] || { impressions: 0, clicks: 0, ctr: 0, spend: 0 };
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.size}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.placement}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                          {campaign.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{campaignMetrics.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{campaignMetrics.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{campaignMetrics.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">€{campaignMetrics.spend.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleActive(campaign)}>
                            {campaign.is_active ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
