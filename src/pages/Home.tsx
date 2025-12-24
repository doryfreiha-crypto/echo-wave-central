import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, Search, MapPin, LogOut, LayoutDashboard, MessageSquare, SlidersHorizontal, Grid3x3, List, Heart, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import AnnouncementFilters, { type FilterState } from '@/components/AnnouncementFilters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { user } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-2">
                <Megaphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Echo Wave Central</span>
            </Link>
            
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="outline" asChild>
                      <Link to="/admin">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to="/messages">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/favorites">
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/my-listings">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Listings
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Ad
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/auth">Login</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Search & Sort */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-x-0"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('compact')}
                  className="rounded-l-none"
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
                className="cursor-pointer hover:bg-primary/90 transition-colors shrink-0"
                onClick={() => setFilters({ ...filters, categoryId: '' })}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={filters.categoryId === category.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/90 transition-colors shrink-0"
                  onClick={() => setFilters({ ...filters, categoryId: category.id })}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24">
              <AnnouncementFilters
                categories={categories}
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
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
              <div className="text-center py-12">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No announcements found matching your filters.</p>
                <Button variant="link" onClick={handleResetFilters} className="mt-2">
                  Clear all filters
                </Button>
              </div>
            ) : viewMode === 'compact' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {announcements.map((announcement) => (
                  <Link 
                    key={announcement.id} 
                    to={`/announcement/${announcement.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                      <div className="aspect-square relative">
                        {announcement.images && announcement.images.length > 0 ? (
                          <img
                            src={announcement.images[0]}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Megaphone className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {announcement.title}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          ${announcement.price.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="p-0">
                      {announcement.images && announcement.images.length > 0 ? (
                        <img
                          src={announcement.images[0]}
                          alt={announcement.title}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted flex items-center justify-center">
                          <Megaphone className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg line-clamp-1">{announcement.title}</CardTitle>
                        <Badge variant="secondary">{announcement.categories.name}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {announcement.description}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-primary">
                          ${announcement.price.toLocaleString()}
                        </span>
                      </div>
                      {announcement.location && (
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {announcement.location}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        by {announcement.profiles.username}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex gap-2">
                      <Link to={`/announcement/${announcement.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {user && announcement.user_id !== user.id && (
                        <Button
                          variant="default"
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
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-40 shrink-0">
                        {announcement.images && announcement.images.length > 0 ? (
                          <img
                            src={announcement.images[0]}
                            alt={announcement.title}
                            className="w-full h-32 sm:h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 sm:h-full bg-muted flex items-center justify-center">
                            <Megaphone className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <CardContent className="p-4 flex-1">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <CardTitle className="text-xl">{announcement.title}</CardTitle>
                            <Badge variant="secondary" className="shrink-0">{announcement.categories.name}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {announcement.description}
                          </p>
                          <div className="flex items-center gap-4 mb-2 flex-wrap">
                            <span className="text-2xl font-bold text-primary">
                              ${announcement.price.toLocaleString()}
                            </span>
                            {announcement.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-1" />
                                {announcement.location}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {announcement.profiles.username}
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex gap-2">
                          <Link to={`/announcement/${announcement.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          {user && announcement.user_id !== user.id && (
                            <Button
                              variant="default"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
