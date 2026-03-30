import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { generateRoom } from '../lib/nanoBanana';
import { getProductsForRoom } from '../lib/serpapi';
import { Product, ProductResult } from '../types/product';

type Status =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'extracting'
  | 'searching'
  | 'saving'
  | 'done'
  | 'error';

export function useGenerate() {
  const [status, setStatus] = useState<Status>('idle');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function startGeneration(localImageUri: string, style: string, room: string = 'Living Room') {
    try {
      setError(null);

      // 1. Upload original image
      setStatus('uploading');

      // Ensure URI has file:// prefix required by FileSystem on iOS
      console.log('[useGenerate] localImageUri:', localImageUri);
      console.log('[useGenerate] FileSystem:', JSON.stringify(Object.keys(FileSystem)));
      const uri = localImageUri.startsWith('file://') ? localImageUri : `file://${localImageUri}`;
      console.log('[useGenerate] reading uri:', uri);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      console.log('[useGenerate] base64 length:', base64?.length);
      if (!base64) throw new Error('Failed to read image file');

      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('room-originals')
        .upload(filename, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from('room-originals')
        .getPublicUrl(filename);

      const originalImageUrl = publicUrlData.publicUrl;

      // 2. Insert generation row
      const { data: { session } } = await supabase.auth.getSession();

      const { data: generation, error: insertError } = await supabase
        .from('generations')
        .insert({
          user_id: session?.user.id ?? '00000000-0000-0000-0000-000000000000',
          original_image_url: originalImageUrl,
          style,
          status: 'processing',
        })
        .select('id')
        .single();

      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);
      const generationId: string = generation.id;

      // 3. Generate room via NanoBanana
      setStatus('generating');

      // generateRoom returns a data URI: "data:image/jpeg;base64,..."
      const generatedDataUri = await generateRoom(originalImageUrl, style, room);

      // Extract base64 from data URI and upload directly
      const [header, generatedBase64] = generatedDataUri.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
      const generatedFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: genUploadError } = await supabase.storage
        .from('room-generated')
        .upload(generatedFilename, decode(generatedBase64), {
          contentType: mimeType,
          upsert: true,
        });

      if (genUploadError) throw new Error(`Generated upload failed: ${genUploadError.message}`);

      const { data: genPublicUrlData } = supabase.storage
        .from('room-generated')
        .getPublicUrl(generatedFilename);

      const generatedPublicUrl = genPublicUrlData.publicUrl;

      // 4. Update generation row
      const { error: updateError } = await supabase
        .from('generations')
        .update({ generated_image_url: generatedPublicUrl, status: 'complete' })
        .eq('id', generationId);

      if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

      // 5. Extract + search products
      setStatus('extracting');
      const productResults = await getProductsForRoom(generatedPublicUrl);

      // 6. Save products to DB
      setStatus('saving');
      if (productResults.length > 0) {
        const rows = productResults
          .filter((r) => r.product !== null)
          .map((r) => ({
            generation_id: generationId,
            name: r.product!.name,
            price: r.product!.price,
            image_url: r.product!.image_url,
            buy_url: r.product!.buy_url,
            source: r.product!.source,
          }));

        if (rows.length > 0) {
          const { error: productsInsertError } = await supabase
            .from('products')
            .insert(rows);

          if (productsInsertError) {
            throw new Error(`Products insert failed: ${productsInsertError.message}`);
          }
        }
      }

      // 7. Done
      setGeneratedImageUrl(generatedPublicUrl);
      setProducts(productResults);
      setStatus('done');
    } catch (err: any) {
      console.error('[useGenerate] Error:', JSON.stringify(err, null, 2));
      console.error('[useGenerate] Message:', err.message);
      console.error('[useGenerate] Stack:', err.stack);
      setStatus('error');
      setError(err.message ?? 'An unexpected error occurred');
    }
  }

  return { status, generatedImageUrl, products, error, startGeneration };
}

// Decode base64 string to Uint8Array for Supabase storage upload
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
