import { createContext, useContext, ReactNode } from 'react';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

interface MessageNotificationContextType {
  unreadCount: number;
  unreadByConversation: Record<string, number>;
  markAsRead: (conversationId: string) => Promise<void>;
  refetch: () => Promise<void>;
  isSubscribed: boolean;
}

const MessageNotificationContext = createContext<MessageNotificationContextType | null>(null);

export function MessageNotificationProvider({ children }: { children: ReactNode }) {
  const notifications = useMessageNotifications();

  return (
    <MessageNotificationContext.Provider value={notifications}>
      {children}
    </MessageNotificationContext.Provider>
  );
}

export function useMessageNotificationContext() {
  const context = useContext(MessageNotificationContext);
  if (!context) {
    throw new Error('useMessageNotificationContext must be used within MessageNotificationProvider');
  }
  return context;
}
