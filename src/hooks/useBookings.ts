import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types';

export function useMyBookings(clientId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, class_sessions(*, gym_classes(*))')
      .eq('client_id', clientId)
      .eq('status', 'booked')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const book = async (sessionId: string) => {
    if (!clientId) throw new Error('No hay usuario autenticado');
    const { error } = await supabase.from('bookings').insert({ session_id: sessionId, client_id: clientId });
    if (error) throw error;
    await refresh();
  };

  const cancel = async (bookingId: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    if (error) throw error;
    await refresh();
  };

  return { bookings, loading, refresh, book, cancel };
}
