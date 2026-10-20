import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ClassSession, GymClass } from '../types';

export function useGymClasses() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('gm_classes').select('*').order('name');
    if (error) console.error(error);
    setClasses((data as GymClass[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createClass = async (input: Omit<GymClass, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('gm_classes').insert(input);
    if (error) throw error;
    await refresh();
  };

  const updateClass = async (id: string, input: Partial<GymClass>) => {
    const { error } = await supabase.from('gm_classes').update(input).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from('gm_classes').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  return { classes, loading, refresh, createClass, updateClass, deleteClass };
}

// Sessions in [from, to), with how many active bookings each one has.
export function useClassSessions(from: Date, to: Date) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gm_class_sessions')
      .select('*, gym_classes:gm_classes(*), bookings:gm_bookings!left(count)')
      .eq('bookings.status', 'booked')
      .gte('start_time', from.toISOString())
      .lt('start_time', to.toISOString())
      .order('start_time');

    if (error) {
      console.error(error);
      setSessions([]);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      booked_count: row.bookings?.[0]?.count ?? 0
    })) as ClassSession[];
    setSessions(mapped);
    setLoading(false);
  }, [from.getTime(), to.getTime()]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSession = async (input: Omit<ClassSession, 'id' | 'created_at' | 'gym_classes' | 'booked_count'>) => {
    const { error } = await supabase.from('gm_class_sessions').insert(input);
    if (error) throw error;
    await refresh();
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('gm_class_sessions').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  return { sessions, loading, refresh, createSession, deleteSession };
}
