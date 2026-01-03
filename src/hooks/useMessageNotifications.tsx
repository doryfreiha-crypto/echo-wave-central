import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface UnreadCount {
  total: number;
  byConversation: Record<string, number>;
}

export function useMessageNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({ total: 0, byConversation: {} });
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      // Get conversations where user is participant
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount({ total: 0, byConversation: {} });
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Get unread messages not sent by current user
      const { data: unreadMessages, error } = await supabase
        .from('messages')
        .select('id, conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Count by conversation
      const byConversation: Record<string, number> = {};
      (unreadMessages || []).forEach(msg => {
        byConversation[msg.conversation_id] = (byConversation[msg.conversation_id] || 0) + 1;
      });

      setUnreadCount({
        total: unreadMessages?.length || 0,
        byConversation,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark messages as read for a conversation
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setUnreadCount(prev => {
        const convCount = prev.byConversation[conversationId] || 0;
        const newByConversation = { ...prev.byConversation };
        delete newByConversation[conversationId];
        
        return {
          total: Math.max(0, prev.total - convCount),
          byConversation: newByConversation,
        };
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Only notify if message is not from current user
          if (newMessage.sender_id === user.id) return;

          // Check if user is part of this conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('id, buyer_id, seller_id, announcements:announcement_id(title)')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;
          
          const isParticipant = conversation.buyer_id === user.id || conversation.seller_id === user.id;
          if (!isParticipant) return;

          // Update unread count
          setUnreadCount(prev => ({
            total: prev.total + 1,
            byConversation: {
              ...prev.byConversation,
              [newMessage.conversation_id]: (prev.byConversation[newMessage.conversation_id] || 0) + 1,
            },
          }));

          // Show toast notification
          const announcementTitle = (conversation.announcements as any)?.title || 'a listing';
          toast.info('New message', {
            description: `You have a new message about "${announcementTitle}"`,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = `/chat/${newMessage.conversation_id}`;
              },
            },
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          const oldMessage = payload.old as Message;
          
          // If message was marked as read, update count
          if (!oldMessage.is_read && updatedMessage.is_read && updatedMessage.sender_id !== user.id) {
            setUnreadCount(prev => {
              const newByConversation = { ...prev.byConversation };
              const currentCount = newByConversation[updatedMessage.conversation_id] || 0;
              
              if (currentCount <= 1) {
                delete newByConversation[updatedMessage.conversation_id];
              } else {
                newByConversation[updatedMessage.conversation_id] = currentCount - 1;
              }
              
              return {
                total: Math.max(0, prev.total - 1),
                byConversation: newByConversation,
              };
            });
          }
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  return {
    unreadCount: unreadCount.total,
    unreadByConversation: unreadCount.byConversation,
    markAsRead,
    refetch: fetchUnreadCount,
    isSubscribed,
  };
}
