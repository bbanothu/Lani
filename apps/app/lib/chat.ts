import type { ChatMessage, LLMSettings } from './llm';
import { DEFAULT_LLM_SETTINGS } from './llm';

function sseRequest(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  onData: (data: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);

    let sent = 0;
    let buffer = '';
    xhr.onprogress = () => {
      buffer += xhr.responseText.slice(sent);
      sent = xhr.responseText.length;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) onData(trimmed.slice(5).trim());
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`${url} error: ${xhr.status} ${xhr.responseText}`.trim()));
    };
    xhr.onerror = () => reject(new Error(`${url} network error`));
    xhr.send(JSON.stringify(body));
  });
}

async function openAICompatibleStream(
  baseUrl: string,
  messages: ChatMessage[],
  settings: LLMSettings,
  useAuth: boolean,
  onDelta: (full: string) => void,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useAuth && settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;

  let full = '';
  await sseRequest(
    `${baseUrl.replace(/\/$/, '')}/chat/completions`,
    headers,
    { model: settings.model, messages, max_tokens: 800, temperature: 0.5, stream: true },
    (data) => {
      if (data === '[DONE]') return;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {}
    },
  );
  return full;
}

async function claudeStream(
  messages: ChatMessage[],
  settings: LLMSettings,
  onDelta: (full: string) => void,
): Promise<string> {
  const system = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const rest = messages.filter((m) => m.role !== 'system');

  let full = '';
  await sseRequest(
    'https://api.anthropic.com/v1/messages',
    {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
    },
    {
      model: settings.model || 'claude-sonnet-5',
      system: system || undefined,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 800,
      stream: true,
    },
    (data) => {
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta' && json.delta?.text) {
          full += json.delta.text;
          onDelta(full);
        }
      } catch {}
    },
  );
  return full;
}

export async function streamChat(
  messages: ChatMessage[],
  settings: LLMSettings,
  onDelta: (full: string) => void,
): Promise<string> {
  if (settings.provider === 'claude') {
    if (!settings.apiKey) throw new Error('Claude API key missing -- add one in Profile');
    return claudeStream(messages, settings, onDelta);
  }
  if (settings.provider === 'openrouter') {
    if (!settings.apiKey) throw new Error('OpenRouter API key missing -- add one in Profile');
    return openAICompatibleStream(
      'https://openrouter.ai/api/v1',
      messages,
      settings,
      true,
      onDelta,
    );
  }
  return openAICompatibleStream(
    settings.ollamaBaseUrl || DEFAULT_LLM_SETTINGS.ollamaBaseUrl!,
    messages,
    settings,
    false,
    onDelta,
  );
}
