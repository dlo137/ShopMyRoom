import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Generation } from '../types/generation';
import { Product } from '../types/product';

export type GenerationWithProducts = Generation & { products: Product[] };

export function useHistory() {
  const [generations, setGenerations] = useState<GenerationWithProducts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: gens, error: gensError } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (gensError) throw new Error(gensError.message);
      if (!gens || gens.length === 0) {
        setGenerations([]);
        return;
      }

      const genIds = gens.map((g) => g.id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('generation_id', genIds);

      if (productsError) throw new Error(productsError.message);

      const productsByGenId = (products ?? []).reduce<Record<string, Product[]>>(
        (acc, p) => {
          if (!acc[p.generation_id]) acc[p.generation_id] = [];
          acc[p.generation_id].push(p);
          return acc;
        },
        {}
      );

      setGenerations(
        gens.map((g) => ({ ...g, products: productsByGenId[g.id] ?? [] }))
      );
    } catch (err: any) {
      setError(err.message ?? 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  return { generations, loading, error, refetch: fetchHistory };
}
