import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Membership } from '../types';

export function useMyMembership(clientId: string | undefined) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    supabase
      .from('gm_memberships')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setMembership((data as Membership) ?? null);
        setLoading(false);
      });
  }, [clientId]);

  return { membership, loading };
}
