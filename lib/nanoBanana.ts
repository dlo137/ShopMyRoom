// lib/nanoBanana.ts

export const STYLES = [
  'Modern',
  'Scandinavian',
  'Bohemian',
  'Industrial',
  'Coastal',
  'Maximalist',
  'Mid-Century',
  'Minimalist',
];

const API_KEY = process.env.EXPO_PUBLIC_NANOBANANA_KEY!;
const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export async function listAvailableModels(): Promise<void> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
  );
  const data = await res.json();
  const imageModels = data.models?.filter((m: any) =>
    m.supportedGenerationMethods?.includes('generateContent') &&
    (m.name.includes('flash') || m.name.includes('imagen') || m.name.includes('2.0') || m.name.includes('2.5'))
  );
  console.log('[Models]', JSON.stringify(imageModels?.map((m: any) => m.name), null, 2));
}

export async function generateRoom(imageUrl: string, style: string): Promise<string> {
  console.log('[NanaBanana] Starting generation — style:', style);

  // Step 1: Fetch source image and convert to base64
  console.log('[NanaBanana] Fetching source image:', imageUrl);
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Failed to fetch source image: ${imageRes.status}`);
  const imageBlob = await imageRes.blob();
  const base64Data = await blobToBase64(imageBlob);
  console.log('[NanaBanana] base64 length:', base64Data.length);

  // Step 2: Send to Gemini image generation
  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: buildPrompt(style),
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 1,
      topP: 0.95,
    },
  };

  console.log('[NanaBanana] Sending request to Gemini...');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const resText = await res.text();
  console.log('[NanaBanana] Response status:', res.status);

  if (!res.ok) {
    throw new Error(`Gemini API failed (${res.status}): ${resText}`);
  }

  // Step 3: Extract base64 image from response
  const data = JSON.parse(resText);
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart) {
    const textPart = parts.find((p: any) => p.text);
    console.log('[NanaBanana] No image in response. Text part:', textPart?.text ?? 'none');
    throw new Error('No image returned from Gemini. Check console for details.');
  }

  console.log('[NanaBanana] Got generated image, mime:', imagePart.inlineData.mimeType);
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

function buildPrompt(style: string): string {
  return `You are an expert interior designer. Redesign this room in a ${style} style.

Requirements:
- Keep the exact same room layout, dimensions, windows, and doors
- Replace all furniture, decor, and surfaces with ${style} style equivalents
- Use a cohesive color palette appropriate for ${style} interior design
- Maintain realistic lighting and shadows that match the original photo
- Output a photorealistic interior design photo, high resolution, professionally staged
- Do NOT add people or text overlays

The result should look like a professional real estate or interior design photograph.`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/jpeg;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
