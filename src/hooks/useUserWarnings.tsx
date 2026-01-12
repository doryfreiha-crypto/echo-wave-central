import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface UserWarning {
  id: string;
  warning_type: string;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

interface UseUserWarningsResult {
  warnings: UserWarning[];
  activeBan: UserWarning | null;
  isBanned: boolean;
  loading: boolean;
}

export function useUserWarnings(userId?: string): UseUserWarningsResult {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    fetchWarnings();
  }, [targetUserId]);

  const fetchWarnings = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_warnings')
        .select('id, warning_type, reason, created_at, expires_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for active ban (permanent or not yet expired)
  const activeBan = warnings.find((w) => {
    if (w.warning_type !== 'permanent_ban' && w.warning_type !== 'temporary_ban') {
      return false;
    }
    // Permanent ban is always active
    if (w.warning_type === 'permanent_ban') {
      return true;
    }
    // Temporary ban - check if it's still active
    if (w.expires_at) {
      return new Date(w.expires_at) > new Date();
    }
    return false;
  }) || null;

  const isBanned = activeBan !== null;

  return { warnings, activeBan, isBanned, loading };
}

// Hook for checking another user's public warnings
export function usePublicWarnings(userId: string) {
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchWarnings();
  }, [userId]);

  const fetchWarnings = async () => {
    try {
      // This will only return data if the current user is an admin
      // due to RLS policies - regular users can only see their own
      const { data, error } = await supabase
        .from('user_warnings')
        .select('id, warning_type, reason, created_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Access denied is expected for non-admins viewing other users
        setWarnings([]);
      } else {
        setWarnings(data || []);
      }
    } catch (error) {
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const activeBan = warnings.find((w) => {
    if (w.warning_type !== 'permanent_ban' && w.warning_type !== 'temporary_ban') {
      return false;
    }
    if (w.warning_type === 'permanent_ban') {
      return true;
    }
    if (w.expires_at) {
      return new Date(w.expires_at) > new Date();
    }
    return false;
  }) || null;

  const isBanned = activeBan !== null;

  return { warnings, activeBan, isBanned, loading };
}
