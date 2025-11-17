import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, Search, MapPin, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

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
  categories: Category;
  profiles: {
    username: string;
  };
}

export default function Home() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchAnnouncements();
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory, searchQuery]);

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
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load announcements');
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
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

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Badge
            variant={!selectedCategory ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('')}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="text-center py-12">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No announcements found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/announcement/${announcement.id}`}>
                  <CardHeader className="p-0">
                    <div className="aspect-[4/3] bg-muted relative">
                      {announcement.images && announcement.images.length > 0 ? (
                        <img
                          src={announcement.images[0]}
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Megaphone className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {announcement.title}
                    </CardTitle>
                    <p className="text-2xl font-bold text-primary mb-2">
                      €{announcement.price?.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {announcement.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{announcement.location}</span>
                    </div>
                  </CardContent>
                </Link>
                <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <Badge variant="outline">{announcement.categories.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      by {announcement.profiles.username}
                    </span>
                  </div>
                  {user && announcement.user_id !== user.id && (
                    <Button
                      className="w-full"
                      variant="default"
                      size="sm"
                      onClick={() => handleContactSeller(announcement)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Seller
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
