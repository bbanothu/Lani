import { useEffect, useState, type FormEvent } from 'react';
import {
  LLMSettings,
  LogEntry,
  CapturedProduct,
  getSettings,
  saveSettings,
  getOutbox,
  clearOutbox,
  getLogs,
  clearLogs,
  getNonProductDomains,
  unmarkDomainAsNonProduct,
  clearNonProductDomains,
  isPaused,
  setPaused,
} from '../lib/storage';

const PROVIDER_LABELS: Record<LLMSettings['provider'], string> = {
  claude: 'Claude',
  openrouter: 'OpenRouter',
  ollama: 'Ollama (local)',
};

const DEFAULT_MODELS: Record<LLMSettings['provider'], string> = {
  claude: 'claude-sonnet-5',
  openrouter: '',
  ollama: 'llama3.1',
};

const LEVEL_STYLES: Record<LogEntry['level'], string> = {
  info: 'text-ink/50',
  success: 'text-green-600',
  error: 'text-red-600',
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

type View = 'main' | 'settings';
type SettingsTab = 'logs' | 'blacklist' | 'ai';
interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function sendMessage<T = any>(message: object): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

function AuthGate({ onSignedIn }: { onSignedIn: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await sendMessage<{ ok: boolean; error?: string }>(
      mode === 'signup'
        ? { type: 'authSignUp', email, password, name }
        : { type: 'authSignIn', email, password },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Something went wrong');
      return;
    }
    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
      return;
    }
    const { user } = await sendMessage<{ ok: boolean; user: AuthUser | null }>({
      type: 'authGetUser',
    });
    if (user) onSignedIn(user);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-10 gap-6">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="" className="w-12 h-12 rounded-md" />
        <span className="font-bold text-ink tracking-tight text-2xl">Lani</span>
      </div>
      <form onSubmit={handleSubmit} className="w-full space-y-2.5">
        {mode === 'signup' && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => {
          setError('');
          setMode(mode === 'signin' ? 'signup' : 'signin');
        }}
        className="text-xs font-medium text-ink/50 hover:text-ink"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
      <p className="text-[11px] text-ink/30 text-center">
        Sign in to start capturing products -- Lani won't watch any page until you do.
      </p>
    </div>
  );
}

function fetchOllamaModels(
  baseUrl: string,
): Promise<{ ok: true; models: string[] } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'listOllamaModels', baseUrl }, resolve);
  });
}

export default function SidePanel() {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [view, setView] = useState<View>('main');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('logs');
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [outbox, setOutbox] = useState<CapturedProduct[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaModelsError, setOllamaModelsError] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [paused, setPausedState] = useState(false);

  const handleTogglePause = async () => {
    const next = !paused;
    await setPaused(next);
    setPausedState(next);
  };

  const refreshOllamaModels = async (baseUrl: string) => {
    setLoadingModels(true);
    setOllamaModelsError('');
    const result = await fetchOllamaModels(baseUrl);
    if (result.ok) {
      setOllamaModels(result.models);
    } else {
      setOllamaModels([]);
      setOllamaModelsError(result.error || 'Could not reach Ollama');
    }
    setLoadingModels(false);
  };

  const refresh = () => {
    getOutbox().then(setOutbox);
    getLogs().then(setLogs);
    getNonProductDomains().then(setBlacklist);
  };

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      if (s.provider === 'ollama') {
        refreshOllamaModels(s.ollamaBaseUrl || 'http://localhost:11434/v1');
      }
    });
    isPaused().then(setPausedState);
    refresh();
    const refreshAuth = () =>
      sendMessage<{ ok: boolean; user: AuthUser | null }>({ type: 'authGetUser' }).then((res) =>
        setAuthUser(res.ok ? res.user : null),
      );
    refreshAuth();
    const interval = setInterval(() => {
      refresh();
      refreshAuth();
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    await sendMessage({ type: 'authSignOut' });
    setAuthUser(null);
  };

  const handleProviderChange = (provider: LLMSettings['provider']) => {
    setSettings((prev) => ({
      provider,
      apiKey: prev?.apiKey || '',
      model: DEFAULT_MODELS[provider],
      ollamaBaseUrl: prev?.ollamaBaseUrl || 'http://localhost:11434/v1',
    }));
    if (provider === 'ollama') {
      refreshOllamaModels(settings?.ollamaBaseUrl || 'http://localhost:11434/v1');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    await saveSettings(settings);
    setSaveStatus('Settings saved.');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleUnblock = async (domain: string) => {
    await unmarkDomainAsNonProduct(domain);
    setBlacklist(await getNonProductDomains());
  };

  const handleClearBlacklist = async () => {
    await clearNonProductDomains();
    setBlacklist(await getNonProductDomains());
  };

  const handleClearOutbox = async () => {
    await clearOutbox();
    setOutbox(await getOutbox());
  };

  const handleClearLogs = async () => {
    await clearLogs();
    setLogs(await getLogs());
  };

  if (authUser === undefined || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authUser === null) {
    return <AuthGate onSignedIn={setAuthUser} />;
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex items-center gap-4 px-5 py-8 border-b border-ink/10 bg-white/60 backdrop-blur-sm">
        <img src="/icon.png" alt="" className="w-14 h-14 rounded-md" />
        <div className="flex flex-col">
          <span className="font-bold text-ink tracking-tight text-2xl leading-tight">Lani</span>
          <span className="text-[11px] text-ink/40 truncate max-w-[140px]">{authUser.email}</span>
        </div>
        <span className="ml-auto flex items-center gap-3 text-sm text-ink/50">
          <span
            className={`w-4 h-4 rounded-full ${
              paused ? 'bg-ink/30' : 'bg-green-500 animate-pulse'
            }`}
          />
          {paused ? 'paused' : 'watching'}
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-ink/40 hover:text-red-500"
          >
            Sign out
          </button>
        </span>
        <button
          onClick={() => setView(view === 'settings' ? 'main' : 'settings')}
          aria-label="Settings"
          className={`p-3 rounded-lg transition-colors ${
            view === 'settings'
              ? 'bg-brand/10 text-brand'
              : 'text-ink/40 hover:text-ink hover:bg-ink/5'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      {view === 'settings' && (
        <nav className="px-5 pt-4">
          <div className="flex rounded-full border border-ink/10 bg-white p-1 text-sm shadow-sm">
            {(
              [
                ['logs', 'Logs'],
                ['blacklist', `Blacklist (${blacklist.length})`],
                ['ai', 'AI'],
              ] as [SettingsTab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSettingsTab(key)}
                className={`flex-1 py-1.5 rounded-full font-medium transition-colors text-xs ${
                  settingsTab === key
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-1 px-5 py-5 space-y-3 overflow-y-auto">
        {view === 'main' && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-ink/40">Captured ({outbox.length})</p>
              {outbox.length > 0 && (
                <button
                  onClick={handleClearOutbox}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            {outbox.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 text-center text-sm text-ink/50">
                Nothing captured yet -- browse to a shopping site and this will fill up.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm divide-y divide-ink/5">
                {outbox.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-ink/5 overflow-hidden shrink-0">
                      {p.image && (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{p.title}</p>
                      <p className="text-[11px] text-ink/40 truncate">
                        {p.domain} · {timeAgo(p.capturedAt)}
                      </p>
                      {p.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-ink/50 bg-ink/5 rounded-full px-1.5 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {p.price != null && (
                      <span className="text-xs font-semibold text-brand shrink-0">
                        {p.currency}
                        {p.price}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'settings' && settingsTab === 'logs' && (
          <>
            {logs.length > 0 && (
              <div className="flex justify-end px-1">
                <button
                  onClick={handleClearLogs}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
            {logs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 text-center text-sm text-ink/50">
                No activity yet -- browse to a shopping site and this will fill up.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-ink/10 shadow-sm divide-y divide-ink/5">
                {logs.map((log, i) => (
                  <div key={i} className="px-4 py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink truncate">{log.domain}</span>
                      <span className="text-ink/30 shrink-0">{timeAgo(log.time)}</span>
                    </div>
                    <p className={LEVEL_STYLES[log.level]}>{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'settings' && settingsTab === 'blacklist' && (
          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-ink/50">
                Domains the AI has said aren't product sites -- future pages on these are skipped
                automatically without asking the AI again.
              </p>
              {blacklist.length > 0 && (
                <button
                  onClick={handleClearBlacklist}
                  className="text-xs text-red-500 hover:text-red-600 font-medium shrink-0"
                >
                  Clear all
                </button>
              )}
            </div>
            {blacklist.length === 0 ? (
              <p className="text-sm text-ink/40 text-center py-4">Nothing blacklisted yet.</p>
            ) : (
              <div className="space-y-1.5">
                {blacklist.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between text-sm bg-ink/[0.03] rounded-lg px-3 py-2"
                  >
                    <span className="text-ink truncate">{domain}</span>
                    <button
                      onClick={() => handleUnblock(domain)}
                      className="text-xs text-brand hover:text-brand-dark font-medium shrink-0 ml-2"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && settingsTab === 'ai' && (
          <>
            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink text-sm">
                  {paused ? 'Detection paused' : 'Detection running'}
                </h2>
                <p className="text-xs text-ink/50 mt-0.5">
                  {paused
                    ? 'Not checking any pages right now.'
                    : 'Checking pages you visit for products.'}
                </p>
              </div>
              <button
                onClick={handleTogglePause}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  paused
                    ? 'bg-brand text-white hover:bg-brand-dark'
                    : 'bg-ink/10 text-ink hover:bg-ink/15'
                }`}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-ink/10 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">
                  AI Provider
                </label>
                <div className="flex flex-wrap gap-1 rounded-xl border border-ink/10 bg-ink/[0.03] p-1">
                  {(Object.keys(PROVIDER_LABELS) as LLMSettings['provider'][]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        settings.provider === p
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-ink/50 hover:text-ink'
                      }`}
                    >
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {settings.provider !== 'ollama' && (
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder={`Your ${PROVIDER_LABELS[settings.provider]} API key`}
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                  />
                </div>
              )}

              {settings.provider === 'ollama' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-ink/70">
                      Ollama server URL
                    </label>
                    <button
                      onClick={() =>
                        refreshOllamaModels(settings.ollamaBaseUrl || 'http://localhost:11434/v1')
                      }
                      className="text-xs text-brand hover:text-brand-dark font-medium"
                    >
                      {loadingModels ? 'Checking...' : 'Refresh models'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.ollamaBaseUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ollamaBaseUrl: e.target.value,
                      })
                    }
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                  />
                  {ollamaModelsError && (
                    <p className="text-xs text-red-500 mt-1">{ollamaModelsError}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1.5">Model</label>
                {settings.provider === 'ollama' && ollamaModels.length > 0 ? (
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow bg-white"
                  >
                    {!ollamaModels.includes(settings.model) && (
                      <option value={settings.model}>{settings.model}</option>
                    )}
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    placeholder={
                      settings.provider === 'openrouter'
                        ? 'e.g. anthropic/claude-sonnet-5'
                        : settings.provider === 'ollama'
                          ? 'e.g. llama3.1'
                          : 'e.g. claude-sonnet-5'
                    }
                    className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-shadow"
                  />
                )}
                {settings.provider === 'ollama' &&
                  ollamaModels.length === 0 &&
                  !loadingModels &&
                  !ollamaModelsError && (
                    <p className="text-xs text-ink/40 mt-1">
                      Couldn't list installed models -- typing one in manually.
                    </p>
                  )}
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                Save Settings
              </button>
              {saveStatus && <p className="text-xs text-green-600 text-center">{saveStatus}</p>}
            </div>
          </>
        )}
      </main>

      <footer className="px-5 py-3 text-center text-[11px] text-ink/30">
        Everything stays on your device 🐾
      </footer>
    </div>
  );
}
