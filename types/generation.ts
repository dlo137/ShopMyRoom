export type GenerationStatus = 'pending' | 'processing' | 'complete' | 'failed';

export type Generation = {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string | null;
  style: string;
  status: GenerationStatus;
  created_at: string;
};
