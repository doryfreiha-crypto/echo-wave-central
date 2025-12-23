import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, MapPin, ArrowLeft, MessageSquare, Calendar, Eye, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { getCategoryFields } from '@/lib/categoryFields';

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
  views_count: number;
  attributes: Record<string, any>;
  categories: Category;
  profiles: {
    username: string;
    full_name: string | null;
    phone: string | null;
  };
}

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
      incrementViews();
      if (user) {
        checkFavoriteStatus();
      }
    }
  }, [id, user]);

  const incrementViews = async () => {
    if (!id) return;
    
    // Fetch current views count and increment
    const { data: current } = await supabase
      .from('announcements')
      .select('views_count')
      .eq('id', id)
      .single();
    
    if (current) {
      await supabase
        .from('announcements')
        .update({ views_count: current.views_count + 1 })
        .eq('id', id);
    }
  };

  const fetchAnnouncement = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        categories (id, name, slug),
        profiles (username, full_name, phone)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      toast.error('Announcement not found');
      navigate('/');
    } else {
      setAnnouncement({
        ...data,
        attributes: (data.attributes as Record<string, any>) || {}
      });
    }
    setLoading(false);
  };

  const checkFavoriteStatus = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('announcement_id', id)
      .maybeSingle();

    if (data) {
      setIsFavorite(true);
      setFavoriteId(data.id);
    } else {
      setIsFavorite(false);
      setFavoriteId(null);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please login to save favorites');
      navigate('/auth');
      return;
    }

    if (!announcement) return;

    if (isFavorite && favoriteId) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) {
        toast.error('Failed to remove from favorites');
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
        toast.success('Removed from favorites');
      }
    } else {
      // Add to favorites
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          announcement_id: announcement.id,
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to add to favorites');
      } else {
        setIsFavorite(true);
        setFavoriteId(data.id);
        toast.success('Added to favorites');
      }
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Please login to contact the seller');
      navigate('/auth');
      return;
    }

    if (!announcement || announcement.user_id === user.id) {
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
        navigate(`/chat/${existingConv.id}`);
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

      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading announcement...</p>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-2">
                <Megaphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Echo Wave Central</span>
            </Link>
            
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to listings
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-[16/9] bg-muted relative">
                  {announcement.images && announcement.images.length > 0 ? (
                    <img
                      src={announcement.images[selectedImage]}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Megaphone className="w-24 h-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {announcement.images && announcement.images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {announcement.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${announcement.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{announcement.description}</p>
              </CardContent>
            </Card>

            {/* Additional Details */}
            {announcement.attributes && Object.keys(announcement.attributes).length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      const categoryName = announcement.categories?.name || '';
                      const fieldDefs = getCategoryFields(categoryName);
                      const fieldMap = new Map(fieldDefs.map(f => [f.name, f.label]));
                      
                      return Object.entries(announcement.attributes).map(([key, value]) => {
                        if (value === null || value === undefined || value === '') return null;
                        const label = fieldMap.get(key) || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                            <p className="font-medium mt-1">{String(value)}</p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{announcement.title}</h1>
                  <p className="text-4xl font-bold text-primary">€{announcement.price?.toFixed(2)}</p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span>{announcement.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span>{announcement.views_count} views</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Badge variant="outline">{announcement.categories.name}</Badge>
                </div>

                {user && announcement.user_id !== user.id && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleContactSeller}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contact Seller
                    </Button>
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      className="w-full"
                      size="lg"
                      onClick={toggleFavorite}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save to Favorites'}
                    </Button>
                  </>
                )}
                {user && announcement.user_id === user.id && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Saved' : 'Save to Favorites'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Seller Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Username: </span>
                    <span className="font-medium">{announcement.profiles.username}</span>
                  </p>
                  {announcement.profiles.full_name && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{announcement.profiles.full_name}</span>
                    </p>
                  )}
                  {announcement.profiles.phone && user && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{announcement.profiles.phone}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
