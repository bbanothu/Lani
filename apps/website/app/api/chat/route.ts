import { NextResponse } from 'next/server';

import type { ChatMessage, LLMSettings } from '@/lib/llm';
import { DEFAULT_LLM_SETTINGS } from '@/lib/llm';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  const messages = (body.messages ?? []) as ChatMessage[];
  const settings: LLMSettings = { ...DEFAULT_LLM_SETTINGS, ...(body.settings ?? {}) };

  if (!messages.length) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  let upstream: Response;
  let extractDelta: (json: any) => string | undefined;

  try {
    if (settings.provider === 'claude') {
      if (!settings.apiKey) {
        return NextResponse.json({ error: 'Claude API key missing' }, { status: 400 });
      }
      const system = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n');
      const rest = messages.filter((m) => m.role !== 'system');
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-sonnet-5',
          system: system || undefined,
          messages: rest.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 800,
          stream: true,
        }),
      });
      extractDelta = (json) => (json.type === 'content_block_delta' ? json.delta?.text : undefined);
    } else if (settings.provider === 'openrouter') {
      if (!settings.apiKey) {
        return NextResponse.json({ error: 'OpenRouter API key missing' }, { status: 400 });
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      };
      upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages,
          max_tokens: 800,
          temperature: 0.5,
          stream: true,
        }),
      });
      extractDelta = (json) => json.choices?.[0]?.delta?.content;
    } else {
      return NextResponse.json(
        { error: 'Ollama requests must be sent directly from the browser, not through this route' },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { error: `upstream error: ${upstream.status} ${text}`.trim() },
      { status: 500 },
    );
  }

  const upstreamReader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await upstreamReader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const delta = extractDelta(JSON.parse(data));
          if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
