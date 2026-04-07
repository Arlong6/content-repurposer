export interface Platform {
  id: string;
  name: string;
  icon: string;
  maxLength: number;
  tone: string;
  format: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    maxLength: 280,
    tone: 'concise, punchy, conversational',
    format: 'Short post. Use line breaks for readability. Include 1-3 relevant hashtags at the end.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    maxLength: 3000,
    tone: 'professional, insightful, thought-leadership',
    format: 'Start with a hook line. Use short paragraphs. End with a question or call-to-action. Include 3-5 hashtags.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    maxLength: 2000,
    tone: 'friendly, casual, engaging',
    format: 'Conversational style. Use emojis sparingly. Include a call-to-action. Keep it under 500 words.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    maxLength: 2200,
    tone: 'visual, inspirational, lifestyle',
    format: 'Caption style. Start with a catchy first line. Use emojis. End with 10-15 hashtags on a new line.',
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    maxLength: 500,
    tone: 'casual, authentic, brief',
    format: 'Short and conversational. No hashtags. Like talking to a friend.',
  },
  {
    id: 'medium',
    name: 'Medium / Blog',
    icon: '📝',
    maxLength: 5000,
    tone: 'informative, well-structured, detailed',
    format: 'Article format with a compelling title, intro paragraph, subheadings, and conclusion.',
  },
  {
    id: 'youtube',
    name: 'YouTube Description',
    icon: '🎬',
    maxLength: 5000,
    tone: 'descriptive, SEO-friendly',
    format: 'Video description: summary in first 2 lines, then detailed description, timestamps placeholder, and relevant links section.',
  },
];
