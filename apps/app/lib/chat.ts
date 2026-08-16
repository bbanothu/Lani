import type { ChatMessage, LLMSettings } from './llm';
import { DEFAULT_LLM_SETTINGS } from './llm';

async function openAICompatible(
  baseUrl: string,
  messages: ChatMessage[],
  settings: LLMSettings,
  useAuth: boolean,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useAuth && settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      max_tokens: 800,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${baseUrl} error: ${response.status} ${response.statusText} ${body}`.trim());
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function claudeCompletion(messages: ChatMessage[], settings: LLMSettings): Promise<string> {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const rest = messages.filter((m) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: settings.model || 'claude-sonnet-4-20250514',
      system: system || undefined,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 800,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }
  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || '';
}

export async function sendChat(messages: ChatMessage[], settings: LLMSettings): Promise<string> {
  if (settings.provider === 'claude') {
    if (!settings.apiKey) throw new Error('Claude API key missing -- add one in Profile');
    return claudeCompletion(messages, settings);
  }
  if (settings.provider === 'openrouter') {
    if (!settings.apiKey) throw new Error('OpenRouter API key missing -- add one in Profile');
    return openAICompatible('https://openrouter.ai/api/v1', messages, settings, true);
  }
  return openAICompatible(
    settings.ollamaBaseUrl || DEFAULT_LLM_SETTINGS.ollamaBaseUrl!,
    messages,
    settings,
    false,
  );
}
