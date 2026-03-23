const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!;

export async function extractItemsFromImage(imageUrl: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: imageUrl },
              },
              {
                type: 'text',
                text: 'Analyze this interior design room image. Identify each unique type of furniture or decor item visible — if the same item appears multiple times (e.g. two identical beds), list it only once. For each unique item write a SHORT Amazon-searchable description (4-8 words max). Focus on: sofas, chairs, tables, lamps, rugs, beds, dressers, shelves, curtains, artwork.\nReturn ONLY a raw JSON array of strings. No markdown, no explanation.\nExample: ["mid century walnut coffee table", "white linen accent chair"]',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    let raw: string = data.content[0].text;

    // Strip ```json fences if present
    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    const items: string[] = JSON.parse(raw);
    return items.slice(0, 6);
  } catch {
    return [];
  }
}
