import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export function useProducts(opts: { includeInactive?: boolean } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('name');
    if (!opts.includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) console.error(error);
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, [opts.includeInactive]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProduct = async (input: Omit<Product, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('products').insert(input);
    if (error) throw error;
    await refresh();
  };

  const updateProduct = async (id: string, input: Partial<Product>) => {
    const { error } = await supabase.from('products').update(input).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  return { products, loading, refresh, createProduct, updateProduct, deleteProduct };
}
