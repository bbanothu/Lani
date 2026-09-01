export type LLMProvider = 'claude' | 'openrouter' | 'ollama';

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  ollamaBaseUrl?: string;
}

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const KEY = 'lani_llm_settings';

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  provider: 'ollama',
  apiKey: '',
  model: 'llama3.1',
  ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
};

export function getLLMSettings(): LLMSettings {
  if (typeof window === 'undefined') return DEFAULT_LLM_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_LLM_SETTINGS, ...JSON.parse(raw) } : DEFAULT_LLM_SETTINGS;
  } catch {
    return DEFAULT_LLM_SETTINGS;
  }
}

export function saveLLMSettings(settings: LLMSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
