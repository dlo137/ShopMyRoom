import { Product, ProductResult } from '../types/product';
import { extractItemsFromImage } from './claude';

const SERPAPI_KEY = process.env.EXPO_PUBLIC_SERPAPI_KEY!;

export async function searchProduct(query: string): Promise<Product | null> {
  try {
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: query,
      api_key: SERPAPI_KEY,
      num: '3',
      gl: 'us',
      hl: 'en',
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    const results: any[] = data.shopping_results;
    if (!results || results.length === 0) return null;

    const result =
      results.find((r) => r.source?.toLowerCase().includes('wayfair')) ?? results[0];

    return {
      id: '',
      generation_id: '',
      name: result.title,
      price: result.price,
      image_url: result.thumbnail,
      buy_url: result.link ?? result.product_link ?? result.serpapi_product_api,
      source: 'google_shopping',
      created_at: '',
    };
  } catch {
    return null;
  }
}

export async function getProductsForRoom(imageUrl: string): Promise<ProductResult[]> {
  const items = await extractItemsFromImage(imageUrl);

  const settled = await Promise.allSettled(
    items.map((query) =>
      searchProduct(query).then((product) => ({ query, product }))
    )
  );

  const seenNames = new Set<string>();
  return settled
    .filter(
      (r): r is PromiseFulfilledResult<ProductResult> =>
        r.status === 'fulfilled' && r.value.product !== null
    )
    .map((r) => r.value)
    .filter(({ product }) => {
      const key = product!.name.toLowerCase().trim();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });
}
