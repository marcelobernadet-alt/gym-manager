import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Membership, Profile } from '../types';

export interface MemberRow extends Profile {
  memberships?: Membership[];
}

// Owner-only: the full roster of clients plus their membership history.
export function useMembers() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, memberships(*)')
      .eq('role', 'client')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setMembers((data as MemberRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Registers a brand-new member before they've ever logged in. If they later
  // sign in with Google using this same email, their account links up to this
  // profile automatically (see the handle_new_auth_user trigger).
  const addMember = async (input: {
    full_name: string;
    email: string;
    phone?: string;
    plan_name?: string;
    plan_price?: number;
  }) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ full_name: input.full_name, email: input.email, phone: input.phone ?? null, role: 'client' })
      .select()
      .single();
    if (profileError) throw profileError;

    if (input.plan_name) {
      const { error: membershipError } = await supabase.from('memberships').insert({
        client_id: profile.id,
        plan_name: input.plan_name,
        price: input.plan_price ?? 0
      });
      if (membershipError) throw membershipError;
    }

    await refresh();
    return profile as Profile;
  };

  const updateMember = async (id: string, input: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(input).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const addMembership = async (clientId: string, input: Omit<Membership, 'id' | 'client_id' | 'created_at'>) => {
    const { error } = await supabase.from('memberships').insert({ ...input, client_id: clientId });
    if (error) throw error;
    await refresh();
  };

  const updateMembership = async (id: string, input: Partial<Membership>) => {
    const { error } = await supabase.from('memberships').update(input).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  return { members, loading, refresh, addMember, updateMember, addMembership, updateMembership };
}
