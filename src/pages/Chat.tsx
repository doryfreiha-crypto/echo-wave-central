import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useMessageNotificationContext } from '@/components/MessageNotificationProvider';
import { useUserWarnings } from '@/hooks/useUserWarnings';
import { BannedUserAlert } from '@/components/BannedUserAlert';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ConversationDetails {
  id: string;
  announcement_id: string;
  buyer_id: string;
  seller_id: string;
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
}

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markAsRead } = useMessageNotificationContext();
  const { activeBan, isBanned } = useUserWarnings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversation();
    fetchMessages();
    setupRealtimeSubscription();
    
    // Mark messages as read when entering the chat
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [user, conversationId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          announcements (title, price),
          buyer_profile:profiles!conversations_buyer_id_fkey (username),
          seller_profile:profiles!conversations_seller_id_fkey (username)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching conversation:', error);
      }
      toast.error('Failed to load conversation');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching messages:', error);
      }
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate message
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: validation.data.content,
      });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error sending message:', error);
      }
      toast.error('Failed to send message');
    }
  };

  const getOtherUser = () => {
    if (!conversation) return '';
    const isBuyer = conversation.buyer_id === user?.id;
    return isBuyer ? conversation.seller_profile.username : conversation.buyer_profile.username;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{conversation?.announcements.title}</h2>
              <p className="text-sm text-muted-foreground">
                Chatting with: {getOtherUser()}
              </p>
            </div>
            <p className="text-lg font-semibold text-primary">
              €{conversation?.announcements.price}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <Card
                className={`p-3 max-w-md ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t">
        <div className="container mx-auto px-4 py-4">
          {isBanned && activeBan ? (
            <BannedUserAlert activeBan={activeBan} />
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
