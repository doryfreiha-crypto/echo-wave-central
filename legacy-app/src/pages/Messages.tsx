import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  announcement_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  announcements: {
    title: string;
    price: number;
  };
  buyer_profile: {
    username: string;
  };
  seller_profile: {
    username: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          announcements (title, price),
          buyer_profile:profiles!conversations_buyer_id_fkey (username),
          seller_profile:profiles!conversations_seller_id_fkey (username)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            last_message: messages || undefined,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conv: Conversation) => {
    const isBuyer = conv.buyer_id === user?.id;
    return isBuyer ? conv.seller_profile.username : conv.buyer_profile.username;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start a conversation by contacting a seller
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/chat/${conv.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {conv.announcements.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chatting with: {getOtherUser(conv)}
                    </p>
                    {conv.last_message && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      €{conv.announcements.price}
                    </p>
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.last_message.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
