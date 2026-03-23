export type ProductSource = 'amazon' | 'wayfair' | 'google_shopping';

export type Product = {
  id: string;
  generation_id: string;
  name: string;
  price: string;
  image_url: string;
  buy_url: string;
  source: ProductSource;
  created_at: string;
};

export type ProductResult = {
  query: string;
  product: Product | null;
};
