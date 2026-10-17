import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CartLine, Order, OrderSource } from '../types';

export function useOrders(opts: { clientId?: string; all?: boolean } = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(*)), profiles!orders_client_id_fkey(*)')
      .order('created_at', { ascending: false });
    if (!opts.all && opts.clientId) query = query.eq('client_id', opts.clientId);
    const { data, error } = await query;
    if (error) console.error(error);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [opts.clientId, opts.all]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkout = async (
    cart: CartLine[],
    clientId: string | null,
    paymentMethod: string,
    source: OrderSource,
    notes?: string
  ) => {
    const items = cart.map((l) => ({ product_id: l.product.id, quantity: l.quantity }));
    const { data, error } = await supabase.rpc('create_order', {
      p_items: items,
      p_client_id: clientId,
      p_payment_method: paymentMethod,
      p_source: source,
      p_notes: notes ?? null
    });
    if (error) throw error;
    await refresh();
    return data as string;
  };

  return { orders, loading, refresh, checkout };
}
