import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useMessageNotificationContext } from '@/components/MessageNotificationProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, Search, MapPin, LogOut, LayoutDashboard, MessageSquare, SlidersHorizontal, Grid3x3, List, Heart, LayoutGrid, Menu, X, User } from 'lucide-react';
import { toast } from 'sonner';
import AnnouncementFilters, { type FilterState } from '@/components/AnnouncementFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScrollAnimate } from '@/hooks/use-scroll-animation';
import { Footer } from '@/components/Footer';
import AdBanner from '@/components/AdBanner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  created_at: string;
  user_id: string;
  attributes: Record<string, any>;
  categories: Category;
  profiles: {
    username: string;
  };
}

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useMessageNotificationContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: '',
    searchQuery: '',
    minPrice: 0,
    maxPrice: 1000000,
    location: '',
    attributes: {},
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

  useEffect(() => {
    fetchCategories();
    fetchAnnouncements();
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [filters, searchQuery, sortBy]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load categories');
    } else {
      setCategories(data || []);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    let query = supabase
      .from('announcements')
      .select(`
        *,
        categories (id, name, slug),
        profiles (username)
      `)
      .eq('status', 'active');
    
    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }

    // Search filter
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Price range filter
    if (filters.minPrice > 0) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice < 1000000) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load announcements');
    } else {
      // Client-side filtering for attributes
      let filteredData = (data || []).map(item => ({
        ...item,
        attributes: (item.attributes as Record<string, any>) || {}
      }));
      
      if (Object.keys(filters.attributes).length > 0) {
        filteredData = filteredData.filter((announcement) => {
          const attrs = announcement.attributes;
          return Object.entries(filters.attributes).every(([key, value]) => {
            if (!value) return true; // Skip empty filters
            if (typeof attrs[key] === 'number' && typeof value === 'string') {
              return attrs[key] === parseFloat(value);
            }
            return attrs[key]?.toString().toLowerCase() === value.toString().toLowerCase();
          });
        });
      }
      
      setAnnouncements(filteredData);
    }
    setLoading(false);
  };

  const handleResetFilters = () => {
    setFilters({
      categoryId: '',
      searchQuery: '',
      minPrice: 0,
      maxPrice: 1000000,
      location: '',
      attributes: {},
    });
    setSearchQuery('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  const handleContactSeller = async (announcement: Announcement) => {
    if (!user) {
      toast.error('Please login to contact the seller');
      return;
    }

    if (announcement.user_id === user.id) {
      toast.error('You cannot message your own announcement');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('announcement_id', announcement.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existingConv) {
        // Navigate to existing conversation
        window.location.href = `/chat/${existingConv.id}`;
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          announcement_id: announcement.id,
          buyer_id: user.id,
          seller_id: announcement.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      window.location.href = `/chat/${newConv.id}`;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-primary rounded-xl p-2.5">
                  <Megaphone className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                Echo<span className="gradient-text">Wave</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="ghost" className="hover:bg-secondary" asChild>
                      <Link to="/admin">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t('nav.admin')}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="hover:bg-secondary relative" asChild>
                    <Link to="/messages">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t('nav.messages')}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="hover:bg-secondary" asChild>
                    <Link to="/favorites">
                      <Heart className="w-4 h-4 mr-2" />
                      {t('nav.favorites')}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="hover:bg-secondary" asChild>
                    <Link to="/my-listings">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t('nav.myListings')}
                    </Link>
                  </Button>
                  <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow" asChild>
                    <Link to="/create">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('nav.createAnnouncement')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-secondary" asChild>
                    <Link to="/profile">
                      <User className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button className="bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                  <Link to="/auth">{t('nav.login')}</Link>
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSwitcher />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-secondary">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 glass-strong">
                  <div className="flex flex-col gap-4 mt-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-primary rounded-xl p-2">
                        <Megaphone className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="font-display font-bold text-lg">
                        Echo<span className="gradient-text">Wave</span>
                      </span>
                    </Link>

                    {user ? (
                      <>
                        {isAdmin && (
                          <Link 
                            to="/admin" 
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                            <span className="font-medium">{t('nav.admin')}</span>
                          </Link>
                        )}
                        <Link 
                          to="/messages" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors relative"
                        >
                          <MessageSquare className="w-5 h-5 text-primary" />
                          <span className="font-medium">{t('nav.messages')}</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                        <Link 
                          to="/favorites" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Heart className="w-5 h-5 text-primary" />
                          <span className="font-medium">{t('nav.favorites')}</span>
                        </Link>
                        <Link 
                          to="/my-listings" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <LayoutGrid className="w-5 h-5 text-primary" />
                          <span className="font-medium">{t('nav.myListings')}</span>
                        </Link>
                        <Link 
                          to="/profile" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <User className="w-5 h-5 text-primary" />
                          <span className="font-medium">{t('nav.profile')}</span>
                        </Link>
                        
                        <div className="border-t border-border/50 my-2" />
                        
                        <Link to="/create" className="w-full">
                          <Button className="w-full bg-gradient-primary hover:opacity-90">
                            <Plus className="w-4 h-4 mr-2" />
                            {t('nav.createAnnouncement')}
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50" 
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          {t('nav.logout')}
                        </Button>
                      </>
                    ) : (
                      <Link to="/auth" className="w-full">
                        <Button className="w-full bg-gradient-primary hover:opacity-90">
                          {t('nav.login')}
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search & Sort */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                  <SelectValue placeholder={t('filters.sortBy')} />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="newest">{t('filters.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('filters.oldest')}</SelectItem>
                  <SelectItem value="price-low">{t('filters.priceLowHigh')}</SelectItem>
                  <SelectItem value="price-high">{t('filters.priceHighLow')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex bg-secondary/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-gradient-primary' : ''}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gradient-primary' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('compact')}
                  className={viewMode === 'compact' ? 'bg-gradient-primary' : ''}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Category Chips */}
          {categories.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
              <Badge
                variant={!filters.categoryId || filters.categoryId === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer transition-all shrink-0 ${
                  !filters.categoryId || filters.categoryId === 'all' 
                    ? 'bg-gradient-primary border-0' 
                    : 'hover:bg-secondary hover:border-primary/50'
                }`}
                onClick={() => setFilters({ ...filters, categoryId: '' })}
              >
                {t('common.all')}
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={filters.categoryId === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all shrink-0 ${
                    filters.categoryId === category.id 
                      ? 'bg-gradient-primary border-0' 
                      : 'hover:bg-secondary hover:border-primary/50'
                  }`}
                  onClick={() => setFilters({ ...filters, categoryId: category.id })}
                >
                  {t(`categories.${category.slug}`, category.name)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/30">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 opacity-0 fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">New listings every day</span>
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 opacity-0 fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              Discover <span className="gradient-text">Amazing Deals</span> Near You
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto opacity-0 fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Buy, sell, and connect with your local community. Find everything from electronics to real estate in one place.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              {user ? (
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow" asChild>
                  <Link to="/create">
                    <Plus className="w-5 h-5 mr-2" />
                    Post Your First Listing
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow" asChild>
                  <Link to="/auth">
                    Get Started Free
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })}>
                Browse Listings
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 mt-12 opacity-0 fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-display gradient-text">1,000+</div>
                <div className="text-sm text-muted-foreground">Active Listings</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-display gradient-text">500+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-display gradient-text">50+</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center">
          <AdBanner size="leaderboard" slot="home-top" />
        </div>
      </div>

      <div id="listings" className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <ScrollAnimate animation="fade-right">
              <div className="sticky top-24">
                <AnnouncementFilters
                  categories={categories}
                  filters={filters}
                  onFiltersChange={setFilters}
                  onReset={handleResetFilters}
                />
              </div>
            </ScrollAnimate>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            {(() => {
              const activeFilterCount = [
                filters.categoryId && filters.categoryId !== 'all',
                filters.location,
                filters.minPrice > 0,
                filters.maxPrice < 1000000,
                Object.keys(filters.attributes).filter(k => filters.attributes[k]).length > 0
              ].filter(Boolean).length;
              
              return (
                <div className="lg:hidden mb-4">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full relative">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <AnnouncementFilters
                        categories={categories}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onReset={handleResetFilters}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
              );
            })()}

            {/* Announcements */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading announcements...</span>
                </div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
                  <Megaphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No announcements found matching your filters.</p>
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : viewMode === 'compact' ? (
              <ScrollAnimate animation="fade-up">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {announcements.map((announcement, index) => (
                    <Link 
                      key={announcement.id} 
                      to={`/announcement/${announcement.id}`}
                      className="group"
                    >
                      <Card className="overflow-hidden h-full group-hover:-translate-y-1 transition-transform duration-300">
                        <div className="aspect-square relative overflow-hidden">
                          {announcement.images && announcement.images.length > 0 ? (
                            <img
                              src={announcement.images[0]}
                              alt={announcement.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                              <Megaphone className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                            {announcement.title}
                          </p>
                          <p className="text-sm font-bold gradient-text">
                            ${announcement.price.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ScrollAnimate>
            ) : viewMode === 'grid' ? (
              <ScrollAnimate animation="fade-up">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {announcements.map((announcement) => (
                    <Card 
                      key={announcement.id} 
                      className="overflow-hidden group"
                    >
                      <CardHeader className="p-0 relative overflow-hidden">
                        {announcement.images && announcement.images.length > 0 ? (
                          <img
                            src={announcement.images[0]}
                            alt={announcement.title}
                            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                            <Megaphone className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="glass-strong text-xs">
                            {announcement.categories.name}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5">
                        <CardTitle className="text-lg line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                          {announcement.title}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {announcement.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold font-display gradient-text">
                            ${announcement.price.toLocaleString()}
                          </span>
                        </div>
                        {announcement.location && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4 mr-1.5 text-primary/60" />
                            {announcement.location}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          by <span className="text-foreground font-medium">{announcement.profiles.username}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-5 pt-0 flex gap-2">
                        <Link to={`/announcement/${announcement.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        {user && announcement.user_id !== user.id && (
                          <Button
                            variant="gradient"
                            size="icon"
                            onClick={() => handleContactSeller(announcement)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollAnimate>
            ) : (
              <ScrollAnimate animation="fade-up">
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card 
                      key={announcement.id} 
                      className="overflow-hidden group"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 shrink-0 relative overflow-hidden">
                          {announcement.images && announcement.images.length > 0 ? (
                            <img
                              src={announcement.images[0]}
                              alt={announcement.title}
                              className="w-full h-40 sm:h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-40 sm:h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                              <Megaphone className="w-10 h-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <CardContent className="p-5 flex-1">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <CardTitle className="text-xl group-hover:text-primary transition-colors">{announcement.title}</CardTitle>
                              <Badge variant="secondary" className="shrink-0">{announcement.categories.name}</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {announcement.description}
                            </p>
                            <div className="flex items-center gap-4 mb-2 flex-wrap">
                              <span className="text-2xl font-bold font-display gradient-text">
                                ${announcement.price.toLocaleString()}
                              </span>
                              {announcement.location && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-1.5 text-primary/60" />
                                  {announcement.location}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              by <span className="text-foreground font-medium">{announcement.profiles.username}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-5 pt-0 flex gap-2">
                            <Link to={`/announcement/${announcement.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            {user && announcement.user_id !== user.id && (
                              <Button
                                variant="gradient"
                                onClick={() => handleContactSeller(announcement)}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contact
                              </Button>
                            )}
                          </CardFooter>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollAnimate>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
