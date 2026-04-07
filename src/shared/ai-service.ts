import type { Platform } from './platforms';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface RepurposeOptions {
  tone: string;
  language: string;
  customInstruction: string;
}

export async function repurposeContent(
  apiKey: string,
  content: string,
  platforms: Platform[],
  options: RepurposeOptions
): Promise<Record<string, string>> {
  const platformInstructions = platforms
    .map(
      (p) =>
        `"${p.id}": Rewrite for ${p.name}. Tone: ${p.tone}. Format: ${p.format}. Max ${p.maxLength} characters.`
    )
    .join('\n');

  const toneOverride = options.tone !== 'default'
    ? `\nOVERRIDE TONE: Use a ${options.tone} tone for ALL platforms.`
    : '';

  const languageRule = options.language === 'auto'
    ? '- Write in the same language as the original content'
    : `- Write ALL output in ${options.language}`;

  const customRule = options.customInstruction.trim()
    ? `\nCUSTOM INSTRUCTION: ${options.customInstruction.trim()}`
    : '';

  const prompt = `You are a professional content repurposer. Given the following content, rewrite it for each target platform.

ORIGINAL CONTENT:
${content.slice(0, 3000)}

TARGET PLATFORMS:
${platformInstructions}
${toneOverride}${customRule}

RULES:
- Adapt the style and length for each platform
- Keep the core message intact
- Make each version feel native to that platform
${languageRule}
- Do NOT add explanations, just the content

Return a JSON object where keys are platform IDs and values are the rewritten content.
Example: {"twitter": "...", "linkedin": "..."}

Return ONLY the JSON, no markdown fences.`;

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
    if (response.status === 400) throw new Error('Invalid API key. Check your settings.');
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.filter((p: any) => p.text)
    ?.map((p: any) => p.text)
    ?.join('') || '';

  return parseJSON(text);
}

function parseJSON(text: string): Record<string, string> {
  let cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
