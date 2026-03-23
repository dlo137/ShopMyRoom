-- Generations table
CREATE TABLE generations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users,
  original_image_url   text,
  generated_image_url  text,
  style                text,
  status               text DEFAULT 'pending',
  created_at           timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id  uuid REFERENCES generations(id) ON DELETE CASCADE,
  name           text,
  price          text,
  image_url      text,
  buy_url        text,
  source         text,
  created_at     timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Generations policies
CREATE POLICY "generations_select" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "generations_insert" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generations_update" ON generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "products_select" ON products
  FOR SELECT USING (
    generation_id IN (SELECT id FROM generations WHERE user_id = auth.uid())
  );

CREATE POLICY "products_insert" ON products
  FOR INSERT WITH CHECK (
    generation_id IN (SELECT id FROM generations WHERE user_id = auth.uid())
  );
