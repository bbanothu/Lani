import { supabase } from './supabase';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  productIds: string[];
  createdAt: string;
}

type SessionRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  product_ids: string[];
  created_at: string;
};

function sessionFromRow(row: SessionRow): ChatSession {
  return { id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at };
}

function messageFromRow(row: MessageRow): StoredChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    productIds: row.product_ids ?? [],
    createdAt: row.created_at,
  };
}

export function titleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed || 'New chat';
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(sessionFromRow);
}

export async function getChatMessages(sessionId: string): Promise<StoredChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(messageFromRow);
}

export async function createChatSession(title: string): Promise<ChatSession> {
  const { data, error } = await supabase.from('chat_sessions').insert({ title }).select().single();
  if (error) throw error;
  return sessionFromRow(data);
}

export async function addChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  productIds: string[] = [],
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content, product_ids: productIds });
  if (error) throw error;
}
