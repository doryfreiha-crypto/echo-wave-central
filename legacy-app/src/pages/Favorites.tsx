import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, MapPin, LogOut, LayoutDashboard, MessageSquare, Heart, Plus, ArrowLeft } from 'lucide-react';
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

interface Favorite {
  id: string;
  announcement_id: string;
  created_at: string;
  announcements: Announcement;
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      checkAdminRole();
    } else {
      window.location.href = '/auth';
    }
  }, [user]);

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

  const fetchFavorites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        announcement_id,
        created_at,
        announcements (
          id,
          title,
          description,
          price,
          location,
          images,
          created_at,
          user_id,
          categories (id, name, slug),
          profiles (username)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load favorites');
      console.error(error);
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string, announcementTitle: string) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) {
      toast.error('Failed to remove favorite');
    } else {
      toast.success(`Removed "${announcementTitle}" from favorites`);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleContactSeller = async (announcement: Announcement) => {
    if (!user) {
      toast.error('Please login to contact the seller');
      return;
    }

    if (announcement.user_id === user.id) {
      toast.error("You can't message yourself");
      return;
    }

    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('announcement_id', announcement.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existingConv) {
        window.location.href = `/chat/${existingConv.id}`;
        return;
      }

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
              <Button asChild variant="ghost">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/messages">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/my-listings">My Listings</Link>
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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-2">
            {favorites.length} saved {favorites.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading your favorites...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-4">No favorites yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Start exploring and save announcements you're interested in
            </p>
            <Button asChild>
              <Link to="/">Browse Announcements</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const announcement = favorite.announcements;
              return (
                <Card key={favorite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0 relative">
                    {announcement.images && announcement.images.length > 0 ? (
                      <img
                        src={announcement.images[0]}
                        alt={announcement.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Megaphone className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeFavorite(favorite.id, announcement.title)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
