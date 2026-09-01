import { LLMSettings } from './storage';

// Same three providers as the Lani desktop app's settings, minus
// OpenAI/Gemini -- this extension only offers Claude, OpenRouter, or a
// locally-run Ollama model.
export async function chatCompletion(prompt: string, settings: LLMSettings): Promise<string> {
  if (settings.provider === 'claude') {
    return claudeCompletion(prompt, settings);
  }
  return openAICompatibleCompletion(
    settings.provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : settings.ollamaBaseUrl || 'http://localhost:11434/v1',
    prompt,
    settings,
    settings.provider === 'openrouter',
  );
}

async function openAICompatibleCompletion(
  baseUrl: string,
  prompt: string,
  settings: LLMSettings,
  useAuth: boolean,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (useAuth) headers.Authorization = `Bearer ${settings.apiKey}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    // statusText is always empty on HTTP/2 responses (no reason-phrase in
    // the h2 status line), so fall back to the body for anything useful.
    const body = await response.text().catch(() => '');
    throw new Error(`${baseUrl} error: ${response.status} ${response.statusText} ${body}`.trim());
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// Ollama's model-list endpoint lives at the plain /api root, not under the
// OpenAI-compatible /v1 path used for chat completions.
export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  const host = baseUrl.replace(/\/v1\/?$/, '');
  const response = await fetch(`${host}/api/tags`);
  if (!response.ok) {
    throw new Error(`Could not reach Ollama at ${host} (${response.status})`);
  }
  const data = await response.json();
  return (data.models || []).map((m: { name: string }) => m.name);
}

async function claudeCompletion(prompt: string, settings: LLMSettings): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model || 'claude-sonnet-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Claude API error: ${response.status} ${response.statusText} ${body}`.trim());
  }
  const data = await response.json();
  const textBlock = data.content.find((b: any) => b.type === 'text');
  return textBlock?.text || '';
}
