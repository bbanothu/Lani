export type LLMProvider = 'claude' | 'openrouter' | 'ollama';

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  ollamaBaseUrl?: string;
}

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const KEY = 'lani_llm_settings';

// Sensible starting model for each provider. Used to pre-fill the model field
// when a provider is picked so a saved key works without hand-typing an id.
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  ollama: 'llama3.1',
  claude: 'claude-sonnet-5',
  openrouter: 'anthropic/claude-3.5-sonnet',
};

// True when `model` is just one provider's default (i.e. not a user's own choice),
// so switching providers can safely swap it for the new provider's default.
export function isDefaultModel(model: string): boolean {
  return Object.values(DEFAULT_MODELS).includes(model.trim());
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  provider: 'ollama',
  apiKey: '',
  model: DEFAULT_MODELS.ollama,
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
  // Pasted keys/models often carry stray whitespace or newlines, which makes the
  // provider reject the request with a confusing 401 — normalize before storing.
  const clean: LLMSettings = {
    ...settings,
    apiKey: settings.apiKey.trim(),
    model: settings.model.trim(),
    ollamaBaseUrl: settings.ollamaBaseUrl?.trim(),
  };
  localStorage.setItem(KEY, JSON.stringify(clean));
}
