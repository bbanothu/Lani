import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getLLMSettings(): Promise<LLMSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_LLM_SETTINGS;
  try {
    return { ...DEFAULT_LLM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LLM_SETTINGS;
  }
}

export async function saveLLMSettings(settings: LLMSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
